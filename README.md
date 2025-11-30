# Hatchery

![CI](https://github.com/KyleDerZweite/hatchery/workflows/CI/badge.svg)

**Modpack-to-Server Automation Platform**

> IMPORTANT: This project is under development and is not a stable, released product. It is provided "as-is", without warranty or guarantee. It works to some extent, but may be incomplete, unstable, or contain bugs. Mentions of a version such as "v2" do not imply an official release.

The website is currently functional, however, the functionality is not fully tested/verified, and egg deployment (even for Modrinth) has not been thoroughly tested. Currently, only Modrinth parsing is implemented, as CurseForge integration would require an API key, making the process significantly more complex without one.

Hatchery allows users to input CurseForge or Modrinth modpack URLs, automatically converts them into Pterodactyl/Pelican "Egg" configurations, and deploys them to remote panels via API.

## Features

- **URL Import**: Paste a CurseForge or Modrinth modpack URL
- **Egg Generation**: Automatically generate Pterodactyl/Pelican egg configurations
- **Panel Deployment**: Deploy eggs directly to your game panels via API
- **Multi-User**: Role-based access (Admin/User) with public/private eggs
- **Secure**: OAuth2 authentication with JWT tokens
- **Modloader Support**: Forge, Fabric, NeoForge, and Quilt

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/hatchery.git
cd hatchery

# Copy environment file
cp .env.example .env

# Start the application
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Local Development

#### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run the server
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
hatchery/
├── docker-compose.yml     # Docker orchestration
├── DEVELOPMENT.md         # Developer guide
├── CONTRIBUTING.md        # Contribution guidelines
├── backend/               # Python FastAPI application
│   ├── app/
│   │   ├── api/          # API routers
│   │   ├── core/         # Config, security, database
│   │   ├── models/       # SQLModel database models
│   │   └── services/     # Business logic (modpack parsing, egg generation)
│   └── requirements.txt
├── frontend/              # TypeScript React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities and API client
│   │   └── hooks/        # Custom React hooks
│   └── package.json
└── legacy/                # Reference implementations (read-only)
```

## Configuration

### Environment Variables

| Variable              | Description                   | Default                 |
| --------------------- | ----------------------------- | ----------------------- |
| `DATABASE_URL`        | Database connection string    | `sqlite:///hatchery.db` |
| `SECRET_KEY`          | JWT signing key               | (generated)             |
| `CURSEFORGE_API_KEY`  | CurseForge API key (optional) | -                       |
| `PTERODACTYL_URL`     | Panel URL for deployment      | -                       |
| `PTERODACTYL_API_KEY` | Panel API key                 | -                       |
| `VITE_API_URL`        | Backend API URL for frontend  | `http://localhost:8000` |

### Database

By default, Hatchery uses SQLite for easy local setup. To use PostgreSQL:

1. Uncomment the `postgres` service in `docker-compose.yml`
2. Set `DATABASE_URL=postgresql://hatchery:hatchery@postgres:5432/hatchery`

## Documentation

- **[Development Guide](./DEVELOPMENT.md)** - Setup, architecture, and development workflow
- **[Contributing](./CONTRIBUTING.md)** - How to contribute to the project
- **[API Docs](http://localhost:8000/docs)** - Interactive API documentation (when running)

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## License

MIT License
