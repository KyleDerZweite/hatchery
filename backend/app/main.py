from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import select

from app.api import api_router
from app.core import settings, get_password_hash
from app.core.db import init_db, async_session_maker
from app.models import User, UserRole


async def create_default_admin():
    """Create default admin user if no users exist."""
    async with async_session_maker() as session:
        # Check if any users exist
        result = await session.execute(select(User).limit(1))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            return  # Users exist, don't create default admin
        
        # Create the default admin user
        admin = User(
            username=settings.default_admin_username,
            email=settings.default_admin_email,
            hashed_password=get_password_hash(settings.default_admin_password),
            role=UserRole.ADMIN,
            is_active=True,
        )
        
        session.add(admin)
        await session.commit()
        
        print(f"✅ Created default admin user: {settings.default_admin_username}")
        print(f"   Email: {settings.default_admin_email}")
        print(f"   Password: {settings.default_admin_password}")
        print("   ⚠️  PLEASE CHANGE THE DEFAULT PASSWORD IMMEDIATELY!")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    await init_db()
    await create_default_admin()
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Modpack-to-Server Automation Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.app_version}


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }
