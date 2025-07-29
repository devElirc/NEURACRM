# Project Structure

NeuraCRM is organized as a multi-tenant SaaS CRM application with clear separation between backend Django services and frontend React application, plus comprehensive development tooling.

```
NeuraCRM/
├── 📋 Project Documentation
│   ├── CLAUDE.md                          # Claude Code instructions & project guide
│   ├── README.md                          # Main project documentation
│   ├── SETUP_INSTRUCTIONS.md              # Setup and installation guide
│   ├── MODAL_STRUCTURES.md                # Modal component documentation
│   ├── SECURITY_ASSESSMENT_REPORT.md      # Security analysis report
│   └── security_report.json               # Machine-readable security report
│
├── 🛠️  Development Tools & Config
│   ├── Makefile                           # Development automation commands
│   ├── package.json                       # Root package dependencies
│   ├── package-lock.json                  # Root dependency lock
│   ├── NeuraCRM3.code-workspace           # VS Code workspace configuration
│   └── fix_permissions.sql                # Database permission fixes
│
├── 📁 Scripts & Automation
│   └── scripts/
│       ├── setup-new-system.sh            # Complete system setup
│       ├── setup-with-sudo.sh             # Setup with sudo privileges
│       ├── db-init.sh                     # Database initialization
│       ├── db-init-with-sudo.sh           # Database init with sudo
│       ├── db-reset.sh                    # Database reset utility
│       ├── seed-dev-data.py               # Demo data seeding
│       └── tenant-create.py               # Tenant creation utility
│
├── 🌐 Services Architecture
│   └── services/
│       └── crm/
│           ├── 🔧 Backend (Django)
│           │   └── backend/
│           │       ├── 📱 Django Apps
│           │       │   ├── apps/
│           │       │   │   ├── core/                    # System core (Super Admin level)
│           │       │   │   │   ├── models.py           # User, Client, Domain models
│           │       │   │   │   ├── super_admin.py      # Super admin interface
│           │       │   │   │   ├── middleware.py       # Tenant routing middleware
│           │       │   │   │   ├── authentication.py   # JWT authentication
│           │       │   │   │   ├── permissions.py      # Core permission system
│           │       │   │   │   ├── static/admin/css/   # Admin interface styling
│           │       │   │   │   └── migrations/         # Database migrations
│           │       │   │   │
│           │       │   │   ├── tenant_core/            # Tenant management (Company Admin level)
│           │       │   │   │   ├── models.py           # TenantUser, Role, AuditLog models
│           │       │   │   │   ├── admin.py           # Tenant admin interface
│           │       │   │   │   ├── permissions.py      # RBAC implementation
│           │       │   │   │   └── migrations/         # Tenant-specific migrations
│           │       │   │   │
│           │       │   │   ├── accounts/               # Account management module
│           │       │   │   │   ├── models.py           # Account model (21 fields)
│           │       │   │   │   ├── serializers.py      # API serialization
│           │       │   │   │   ├── views.py           # API endpoints
│           │       │   │   │   ├── urls.py            # URL routing
│           │       │   │   │   └── migrations/         # Account migrations
│           │       │   │   │
│           │       │   │   ├── contacts/               # Contact management module
│           │       │   │   │   ├── models.py           # Contact model (21 fields)
│           │       │   │   │   ├── serializers.py      # API serialization
│           │       │   │   │   ├── views.py           # API endpoints
│           │       │   │   │   ├── urls.py            # URL routing
│           │       │   │   │   └── migrations/         # Contact migrations
│           │       │   │   │
│           │       │   │   ├── leads/                  # Lead management module
│           │       │   │   │   ├── models.py           # Lead model (23 fields + convert())
│           │       │   │   │   ├── serializers.py      # API serialization
│           │       │   │   │   ├── views.py           # Lead conversion endpoints
│           │       │   │   │   ├── urls.py            # URL routing
│           │       │   │   │   └── migrations/         # Lead migrations
│           │       │   │   │
│           │       │   │   ├── opportunities/          # Deal management module
│           │       │   │   │   ├── models.py           # Deal model (13 fields)
│           │       │   │   │   ├── serializers.py      # API serialization
│           │       │   │   │   ├── views.py           # Deal endpoints
│           │       │   │   │   ├── urls.py            # URL routing
│           │       │   │   │   └── migrations/         # Deal migrations
│           │       │   │   │
│           │       │   │   ├── campaigns/              # Campaign management (future)
│           │       │   │   │   └── [standard Django app structure]
│           │       │   │   │
│           │       │   │   └── subscriptions/          # Subscription management
│           │       │   │       └── [standard Django app structure]
│           │       │   │
│           │       │   ├── 🔧 Configuration
│           │       │   │   └── config/
│           │       │   │       ├── settings/
│           │       │   │       │   ├── base.py         # Base Django settings
│           │       │   │       │   └── dev.py          # Development settings
│           │       │   │       ├── urls.py            # Main URL configuration
│           │       │   │       ├── wsgi.py            # WSGI application
│           │       │   │       └── asgi.py            # ASGI application
│           │       │   │
│           │       │   ├── 📦 Dependencies
│           │       │   │   └── requirements/
│           │       │   │       ├── base.txt            # Production dependencies
│           │       │   │       └── dev.txt             # Development dependencies
│           │       │   │
│           │       │   ├── 🧪 Testing Suite
│           │       │   │   └── tests/
│           │       │   │       ├── integration/        # Integration tests
│           │       │   │       │   ├── test_api_endpoints.py
│           │       │   │       │   ├── test_auth_flow.py
│           │       │   │       │   └── test_tenant_isolation.py
│           │       │   │       ├── test_core/          # Core system tests
│           │       │   │       ├── test_accounts/      # Account module tests
│           │       │   │       ├── test_contacts/      # Contact module tests
│           │       │   │       ├── test_leads/         # Lead module tests
│           │       │   │       ├── test_opportunities/ # Deal module tests
│           │       │   │       ├── test_tenant_core/   # Tenant management tests
│           │       │   │       └── utils/              # Test utilities
│           │       │   │           ├── factories.py    # Test data factories
│           │       │   │           ├── helpers.py      # Test helper functions
│           │       │   │           └── mixins.py       # Test mixins
│           │       │   │
│           │       │   ├── 📁 Static Files
│           │       │   │   └── staticfiles/            # Collected static files
│           │       │   │       ├── admin/              # Django admin assets
│           │       │   │       ├── rest_framework/     # DRF assets
│           │       │   │       ├── debug_toolbar/      # Debug toolbar assets
│           │       │   │       └── unfold/             # Modern admin interface
│           │       │   │
│           │       │   └── 🔧 Project Files
│           │       │       ├── manage.py               # Django management
│           │       │       └── pyproject.toml          # Python project config
│           │       │
│           └── 💻 Frontend (React)
│               └── frontend/
│                   ├── 📦 Configuration
│                   │   ├── package.json               # Node.js dependencies
│                   │   ├── package-lock.json          # Dependency lock file
│                   │   ├── tsconfig.json              # TypeScript configuration
│                   │   ├── tsconfig.node.json         # Node TypeScript config
│                   │   ├── vite.config.ts             # Vite build tool config
│                   │   ├── vitest.config.ts           # Test runner config
│                   │   ├── tailwind.config.js         # Tailwind CSS config
│                   │   ├── postcss.config.js          # PostCSS config
│                   │   ├── eslint.config.js           # ESLint configuration
│                   │   └── index.html                 # HTML entry point
│                   │
│                   ├── 📁 Source Code
│                   │   └── src/
│                   │       ├── 🎯 Core Application
│                   │       │   ├── App.tsx             # Main React component
│                   │       │   ├── main.tsx            # Application entry point
│                   │       │   ├── index.css           # Global styles
│                   │       │   └── vite-env.d.ts       # Vite type definitions
│                   │       │
│                   │       ├── 🔐 Authentication System
│                   │       │   └── auth/
│                   │       │       ├── AuthProvider.tsx         # Auth context provider
│                   │       │       ├── LoginPage.tsx           # Login interface
│                   │       │       ├── ProtectedRoute.tsx      # Route protection
│                   │       │       ├── RoleBasedRoute.tsx      # Role-based routing
│                   │       │       ├── PermissionBasedRoute.tsx # Permission routing
│                   │       │       ├── usePermissions.ts       # Permission hooks
│                   │       │       ├── api.ts                  # Auth API calls
│                   │       │       └── types.ts               # Auth type definitions
│                   │       │
│                   │       ├── 🌐 API Integration
│                   │       │   └── api/
│                   │       │       ├── axios.ts               # HTTP client setup
│                   │       │       └── tenant.ts             # Tenant-specific API
│                   │       │
│                   │       ├── 🎨 Layout System
│                   │       │   └── layout/
│                   │       │       ├── MainLayout.tsx         # Main application layout
│                   │       │       ├── SimpleLayout.tsx       # Simplified layout
│                   │       │       ├── PageLayout.tsx         # Page-specific layout
│                   │       │       ├── Header.tsx            # Application header
│                   │       │       ├── Sidebar.tsx           # Navigation sidebar
│                   │       │       ├── Footer.tsx            # Application footer
│                   │       │       └── index.ts              # Layout exports
│                   │       │
│                   │       ├── 🏠 Dashboard Pages
│                   │       │   └── pages/
│                   │       │       ├── dashboard/
│                   │       │       │   ├── DashboardPage.tsx        # Main dashboard
│                   │       │       │   ├── SuperAdminDashboard.tsx  # Super admin view
│                   │       │       │   ├── TenantAdminDashboard.tsx # Tenant admin view
│                   │       │       │   └── UserDashboard.tsx        # End user view
│                   │       │       └── ProfilePage.tsx             # User profile
│                   │       │
│                   │       ├── 📊 CRM Modules
│                   │       │   └── modules/
│                   │       │       ├── accounts/              # Account management
│                   │       │       │   ├── api.ts             # Account API calls
│                   │       │       │   ├── index.ts           # Module exports
│                   │       │       │   ├── components/
│                   │       │       │   │   ├── AccountForm.tsx        # Account form
│                   │       │       │   │   ├── AccountFormModal.tsx   # Modal form
│                   │       │       │   │   └── AccountForm.test.tsx   # Form tests
│                   │       │       │   └── pages/
│                   │       │       │       ├── AccountsListPage.tsx     # List view
│                   │       │       │       ├── AccountDetailsPage.tsx   # Detail view
│                   │       │       │       ├── AccountDetailsRoute.tsx  # Detail routing
│                   │       │       │       ├── CreateAccountPage.tsx    # Creation page
│                   │       │       │       ├── EditAccountPage.tsx      # Edit page
│                   │       │       │       └── EditAccountRoute.tsx     # Edit routing
│                   │       │       │
│                   │       │       ├── contacts/              # Contact management
│                   │       │       │   ├── api.ts             # Contact API calls
│                   │       │       │   ├── index.ts           # Module exports
│                   │       │       │   ├── components/
│                   │       │       │   │   ├── ContactForm.tsx        # Contact form
│                   │       │       │   │   └── ContactFormModal.tsx   # Modal form
│                   │       │       │   └── pages/
│                   │       │       │       ├── ContactsListPage.tsx     # List view
│                   │       │       │       ├── ContactDetailsPage.tsx   # Detail view
│                   │       │       │       ├── ContactDetailsRoute.tsx  # Detail routing
│                   │       │       │       ├── CreateContactPage.tsx    # Creation page
│                   │       │       │       └── EditContactRoute.tsx     # Edit routing
│                   │       │       │
│                   │       │       ├── leads/                 # Lead management
│                   │       │       │   ├── api.ts             # Lead API calls
│                   │       │       │   ├── index.ts           # Module exports
│                   │       │       │   ├── components/
│                   │       │       │   │   ├── LeadForm.tsx            # Lead form
│                   │       │       │   │   ├── LeadFormModal.tsx       # Modal form
│                   │       │       │   │   └── LeadConversionModal.tsx  # Conversion modal
│                   │       │       │   └── pages/
│                   │       │       │       ├── LeadsListPage.tsx        # List view
│                   │       │       │       ├── LeadDetailsPage.tsx      # Detail view
│                   │       │       │       ├── LeadDetailsRoute.tsx     # Detail routing
│                   │       │       │       ├── CreateLeadPage.tsx       # Creation page
│                   │       │       │       └── EditLeadRoute.tsx        # Edit routing
│                   │       │       │
│                   │       │       └── deals/                 # Deal/Opportunity management
│                   │       │           ├── api.ts             # Deal API calls
│                   │       │           ├── index.ts           # Module exports
│                   │       │           ├── components/
│                   │       │           │   ├── DealForm.tsx            # Deal form
│                   │       │           │   └── DealFormModal.tsx       # Modal form
│                   │       │           └── pages/
│                   │       │               ├── DealsListPage.tsx        # List view
│                   │       │               ├── DealDetailsPage.tsx      # Detail view
│                   │       │               ├── DealDetailsRoute.tsx     # Detail routing
│                   │       │               ├── CreateDealPage.tsx       # Creation page
│                   │       │               └── EditDealRoute.tsx        # Edit routing
│                   │       │
│                   │       ├── 🔄 Shared Components System
│                   │       │   └── shared/
│                   │       │       ├── index.ts               # Main exports
│                   │       │       ├── components/
│                   │       │       │   ├── buttons/           # Button components
│                   │       │       │   │   ├── Button.tsx     # Reusable button
│                   │       │       │   │   └── index.ts       # Button exports
│                   │       │       │   ├── cards/             # Card components
│                   │       │       │   │   ├── StatsCard.tsx  # Statistics cards
│                   │       │       │   │   ├── StatsGrid.tsx  # Card grid layout
│                   │       │       │   │   └── index.ts       # Card exports
│                   │       │       │   ├── forms/             # Form components
│                   │       │       │   │   ├── FormField.tsx  # Form field wrapper
│                   │       │       │   │   ├── FormSection.tsx # Form sections
│                   │       │       │   │   └── index.ts       # Form exports
│                   │       │       │   ├── modals/            # Modal components
│                   │       │       │   │   ├── FormModal.tsx  # Reusable form modal
│                   │       │       │   │   └── index.ts       # Modal exports
│                   │       │       │   ├── tables/            # Table components
│                   │       │       │   │   ├── DataTable.tsx  # Main data table with column visibility support
│                   │       │       │   │   ├── TableControls.tsx # Search/filter/action controls
│                   │       │       │   │   ├── ColumnManager.tsx # Column visibility management dropdown
│                   │       │       │   │   ├── ActionMenu.tsx     # Table row action menu
│                   │       │       │   │   ├── cells/         # Table cell types
│                   │       │       │   │   │   ├── AvatarCell.tsx  # Avatar display
│                   │       │       │   │   │   ├── BadgeCell.tsx   # Status badges
│                   │       │       │   │   │   ├── DateCell.tsx    # Date formatting
│                   │       │       │   │   │   ├── LinkCell.tsx    # Clickable links
│                   │       │       │   │   │   ├── ValueCell.tsx   # Value formatting
│                   │       │       │   │   │   ├── ContactInfoCell.tsx # Contact info display
│                   │       │       │   │   │   ├── PrimaryLinkCell.tsx # Primary link styling
│                   │       │       │   │   │   └── index.ts        # Cell exports
│                   │       │       │   │   └── index.ts       # Table exports
│                   │       │       │   ├── selectors/         # Smart selectors
│                   │       │       │   │   ├── AccountSelect.tsx  # Account dropdown
│                   │       │       │   │   ├── ContactSelect.tsx  # Contact dropdown
│                   │       │       │   │   ├── UserSelect.tsx     # User dropdown
│                   │       │       │   │   └── index.ts           # Selector exports
│                   │       │       │   ├── feedback/          # User feedback
│                   │       │       │   │   ├── LoadingSpinner.tsx # Loading indicators
│                   │       │       │   │   ├── ErrorAlert.tsx     # Error messages
│                   │       │       │   │   ├── EmptyState.tsx     # Empty state UI
│                   │       │       │   │   └── index.ts           # Feedback exports
│                   │       │       │   ├── ui/                # UI primitives
│                   │       │       │   │   └── index.ts       # UI exports
│                   │       │       │   └── index.ts           # All component exports
│                   │       │       ├── hooks/               # Shared hooks
│                   │       │       │   ├── useColumnVisibility.ts # Column visibility state management
│                   │       │       │   └── index.ts           # Hook exports
│                   │       │       └── utils/
│                   │       │           ├── validation.ts      # Form validation utilities
│                   │       │           └── index.ts           # Utility exports
│                   │       │
│                   │       ├── 🧩 Core Components
│                   │       │   └── components/
│                   │       │       ├── ErrorBoundary.tsx      # React error boundary
│                   │       │       ├── QuickAddDropdown.tsx   # Quick action dropdown
│                   │       │       └── NotificationDropdown.tsx # Notification system (placeholder)
│                   │       │
│                   │       ├── 🛠️  Utilities
│                   │       │   └── utils/
│                   │       │       ├── error.ts              # Error handling
│                   │       │       └── tenant.ts            # Tenant utilities
│                   │       │
│                   │       └── 🧪 Testing
│                   │           └── test/
│                   │               └── setup.ts             # Test setup configuration
│                   │
│                   ├── 📁 Build Output
│                   │   └── dist/                            # Built application
│                   │
│                   └── 📋 Documentation
│                       └── SHARED_COMPONENTS_REFERENCE.md   # Component documentation
│
├── 📁 Logs & Temporary Files
│   ├── logs/                                  # Application logs
│   │   └── mcp-puppeteer-*.log               # Puppeteer automation logs
│   ├── venv/                                 # Python virtual environment
│   ├── cookies.txt                           # Session cookies
│   ├── tenant_cookies.txt                    # Tenant-specific cookies
│   └── neuracrm-frontend@0.0.0              # Temporary frontend artifact
│
└── 🔧 Additional Config Files
    └── gemini.md                             # Gemini AI integration notes
```

### Key Architecture Highlights

- **🏗️ Three-Level Multi-Tenant Architecture**: Super Admin → Company Admin → End Users
- **🛡️ Security & Isolation**: Complete tenant isolation with PostgreSQL schemas + JWT tokens
- **🎯 CRM Core Modules**: All complete (Accounts, Contacts, Leads, Opportunities)
- **🎨 Consistent Table Design**: Unified DataTable & TableControls with column management system
- **⚙️ Column Management**: User-customizable table columns with persistent preferences per module
- **🔄 Shared Component System**: Reusable hooks, components, and utilities across all modules