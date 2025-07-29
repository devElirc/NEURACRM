# Gemini Code Assistant Guidance

This document provides specific instructions for Gemini when assisting with the NeuraCRM3 project.

## Project Overview

NeuraCRM3 is a multi-tenant CRM application built with Django and React. It features a three-level architecture: Super Admin, Tenant Admin, and Tenant User. The system is designed to be production-ready, with a focus on security, scalability, and modularity.

## Core Instructions

1.  **Adhere to Existing Conventions**: Before making any changes, analyze the surrounding code, project structure, and documentation (`CLAUDE.md`, `README.md`). Match the existing style for naming, formatting, and architecture.
2.  **Verify Dependencies**: Do not introduce new libraries without first checking `pyproject.toml` (backend) or `package.json` (frontend).
3.  **Tenant Isolation is Critical**: This is a multi-tenant application. All new models, views, and queries that handle tenant-specific data **MUST** implement tenant isolation.
    *   **Models**: All new tenant-specific models must use a `Tenant-Manager` to filter `QuerySet`s by the current tenant. See `apps/accounts/models.py` for the `TenantAccountManager` implementation.
    *   **Views**: Ensure that all views correctly filter data based on the tenant context provided by `request.tenant`.
    *   **Permissions**: Use the existing RBAC system in `apps/tenant_core/` for authorization. New permissions must be added to the `Role` model and checked in views.
4.  **Follow the Three-Level Architecture**:
    *   **Super Admin (System Level)**: Code related to system-wide management belongs in `apps/core/`. This includes managing tenants (`Client` model) and superadmins.
    *   **Tenant Admin (Company Level)**: Code for managing a specific tenant (company) belongs in `apps/tenant_core/`. This includes managing tenant users, roles, and tenant-specific settings.
    *   **Tenant User (CRM Modules)**: Code for CRM functionality (Leads, Contacts, etc.) belongs in dedicated apps like `apps/leads/`, `apps/contacts/`, etc. These are always tenant-specific.
5.  **Use Provided Tooling**:
    *   Use the `make` commands defined in the `Makefile` for common tasks (`make dev`, `make test`, `make lint`).
    *   Use `ruff` for linting and `black` for formatting Python code.
    *   Use `npm run lint` and `npm run type-check` for the frontend.
6.  **API Design**:
    *   Follow the existing RESTful API design patterns.
    *   Use Django REST Framework (`DRF`) for creating new endpoints.
    *   Ensure all new endpoints are properly documented and have corresponding permissions checks.
7.  **Security First**:
    *   Sanitize all user inputs.
    *   Implement rate limiting for sensitive endpoints.
    *   Avoid raw SQL queries. If absolutely necessary, they **MUST** include tenant filtering.
    *   Refer to the `SECURITY_ASSESSMENT_REPORT.md` and `CLAUDE.md` for resolved vulnerabilities and future considerations.

## How to Approach Common Tasks

### Adding a New CRM Module (e.g., "Products")

1.  **Create the Django App**:
    ```bash
    cd services/crm/backend
    python3 manage.py startapp products
    ```
2.  **Define the Model (`services/crm/backend/apps/products/models.py`)**:
    *   Add a `ForeignKey` to `core.Client` for tenant isolation.
    *   Implement a `TenantProductManager` similar to `TenantAccountManager`.
    *   Add `created_by`, `updated_by`, `created_at`, `updated_at` fields for auditing.
    *   Register the model in `services/crm/backend/apps/products/admin.py`.
3.  **Create Serializer and Views (`serializers.py`, `views.py`)**:
    *   Create a `ProductSerializer`.
    *   Create a `ProductViewSet` using `DRF`.
    *   Implement `get_queryset` in the `ViewSet` to use the `TenantProductManager`.
    *   Add appropriate permission classes (e.g., `IsAuthenticated`, and a custom permission class for the module).
4.  **Define URLs (`urls.py`)**:
    *   Create a `urls.py` in the `products` app.
    *   Include the app's URLs in `config/urls.py`.
5.  **Write Tests**:
    *   Create `tests/test_products/test_models.py` and `test_views.py`.
    *   Write tests for model creation, tenant isolation, and API endpoints.
6.  **Create the Frontend Module (`services/crm/frontend/src/modules/products/`)**:
    *   Create components for listing, creating, editing, and viewing products.
    *   Use `Tanstack Query` for data fetching.
    *   Add the module to the main navigation and routing.

### Modifying Existing Code

1.  **Understand the Context**: Read the relevant models, views, and tests to understand the existing implementation.
2.  **Identify the Impact**: Assess how your changes will affect other parts of the application, especially regarding tenant isolation and permissions.
3.  **Write/Update Tests**: Ensure that your changes are covered by tests. Run the existing test suite to check for regressions.
4.  **Lint and Format**: Run `make lint` to ensure your code follows the project's style guide.

By following these guidelines, you will help maintain the quality, security, and consistency of the NeuraCRM3 codebase.

## CRM Module Implementation Plan

**Analysis Date:** 2025-07-16
**Status:** The backend APIs for `Accounts`, `Contacts`, `Leads`, and `Opportunities` are complete. The frontend UI for `Accounts` is also complete. This plan outlines the next steps to build the UIs for the remaining modules and implement the `Campaigns` module. The original blueprint (`Accounts` module) has been successfully established.

### Phase 1: Build Frontend UI for Core CRM Modules

The backend for these modules is ready. The next step is to build the user interfaces, following the pattern established by the `Accounts` module UI.

1.  **Build `Contacts` Module UI:**
    *   **Create API Hooks (`services/crm/frontend/src/modules/contacts/api.ts`):** Create `Tanstack Query` hooks for `Contacts` CRUD operations.
    *   **Create Components (`services/crm/frontend/src/modules/contacts/`):** Develop `ContactsListPage`, `ContactForm`, `CreateContactPage`, etc.
    *   **Add Routing:** Add protected routes for the `Contacts` module to the main router.

2.  **Build `Leads` Module UI:**
    *   **Create API Hooks (`services/crm/frontend/src/modules/leads/api.ts`):** Create `Tanstack Query` hooks for `Leads` CRUD operations.
    *   **Create Components (`services/crm/frontend/src/modules/leads/`):** Develop `LeadsListPage`, `LeadForm`, `CreateLeadPage`, etc.
    *   **Add Routing:** Add protected routes for the `Leads` module.

3.  **Build `Opportunities` Module UI:**
    *   **Create API Hooks (`services/crm/frontend/src/modules/opportunities/api.ts`):** Create `Tanstack Query` hooks for `Opportunities` CRUD operations.
    *   **Create Components (`services/crm/frontend/src/modules/opportunities/`):** Develop `OpportunitiesListPage`, `OpportunityForm`, `CreateOpportunityPage`, etc.
    *   **Add Routing:** Add protected routes for the `Opportunities` module.

### Phase 2: Implement the `Campaigns` Module (Full Stack)

Once the core module UIs are complete, build the `Campaigns` module from scratch using the established full-stack pattern.

1.  **Create the Django App (`services/crm/backend/apps/campaigns/`):**
    *   Run `python3 manage.py startapp campaigns`.
    *   Define the `Campaign` model with tenant isolation (`TenantCampaignManager`).
    *   Create the `CampaignSerializer` and `CampaignViewSet`.
    *   Define URLs and add them to the main `config/urls.py`.
    *   Write tests for the API.

2.  **Create the Frontend Module (`services/crm/frontend/src/modules/campaigns/`):**
    *   Create API hooks, components, and pages for `Campaigns` management.
    *   Add routing for the `Campaigns` module.

### Phase 3: Implement Business Logic and Dependencies

1.  **Link Campaigns to Leads:**
    *   Uncomment the `campaign` ForeignKey in the `Lead` model.
    *   Create and run the database migration.
    *   Update the `LeadSerializer` and `LeadForm` (frontend) to include the campaign relationship.

2.  **Implement `Lead.convert()` Method:**
    *   Implement the business logic in the `Lead.convert()` method on the backend model. This should create an `Account`, `Contact`, and optionally an `Opportunity`.
    *   Create a dedicated API endpoint (e.g., `POST /api/leads/{id}/convert/`) to trigger the conversion.
    *   Add a "Convert" button/action to the `LeadDetailsPage` on the frontend that calls this new endpoint.
    *   Write backend tests to verify the conversion logic.