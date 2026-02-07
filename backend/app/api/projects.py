"""
Projects API router - CRUD and export endpoints for AI-generated modpacks.

All endpoints require authentication via Zitadel JWT.
Access control is based on owner_id field matching the JWT subject.

Security considerations:
- All endpoints protected by default (require auth)
- Owner-based access control
- Input validation via Pydantic
- No sensitive data in responses
"""

from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime

import structlog
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlmodel import select

from app.core import CurrentUser, SessionDep
from app.core.constants import LOADERS, TEMPLATES
from app.models.mod import ModReference, ModVersion
from app.models.project import (
    ModInProject,
    Project,
    ProjectCreate,
    ProjectListRead,
    ProjectMods,
    ProjectModsRead,
    ProjectQuests,
    ProjectQuestsRead,
    ProjectRead,
    ProjectStatus,
    ProjectVisibility,
)
from app.services import export_service
from app.services.ai_service import get_ai_service
from app.services.modrinth_service import (
    fetch_and_cache_mod,
    new_http_client,
    search_mods,
)

logger = structlog.get_logger()

router = APIRouter(prefix="/projects", tags=["Projects"])


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    visibility: ProjectVisibility | None = None


class ProjectCreateResponse(BaseModel):
    """Response for project creation with status info."""

    project: ProjectRead
    message: str = "Project created and queued for processing"


@router.post("", response_model=ProjectCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    current_user: CurrentUser,
    session: SessionDep,
) -> dict:
    """
    Create a new AI-generated modpack project.

    The project is queued for background processing which:
    1. Searches Modrinth for relevant mods
    2. Uses AI to select best mods
    3. Resolves dependencies
    4. Generates quest storyline

    Requires authentication. The project is owned by the authenticated user.
    """
    if body.loader not in LOADERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid loader '{body.loader}'. Must be one of: {', '.join(LOADERS)}",
        )

    invalid_templates = [t for t in body.templates if t not in TEMPLATES]
    if invalid_templates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid template(s): {', '.join(invalid_templates)}. "
            f"Must be from: {', '.join(TEMPLATES)}",
        )

    project = Project(
        name=body.name,
        owner_id=current_user.id,
        mc_version=body.mc_version,
        loader=body.loader,
        user_prompt=body.user_prompt,
        templates=body.templates,
        status=ProjectStatus.QUEUED,
    )
    session.add(project)
    await session.commit()
    await session.refresh(project)

    logger.info(
        "project_created",
        project_id=str(project.id),
        owner_id=current_user.id,
        name=project.name,
        mc_version=project.mc_version,
        loader=project.loader,
    )

    try:
        await _process_project_async(
            project.id, body.user_prompt, body.mc_version, body.loader, body.templates
        )
        project.status = ProjectStatus.READY
        project.updated_at = datetime.now(UTC)
        session.add(project)
        await session.commit()
        await session.refresh(project)
    except Exception as e:
        project.status = ProjectStatus.FAILED
        project.error_message = str(e)[:500]
        project.updated_at = datetime.now(UTC)
        session.add(project)
        await session.commit()
        logger.error(
            "project_processing_failed",
            project_id=str(project.id),
            error=str(e),
        )

    return {
        "project": ProjectRead.from_model(project),
        "message": "Project created and processed",
    }


async def _process_project_async(
    project_id: uuid.UUID,
    user_prompt: str,
    mc_version: str,
    loader: str,
    templates: list[str],
) -> None:
    """
    Process a project synchronously (for now).

    In production, this would be a background task via arq.
    """
    from app.core.db import async_session_factory

    ai = get_ai_service()

    async with async_session_factory() as session:
        project = await session.get(Project, project_id)
        if not project:
            return

        project.status = ProjectStatus.PROCESSING
        project.updated_at = datetime.now(UTC)
        session.add(project)
        await session.commit()

        async with new_http_client() as http:
            keywords = [w for w in user_prompt.split() if len(w) > 3][:6]
            generic_tags = ["automation", "technology", "magic", "adventure", "utility"]

            all_results = []
            seen_ids = set()

            for word in keywords + generic_tags[:2]:
                results = await search_mods(http, word, mc_version, loader, limit=10)
                for r in results:
                    if r.project_id not in seen_ids:
                        seen_ids.add(r.project_id)
                        all_results.append(r)

            candidate_descs = [
                f"- {c.slug}: {c.title} - {c.description[:80]}... (dl: {c.downloads})"
                for c in all_results[:100]
            ]

            ai_result = await ai.select_mods(
                candidate_descriptions=candidate_descs,
                user_prompt=user_prompt,
                mc_version=mc_version,
                loader=loader,
                template_names=templates,
            )
            selected_slugs = ai_result.get("selected_slugs", [])
            project.ai_reasoning = ai_result.get("reasoning", "")[:2000]

            validated_versions: list[ModVersion] = []
            for slug in selected_slugs:
                try:
                    ref, ver = await fetch_and_cache_mod(session, http, slug, mc_version, loader)
                    if ver:
                        validated_versions.append(ver)
                except Exception as e:
                    logger.warning("mod_fetch_failed", slug=slug, error=str(e))

            seen_version_ids = set()
            for ver in validated_versions:
                if ver.id not in seen_version_ids:
                    seen_version_ids.add(ver.id)
                    session.add(
                        ProjectMods(
                            project_id=project.id,
                            mod_version_id=ver.id,
                            is_dependency=False,
                        )
                    )

            await session.commit()

            mod_descs = [
                f"- {c.slug}: {c.title} - {c.description[:80]}"
                for c in all_results[:50]
                if c.slug in selected_slugs
            ]

            outline = await ai.generate_quest_outline(
                mod_descriptions=mod_descs,
                user_prompt=user_prompt,
                template_names=templates,
            )

            from app.services.quest_service import count_quests, generate_quest_files

            quest_files = generate_quest_files(outline)
            total = count_quests(outline)

            session.add(
                ProjectQuests(
                    project_id=project.id,
                    story_title=str(outline.get("title", ""))[:255],
                    story_description=str(outline.get("description", ""))[:5000],
                    quest_files_json=json.dumps(quest_files),
                    total_quests=total,
                )
            )

            await session.commit()


@router.get("", response_model=ProjectListRead)
async def list_projects(
    current_user: CurrentUser,
    session: SessionDep,
    skip: int = 0,
    limit: int = 50,
) -> dict:
    """
    List projects owned by the current user.

    Admin users can see all projects.
    """
    query = select(Project)

    if not current_user.is_admin:
        query = query.where(Project.owner_id == current_user.id)

    query = query.order_by(Project.created_at.desc()).offset(skip).limit(limit)

    result = await session.exec(query)
    projects = list(result.all())

    return {
        "projects": [ProjectRead.from_model(p) for p in projects],
        "total": len(projects),
    }


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> ProjectRead:
    """
    Get a specific project by ID.

    Users can only access their own projects.
    Admins can access all projects.
    """
    project = await session.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if not current_user.is_admin and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project",
        )

    return ProjectRead.from_model(project)


@router.get("/{project_id}/mods", response_model=ProjectModsRead)
async def get_project_mods(
    project_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> dict:
    """
    Get all mods for a project.

    Users can only access their own projects.
    """
    project = await session.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if not current_user.is_admin and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project",
        )

    stmt = (
        select(ProjectMods, ModVersion, ModReference)
        .join(ModVersion, ProjectMods.mod_version_id == ModVersion.id)
        .join(ModReference, ModVersion.mod_reference_id == ModReference.id)
        .where(ProjectMods.project_id == project_id)
        .order_by(ProjectMods.is_dependency, ModReference.title)
    )
    result = await session.exec(stmt)
    rows = list(result.all())

    mods = [
        ModInProject(
            slug=ref.slug,
            title=ref.title or ref.slug,
            description=ref.description[:200] if ref.description else "",
            icon_url=ref.icon_url,
            version_number=ver.version_number,
            filename=ver.filename,
            download_url=ver.download_url,
            is_dependency=pm.is_dependency,
        )
        for pm, ver, ref in rows
    ]

    return {"mods": mods, "count": len(mods)}


@router.get("/{project_id}/quests", response_model=ProjectQuestsRead)
async def get_project_quests(
    project_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> dict:
    """
    Get quest data for a project.

    Users can only access their own projects.
    """
    project = await session.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if not current_user.is_admin and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this project",
        )

    stmt = select(ProjectQuests).where(ProjectQuests.project_id == project_id)
    result = await session.exec(stmt)
    quests = result.first()

    if not quests:
        return {
            "story_title": "",
            "story_description": "",
            "total_quests": 0,
            "quest_files": {},
        }

    try:
        quest_files = json.loads(quests.quest_files_json)
    except json.JSONDecodeError:
        quest_files = {}

    return {
        "story_title": quests.story_title,
        "story_description": quests.story_description,
        "total_quests": quests.total_quests,
        "quest_files": quest_files,
    }


@router.get("/{project_id}/export")
async def export_project(
    project_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> Response:
    """
    Download the .mrpack for a completed project.

    Users can only export their own projects.
    Project must be in READY status.
    """
    project = await session.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if not current_user.is_admin and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to export this project",
        )

    if project.status != ProjectStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project is not ready (status={project.status})",
        )

    mrpack_bytes = await export_service.generate_mrpack(session, project_id)
    filename = await export_service.generate_mrpack_filename(project)

    logger.info(
        "project_exported",
        project_id=str(project_id),
        filename=filename,
        size_bytes=len(mrpack_bytes),
    )

    return Response(
        content=mrpack_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(mrpack_bytes)),
        },
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    current_user: CurrentUser,
    session: SessionDep,
) -> None:
    """
    Delete a project.

    Users can only delete their own projects.
    Admins can delete any project.
    """
    project = await session.get(Project, project_id)

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if not current_user.is_admin and project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this project",
        )

    await session.delete(project)
    await session.commit()

    logger.info(
        "project_deleted",
        project_id=str(project_id),
        owner_id=current_user.id,
    )
