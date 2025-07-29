.PHONY: dev test lint db-reset db-reset-sudo backend frontend install setup setup-sudo clean

# Quick Setup
setup:
	@echo "🚀 Setting up NeuraCRM3..."
	@chmod +x scripts/setup-new-system.sh
	@./scripts/setup-new-system.sh

# Setup with sudo password (use: make setup-sudo SUDO_PASSWORD=your_password)
setup-sudo:
	@echo "🚀 Setting up NeuraCRM3 with sudo password..."
	@chmod +x scripts/setup-with-sudo.sh
	@SUDO_PASSWORD="$(SUDO_PASSWORD)" ./scripts/setup-with-sudo.sh

# Development
dev:
	@echo "🚀 Starting CRM development servers..."
	@make -j2 backend frontend

backend:
	@echo "Starting Django backend..."
	@cd services/crm/backend && python manage.py runserver 0.0.0.0:8000

backend-8001:
	@echo "Starting Django backend on port 8001..."
	@cd services/crm/backend && python manage.py runserver 0.0.0.0:8001

dev-multi:
	@echo "Starting CRM with multiple tenant ports..."
	@make -j3 backend backend-8001 frontend

frontend:
	@echo "Starting React frontend..."
	@cd services/crm/frontend && npm run dev

# Installation
install:
	@echo "Installing dependencies..."
	@cd services/crm/backend && pip install -r requirements/dev.txt
	@cd services/crm/frontend && npm install

# Testing
test:
	@echo "Running all tests..."
	@cd services/crm/backend && python manage.py test
	@cd services/crm/frontend && npm run test

# Linting
lint:
	@echo "Running linters..."
	@cd services/crm/backend && ruff check . && black --check .
	@cd services/crm/frontend && npm run lint && npm run type-check

# Database
db-reset:
	@echo "Resetting database..."
	@./scripts/db-reset.sh

# Database reset with sudo password (use: make db-reset-sudo SUDO_PASSWORD=your_password)
db-reset-sudo:
	@echo "Resetting database with sudo password..."
	@SUDO_PASSWORD="$(SUDO_PASSWORD)" ./scripts/db-reset.sh

db-init:
	@echo "Initializing database..."
	@./scripts/db-init.sh

# Migrations
migrate:
	@echo "🔄 Running migrations..."
	@cd services/crm/backend && python manage.py migrate_schemas --shared
	@cd services/crm/backend && python manage.py migrate_schemas --tenant

# Seed demo data
seed:
	@echo "🌱 Seeding demo data..."
	@python scripts/seed-dev-data.py

# Clean install (removes venv and node_modules)
clean:
	@echo "🧹 Cleaning installation..."
	@rm -rf venv
	@rm -rf services/crm/frontend/node_modules
	@echo "✅ Clean completed. Run 'make setup' to reinstall."

# Create superuser
superuser:
	@echo "Creating superuser..."
	@cd services/crm/backend && python manage.py createsuperuser

# Collect static files
collectstatic:
	@echo "Collecting static files..."
	@cd services/crm/backend && python manage.py collectstatic --noinput