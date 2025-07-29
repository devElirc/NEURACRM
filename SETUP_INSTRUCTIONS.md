# NeuraCRM Setup Instructions

## Quick Setup Methods

### Method 1: Interactive Setup (Recommended)
```bash
make setup
```
This will prompt for sudo password when needed.

### Method 2: Automated Setup with Sudo Password
```bash
make setup-sudo SUDO_PASSWORD=your_password
```
Replace `your_password` with your actual sudo password.

### Method 3: Environment Variable Setup
```bash
export SUDO_PASSWORD=your_password
./scripts/setup-with-sudo.sh
```

## Database Management

### Reset Database (with proper permissions)
```bash
# Interactive (will prompt for sudo password)
make db-reset

# Or with password
SUDO_PASSWORD=your_password make db-reset
```

### Initialize Database Only
```bash
# Interactive
./scripts/db-init.sh

# Or with password
SUDO_PASSWORD=your_password ./scripts/db-init-with-sudo.sh
```

## What the Setup Scripts Do

1. **Check system requirements** (Python 3.11+, Node.js 18+)
2. **Install dependencies** (Python and Node.js packages)
3. **Initialize PostgreSQL database** with proper permissions:
   - Creates database and user
   - Grants all necessary privileges
   - **Sets up schema permissions** for multi-tenant support
   - Grants CREATE and USAGE on public schema
   - Sets default privileges for future tables and sequences
4. **Run database migrations** (shared and tenant schemas)
5. **Seed demo data** with sample users and CRM data

## Important Notes

- The setup scripts now automatically handle the PostgreSQL permissions issue
- No need to manually grant schema permissions after database reset
- All scripts support both interactive and automated sudo password handling
- The permissions are set up to support Django multi-tenant architecture

## Access Credentials

After setup, you can use these credentials:

- **Super Admin**: admin@neuracrm.com / admin123
- **Demo Manager**: manager@demo.com / demo123
- **Demo Sales Rep**: sales@demo.com / demo123
- **Demo Support**: support@demo.com / demo123
- **Demo Viewer**: viewer@demo.com / demo123

## Development

Start the development servers:
```bash
make dev
```

This will start both the Django backend (port 8000) and React frontend (port 3000).