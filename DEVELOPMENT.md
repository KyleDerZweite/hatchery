# Hatchery Development Guide

## Project Overview

Hatchery is a Modpack-to-Server automation platform that converts CurseForge and Modrinth modpack URLs into deployable Pterodactyl/Pelican server eggs.

## Architecture

```
hatchery/
├── backend/          # FastAPI Python backend
├── frontend/         # React TypeScript frontend
├── docker/           # Docker configurations
├── docs/             # Documentation
└── legacy/           # Reference implementations (read-only)
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional, for containerized development)

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# or: .venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Key Services & Components

### Backend (`/backend`)

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI application entry point |
| `app/api/` | API route handlers |
| `app/models/` | SQLModel database models |
| `app/services/modpack_service.py` | **Core**: Modpack URL parsing & egg generation |
| `app/core/config.py` | Application configuration |
| `app/core/security.py` | JWT authentication |

### Frontend (`/frontend`)

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main application component |
| `src/pages/` | Route page components |
| `src/components/` | Reusable UI components |
| `src/lib/api.ts` | API client functions |
| `src/lib/auth-context.tsx` | Authentication state management |

## Modpack Service Details

The `modpack_service.py` is the heart of Hatchery. It handles:

### URL Detection
- Parses CurseForge URLs: `curseforge.com/minecraft/modpacks/{slug}`
- Parses Modrinth URLs: `modrinth.com/modpack/{slug}`
- Extracts version/file IDs when provided

### API Integration
- **Modrinth**: Uses public API (no key required)
- **CurseForge**: Requires `CURSEFORGE_API_KEY` in `.env`

### Supported Modloaders
- Forge
- Fabric
- NeoForge
- Quilt
- Vanilla

### Java Version Detection
| Minecraft Version | Java Version |
|-------------------|--------------|
| 1.21+ | Java 21 |
| 1.18 - 1.20.x | Java 17 |
| 1.17.x | Java 16 |
| 1.12 - 1.16.x | Java 11 |
| < 1.12 | Java 8 |

### Egg Generation
Generates Pterodactyl v2 compatible egg JSON with:
- Appropriate Docker images
- Optimized JVM startup flags
- Modloader-specific install scripts
- Environment variables for customization

## Environment Variables

### Backend (`.env`)

```env
# Required
SECRET_KEY=your-secret-key-here

# Database (SQLite default, or PostgreSQL)
DATABASE_URL=sqlite:///./hatchery.db

# Optional: CurseForge API key for full functionality
CURSEFORGE_API_KEY=your-curseforge-key

# Registration Settings (invite-only mode)
REGISTRATION_ENABLED=true  # Set to false for invite-only
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_EMAIL=admin@hatchery.local
DEFAULT_ADMIN_PASSWORD=changeme123  # CHANGE THIS!

# Optional: Panel integration
PTERODACTYL_URL=https://panel.example.com
PTERODACTYL_API_KEY=your-panel-key
```

## User Management & Authentication

### Default Admin Account

On first startup (when no users exist), Hatchery automatically creates a default admin account:
- **Username**: `admin` (configurable via `DEFAULT_ADMIN_USERNAME`)
- **Email**: `admin@hatchery.local` (configurable via `DEFAULT_ADMIN_EMAIL`)
- **Password**: `changeme123` (configurable via `DEFAULT_ADMIN_PASSWORD`)

⚠️ **IMPORTANT**: Change the default admin password immediately after first login!

### User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access: manage users, system settings, all eggs |
| `user` | Standard access: manage own eggs and panels |

### Invite-Only Mode

To disable public registration and require admin-created accounts:

```env
REGISTRATION_ENABLED=false
```

When disabled:
- The `/api/auth/register` endpoint returns 403 Forbidden
- Only admins can create new users via `/api/admin/users`
- Frontend should hide the registration form (check `/api/auth/registration-status`)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (if enabled)
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/registration-status` - Check if registration is enabled

### Administration (Admin only)
- `GET /api/admin/settings` - Get system settings
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{id}` - Get specific user
- `POST /api/admin/users` - Create new user
- `PATCH /api/admin/users/{id}` - Update user
- `POST /api/admin/users/{id}/reset-password` - Reset user password
- `DELETE /api/admin/users/{id}` - Delete user

### Eggs
- `POST /api/eggs/` - Create new egg from modpack URL
- `GET /api/eggs/` - List user's eggs
- `GET /api/eggs/{id}` - Get specific egg
- `DELETE /api/eggs/{id}` - Delete an egg
- `GET /api/eggs/{id}/download` - Download egg JSON

### AI Assistant (Optional, Opt-in)
- `GET /api/ai/config` - Get current AI configuration
- `PUT /api/ai/config` - Update AI configuration
- `DELETE /api/ai/config` - Disable AI
- `POST /api/ai/test` - Test AI connection
- `POST /api/ai/clean-name` - Clean modpack name
- `POST /api/ai/enhance-description` - Generate/enhance description
- `POST /api/ai/detect-modloader` - Detect modloader from hints
- `POST /api/ai/suggest-java` - Suggest Java version
- `POST /api/ai/fix-parse-error` - Extract info from malformed config

## AI Integration (Optional)

Hatchery supports optional AI assistance for cleaning names, enhancing descriptions, and recovering from parse errors. This feature is **completely opt-in** and requires user configuration.

### Supported Providers

Any OpenAI-compatible API works. Examples:

| Provider | Endpoint | Example Models |
|----------|----------|----------------|
| **OpenRouter** | `https://openrouter.ai/api/v1` | `google/gemini-flash-1.5-8b`, `anthropic/claude-3-haiku` |
| **Ollama** (local) | `http://localhost:11434/v1` | `qwen2.5:0.5b`, `qwen2.5:1.5b`, `llama3.2:1b` |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o-mini` |
| **Anthropic** | Via OpenRouter | `anthropic/claude-3-haiku` |

### Privacy & Minimal Data

AI requests send **only** the minimal data required:

| Task | Data Sent |
|------|-----------|
| Clean Name | Raw name only (max 500 chars) |
| Enhance Description | Name + existing desc (max 200 chars) + modloader |
| Detect Modloader | Hint text only (max 500 chars) |
| Suggest Java | Minecraft version + optional info |
| Fix Parse Error | Config snippet (max 1000 chars) |

No full modpack data, user information, or server configurations are ever sent.

### Configuration Example

```json
{
  "enabled": true,
  "api_endpoint": "https://openrouter.ai/api/v1",
  "api_key": "sk-or-...",
  "model": "google/gemini-flash-1.5-8b",
  "max_tokens": 150,
  "temperature": 0.3
}
```

## Development Commands

### Backend
```bash
# Run tests
pytest

# Run with auto-reload
uvicorn app.main:app --reload

# Format code
black app/
isort app/

# Type checking
mypy app/
```

### Frontend
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Type checking
npm run type-check
```

## Project Conventions

### Code Style
- **Python**: Follow PEP 8, use type hints, prefer async/await
- **TypeScript**: Use strict mode, prefer interfaces over types
- **Both**: Write descriptive docstrings/comments for public APIs

### Git Workflow
1. Create feature branches from `main`
2. Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
3. Open PRs with descriptive titles and descriptions

### File Organization
- Keep related code together
- One component/service per file
- Use index files for public exports

## Troubleshooting

### Common Issues

**Backend won't start**
- Check Python version: `python --version` (need 3.11+)
- Ensure venv is activated
- Verify all dependencies installed

**CurseForge modpacks not working**
- Add `CURSEFORGE_API_KEY` to `.env`
- Get key from: https://console.curseforge.com/

**Frontend can't connect to backend**
- Check backend is running on port 8000
- Verify CORS settings in `backend/app/main.py`

### Debug Mode

Backend with verbose logging:
```bash
LOG_LEVEL=DEBUG uvicorn app.main:app --reload
```

## Legacy Code Reference

The `/legacy` folder contains previous implementations for reference:
- `pelicandeploy/` - Original Celery-based egg generator
- `pterodeploy/` - Flask-based deployment system

These are **read-only references** - all new development should be in the main `backend/` and `frontend/` directories.

## Contributing

1. Check existing issues or create a new one
2. Fork and clone the repository
3. Create a feature branch
4. Make your changes with tests
5. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.
