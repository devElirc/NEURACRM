# CLAUDE.md

This file provides guidance to Claude Code when working with this multi-tenant CRM repository.

## Project Overview

NeuraCRM is a production-ready multi-tenant CRM application with complete authentication system. Features modular architecture with configurable modules per client subscription.

## Prerequisites

- **Python 3.11+** and **Node.js 18+**
- **PostgreSQL 12+** (required for multi-tenancy)

## Quick Setup

```bash
git clone <repository-url> NeuraCRM
cd NeuraCRM
make setup  # Complete automated setup
```

## Development Commands

```bash
make setup           # Complete setup for new system
make dev             # Start both backend and frontend servers
make install         # Install all dependencies
make test            # Run all tests
make lint            # Run all linters
make clean           # Clean install (removes venv & node_modules)

# Database Commands
make db-init         # Initialize PostgreSQL database
make db-reset        # Reset database completely
make migrate         # Run Django migrations (shared + tenant)
make seed            # Seed demo data
make superuser       # Create Django superuser
```

### Backend Commands
```bash
cd services/crm/backend
python manage.py runserver           # Start Django server
python manage.py test               # Run tests
ruff check .                        # Lint code
black .                            # Format code
```

### Frontend Commands
```bash
cd services/crm/frontend
npm run dev          # Start React dev server
npm run test         # Run tests
npm run lint         # Lint code
npm run type-check   # TypeScript checking
npm run build        # Build for production
```

### Theme System
The application includes a complete theme system with the `next-themes` package:

**Key Features:**
- **Light/Dark/System modes** with automatic detection
- **Persistent preferences** across browser sessions
- **Smooth transitions** between theme states
- **Accessible toggle** with proper ARIA labels

**Implementation:**
- **ThemeProvider**: Wraps the app in `/src/contexts/ThemeProvider.tsx`
- **ThemeToggle**: Header component in `/src/components/ThemeToggle.tsx`
- **Package**: `next-themes@^0.4.6` (already installed)
- **CSS Integration**: Works with Tailwind CSS `dark:` classes

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000/api/
- **Super Admin**: http://127.0.0.1:8000/superadmin/
- **Tenant Admin**: http://[tenant].localhost:8000/admin/

## Three-Level Architecture

The system implements a complete three-level multi-tenant SaaS architecture:

```
┌─────────────────────────────────────────────────────────┐
│                SUPER ADMIN                              │
│              System Management                         │
│  • Manage all tenants (companies)                      │
│  • Onboard new companies                               │
│  • System monitoring                                   │
│  • Global user management                              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────┬─────────────────────────────────┐
│   COMPANY A ADMIN   │        COMPANY B ADMIN          │
│   Tenant Management │       Tenant Management         │
│   • Manage company  │       • Manage company          │
│     users & roles   │         users & roles           │
│   • CRM settings    │       • CRM settings            │
│   • Company data    │       • Company data            │
└─────────────────────┴─────────────────────────────────┘
                           │
                           ▼
┌─────────────────────┬─────────────────────────────────┐
│  COMPANY A USERS    │       COMPANY B USERS           │
│  • Sales reps       │       • Sales reps              │
│  • Managers         │       • Managers                │
│  • Viewers          │       • Viewers                 │
│  • CRM operations   │       • CRM operations          │
└─────────────────────┴─────────────────────────────────┘
```

### Level 1: Super Admin (System Management)
**Location**: `apps/core/` + `/superadmin/` interface
**Database**: Public schema
- **Models**: User, Client, Domain
- **Access**: http://127.0.0.1:8000/superadmin/
- **APIs**: `/api/auth/tenants/` (tenant creation, listing)
- **Responsibilities**: Manage all tenants, onboard companies, system monitoring

### Level 2: Company Admin (Tenant Management)
**Location**: `apps/tenant_core/` + `/admin/` interface
**Database**: Tenant-specific schemas
- **Models**: TenantUser (proxy), Role, UserRole, AuditLog
- **Access**: http://[tenant].localhost:8000/admin/
- **APIs**: `/api/tenant/` endpoints
- **Responsibilities**: Manage company users & roles, configure tenant settings

### Level 3: Company Users (End Users)
**Location**: Same tenant schema as Level 2 + CRM modules
**Database**: Same tenant-specific schemas
- **Models**: TenantUser with role-based permissions + CRM models
- **Access**: Frontend CRM interface
- **APIs**: CRM module APIs (leads, contacts, accounts, deals)
- **Responsibilities**: Daily CRM operations within assigned permissions

## Authentication & Authorization

### Authentication Flow
1. User submits credentials to `/api/auth/login/`
2. JWT tokens generated (60min expiry, auto-refresh with expiration validation)
3. `TenantMiddleware` routes requests to correct tenant schema
4. `JWTAuthentication` validates tokens and loads user
5. RBAC system checks permissions per module

### Role-Based Access Control (RBAC)
- **Admin**: Full access to all modules (`all`)
- **Sales Manager**: Team and opportunity management
- **Sales Rep**: Create/edit leads and contacts
- **Account Manager**: Account and contact management
- **Support Agent**: Handle support tickets
- **Viewer**: Read-only access

#### Available Permissions
- **all**: Full Access
- **manage_team**: Team Management
- **manage_opportunities**: Opportunity Management
- **manage_leads**: Lead Management
- **manage_contacts**: Contact Management
- **manage_accounts**: Account Management
- **manage_tickets**: Ticket Management
- **manage_knowledge_base**: Knowledge Base Management
- **manage_campaigns**: Campaign Management
- **manage_reports**: Report Management
- **manage_settings**: Settings Management
- **view_customers**: Customer View
- **view_only**: Read Only Access

## Core CRM Modules

### ✅ ALL MODULES COMPLETE + OPTIMIZED

**CRM Models**:
- **accounts/models.py** - Account model (21 fields) - ✅ COMPLETE
- **contacts/models.py** - Contact model (21 fields) - ✅ COMPLETE  
- **leads/models.py** - Lead model (23 fields) + convert() method - ✅ COMPLETE
- **opportunities/models.py** - Deal model (13 fields) - ✅ COMPLETE

**Module Features**:
- **Full CRUD operations** for all modules
- **Multi-tab forms** with validation
- **Search and pagination** 
- **Summary cards** and statistics
- **Detail pages** with related data
- **Bulk actions** where applicable
- **API integration** with Tanstack Query
- **RBAC integration** with permission-based UI
- **Deal-Contact Relationships** with primary contact assignment (2025-07-23)

## System Status

**Status**: ✅ **ALL SYSTEMS OPERATIONAL** (Updated 2025-07-23)

### Backend Status
- **API Endpoints**: All CRM modules working (leads, accounts, contacts, opportunities)
- **Authentication**: JWT with tenant-scoped tokens and automatic expiration handling
- **Multi-tenant**: Complete tenant isolation with PostgreSQL schemas
- **Data Models**: All relationships properly configured and tested + Deal-Contact relationships (2025-07-23)
- **Validation**: Comprehensive input validation and error handling
- **Security**: RBAC implemented with proper permission checking

## Demo Credentials

**Access Points**:
- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000/api/
- **Super Admin**: http://127.0.0.1:8000/superadmin/
- **Demo Tenant**: http://demo.localhost:8000/admin/

**Login Credentials**:
- **Superadmin**: admin@neuracrm.com / admin123
- **Demo Manager**: manager@demo.com / demo123
- **Demo Sales Rep**: sales@demo.com / demo123
- **Demo Support**: support@demo.com / demo123
- **Demo Viewer**: viewer@demo.com / demo123

## Creating New Tenants

### Via Super Admin Interface
1. Access: http://127.0.0.1:8000/superadmin/
2. Login: admin@neuracrm.com / admin123
3. Add Client with:
   - Company name
   - Schema name (letters, numbers, underscores only)
   - Admin user details (email, password, names)
   - Domain auto-creation option

System automatically creates client, admin user, domain, and tenant assignment.

## Required Hosts File Entries

```bash
# Add to /etc/hosts for local development
echo "127.0.0.1 demo.localhost" | sudo tee -a /etc/hosts
echo "127.0.0.1 [your_client].localhost" | sudo tee -a /etc/hosts
```

## Security Features

### Multi-Tenant Security
- **User-Tenant Relationship**: Users explicitly assigned to authorized tenants
- **Tenant-Scoped JWT**: Tokens include tenant_schema and validated per request
- **Cross-Tenant Protection**: Tokens from one tenant cannot access another
- **Complete Isolation**: Tenant data isolated at database and application levels
- **Token Expiration Validation**: Automatic cleanup of expired tokens

### Admin Interface Security
- **Tenant Isolation**: Each admin only sees their tenant's data
- **Permission Scoping**: Tenant admins cannot access global settings
- **Auto-Assignment**: New users automatically assigned to current tenant
- **Client Disable**: Inactive tenants blocked with HTTP 503

## Environment Variables

Key variables in `.env`:
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection
- `SECRET_KEY`: Django secret key
- `JWT_SECRET_KEY`: JWT signing key
- `DEBUG`: Development mode flag

## Troubleshooting

### Setup Issues
```bash
# Check versions
python3 --version  # Need 3.11+
node --version     # Need 18+
psql --version     # Need 12+

# Reset everything
make clean && make setup

# Database issues
make db-reset && make migrate
```

### Authentication Issues
- If getting 401 errors on superadmin access, clear browser localStorage
- Backend must be accessed via `127.0.0.1:8000` (not `localhost:8000`)
- Tenant domains need `/etc/hosts` entries
- Check tenant is active in super admin interface

## API Endpoints Available

- `GET/POST /api/leads/` - Lead management
- `GET/POST /api/accounts/` - Account management  
- `GET/POST /api/contacts/` - Contact management
- `GET/POST /api/opportunities/` - Deal management
- `GET /api/accounts/{id}/contacts/` - Account's contacts
- `GET /api/accounts/{id}/deals/` - Account's deals
- `GET /api/accounts/{id}/leads/` - Account's leads
- `POST /api/auth/login/` - Authentication
- `GET /api/accounts/summary/` - Account statistics



**Demo Credentials Verified:**
- ✅ **Demo Tenant**: `sales@demo.com / demo123` (Leads + Contacts access)
- ✅ **Manager Role**: `manager@demo.com / demo123` (Team management access)
- ✅ **Multi-tenant URLs**: `demo.localhost:3000` routing works


### **📊 System Status: FULLY OPERATIONAL**
All core CRM functionality is working perfectly. The system is ready for production use and further development.

## Enhanced Features (2025-07-20)

### Modal-Based Lead Conversion
- **Enhanced Endpoint**: `POST /api/leads/{id}/convert/` supports custom data structure
- **Flexible Conversion**: Can convert to Account+Contact only or include Deal
- **Editable Forms**: Users can review and modify data before conversion
- **Smart Defaults**: Intelligent field mapping and default values

### Contact Creation Enhancement
- **Smart Selectors**: Replaced confusing ID inputs with user-friendly dropdowns
- **Progressive Disclosure**: Three collapsible sections (Essential, Relationships, Address)
- **Auto-Assignment**: Contact owner automatically selected with "You" indicator
- **Reusable Components**: AccountSelect, UserSelect, ContactSelect

### Cache Management Standardization
- **Immediate Updates**: All CRM modules use `await queryClient.refetchQueries({ type: 'active' })`
- **Consistent UX**: Professional, real-time feedback across all modules
- **Performance Optimized**: Only active queries refetched

### Theme System Implementation
- **Theme Provider**: `next-themes` package for seamless light/dark/system mode switching
- **Persistent Themes**: Automatic theme detection and persistence across sessions
- **Theme Toggle**: Accessible toggle button with proper ARIA labels and icons
- **System Integration**: Respects user's system preference by default
- **CSS Integration**: Uses `class` attribute for Tailwind CSS dark mode compatibility

**Components Created:**
- **FormModal System**: Consolidated 4 modal implementations (242 lines → 60 lines)
- **Validation Utilities**: Unified form validation logic (200 lines → 50 lines)  
- **StatsCard Components**: Standardized dashboard cards (100 lines → 20 lines)
- **DataTable System**: Complete table solution with cell components (800+ lines potential)
- **Feedback Components**: Loading, error, and empty state components

**Available Shared Components:**
```typescript
// Forms & Validation
import { FormField, FormSection, validateEmail, validatePhone } from '@/shared'

// UI Components  
import { Button, FormModal, StatsCard, StatsGrid } from '@/shared'

// Theme System
import { AppThemeProvider } from '@/contexts/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'

// Data Display
import { DataTable, TableControls, AvatarCell, BadgeCell, LinkCell, DateCell } from '@/shared'

// Feedback
import { LoadingSpinner, ErrorAlert, EmptyState } from '@/shared'

// Selectors
import { AccountSelect, ContactSelect, UserSelect } from '@/shared'
```

## Development Notes

- **Database**: PostgreSQL with tenant-specific schemas
- **Authentication**: Secure tenant-scoped JWT tokens with automatic expiration handling
- **Architecture**: Multi-tenant system with three-level user hierarchy
- **Security**: Complete tenant isolation at all levels
- **Frontend**: React with TypeScript, TanStack Query for state management
- **Backend**: Django REST Framework with comprehensive API endpoints

# Project Structure
 refer FOLDER_STRUCTURE.md to understand the project structure.