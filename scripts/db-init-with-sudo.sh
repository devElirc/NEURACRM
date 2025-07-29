#!/bin/bash

# Database initialization script for NeuraCRM3 with sudo password support
echo "🗄️  Initializing PostgreSQL database for NeuraCRM3..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from template..."
    cp .env.example .env 2>/dev/null || echo "⚠️  Please create .env file with database configuration"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install it first:"
    echo "Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "CentOS/RHEL: sudo yum install postgresql postgresql-server"
    echo "macOS: brew install postgresql"
    exit 1
fi

# Function to execute commands with sudo password
execute_with_sudo() {
    if [ -n "$SUDO_PASSWORD" ]; then
        echo "$SUDO_PASSWORD" | sudo -S "$@"
    else
        sudo "$@"
    fi
}

# Function to execute postgres commands with sudo password
execute_postgres_cmd() {
    if [ -n "$SUDO_PASSWORD" ]; then
        echo "$SUDO_PASSWORD" | sudo -S -u postgres psql "$@"
    else
        sudo -u postgres psql "$@"
    fi
}

# Check if PostgreSQL service is running
if ! execute_with_sudo systemctl is-active --quiet postgresql; then
    echo "Starting PostgreSQL service..."
    execute_with_sudo systemctl start postgresql
    execute_with_sudo systemctl enable postgresql
fi

# Try different approaches to create database
echo "Creating database and user..."

# Method 1: Using sudo -u postgres (traditional Linux)
if execute_postgres_cmd -c "SELECT 1;" &> /dev/null; then
    echo "Using postgres user method..."
    execute_postgres_cmd -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME might already exist"
    execute_postgres_cmd -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User $DB_USER might already exist"
    execute_postgres_cmd -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    execute_postgres_cmd -c "ALTER USER $DB_USER CREATEDB;"
    
    # Grant schema permissions for multi-tenant support
    echo "Granting schema permissions..."
    execute_postgres_cmd -d $DB_NAME -c "GRANT CREATE, USAGE ON SCHEMA public TO $DB_USER;"
    execute_postgres_cmd -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
    execute_postgres_cmd -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
    execute_postgres_cmd -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
    execute_postgres_cmd -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"
    
    echo "Database setup completed using postgres user"
elif psql -U $USER -d postgres -c "SELECT 1;" &> /dev/null; then
    # Method 2: Using current user (common in some setups)
    echo "Using current user method..."
    psql -U $USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME might already exist"
    psql -U $USER -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User $DB_USER might already exist"
    psql -U $USER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    psql -U $USER -d postgres -c "ALTER USER $DB_USER CREATEDB;"
    
    # Grant schema permissions for multi-tenant support
    echo "Granting schema permissions..."
    psql -U $USER -d $DB_NAME -c "GRANT CREATE, USAGE ON SCHEMA public TO $DB_USER;"
    psql -U $USER -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
    psql -U $USER -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
    psql -U $USER -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
    psql -U $USER -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"
    
    echo "Database setup completed using current user"
else
    echo "Could not connect to PostgreSQL. Please check your installation."
    echo "Try running: sudo -u postgres psql"
    echo "Or install PostgreSQL first."
    exit 1
fi

echo "✅ Database initialized successfully!"
echo "📊 Database Details:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo ""
echo "🚀 Next steps:"
echo "   1. Run migrations: make migrate"
echo "   2. Seed demo data: python scripts/seed-dev-data.py"
echo "   3. Start servers: make dev"