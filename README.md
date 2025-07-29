# NeuraCRM

A multi-tenant CRM application with modular architecture, designed for localhost deployment.

## Quick Start

### 🚀 One-Command Setup (New System)
```bash
git clone https://github.com/ralakdedev/NeuraCRM.git NeuraCRM
cd NeuraCRM
make setup
```

**Requirements**: Python 3.11+, Node.js 18+, PostgreSQL 12+

This automated setup will:
- ✅ Check system requirements
- ✅ Create virtual environment  
- ✅ Install all dependencies (Python + Node.js)
- ✅ Initialize PostgreSQL database
- ✅ Run migrations
- ✅ Seed demo data with sample users
- ✅ Display login credentials and URLs

### 📋 Manual Setup
```bash
make install     # Install dependencies
make db-init     # Initialize database  
make migrate     # Run migrations
make seed        # Seed demo data
make dev         # Start servers
```

## Features

- **Multi-tenancy**: Schema-based isolation
- **Custom Roles**: Extensible RBAC system
- **Module Management**: Enable/disable modules per subscription
- **Superadmin**: Monitor and manage all tenants
- **Localhost Deployment**: Optimized for local development

## Architecture

- **Backend**: Django with django-tenants
- **Frontend**: React with TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT with custom roles

## Development

See `CLAUDE.md` for detailed development guidance.


NOTE:
The seed script might not be working because of some migration changes. Hence use the Superadmin page to create a new tenant.
