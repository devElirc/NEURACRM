#!/bin/bash

# Database reset script
echo "Resetting PostgreSQL database for NeuraCRM..."

# Load environment variables
source .env

# Function to execute postgres commands with sudo password
execute_postgres_cmd() {
    if [ -n "$SUDO_PASSWORD" ]; then
        echo "$SUDO_PASSWORD" | sudo -S -u postgres psql "$@"
    else
        sudo -u postgres psql "$@"
    fi
}

# Drop and recreate database
execute_postgres_cmd -c "DROP DATABASE IF EXISTS $DB_NAME;"
execute_postgres_cmd -c "CREATE DATABASE $DB_NAME;"
execute_postgres_cmd -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Grant schema permissions for multi-tenant support
echo "Granting schema permissions..."
execute_postgres_cmd -d $DB_NAME -c "GRANT CREATE, USAGE ON SCHEMA public TO $DB_USER;"
execute_postgres_cmd -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
execute_postgres_cmd -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"
execute_postgres_cmd -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;"
execute_postgres_cmd -d $DB_NAME -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;"

echo "Database reset successfully!"
echo "Run migrations with: make migrate"