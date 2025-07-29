-- Fix PostgreSQL permissions for crm_user
ALTER USER crm_user CREATEDB;
ALTER USER crm_user CREATEROLE;
DROP DATABASE IF EXISTS crm_db;
CREATE DATABASE crm_db OWNER crm_user;
GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;