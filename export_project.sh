#!/bin/bash

# WorkForce Manager Project Export Script

echo "Creating project export package..."

# Create export directory
mkdir -p workforce_manager_export

# Copy all project files (excluding node_modules and dist)
rsync -av --exclude='node_modules/' --exclude='dist/' --exclude='.git/' --exclude='*.log' . workforce_manager_export/

# Create database backup if not exists
if [ ! -f database_backup.sql ]; then
    echo "Creating database backup..."
    pg_dump $DATABASE_URL > database_backup.sql
fi

# Copy database backup to export
cp database_backup.sql workforce_manager_export/

# Create a compressed archive
echo "Creating compressed archive..."
tar -czf workforce_manager_export.tar.gz workforce_manager_export/

echo "Export complete!"
echo "Files created:"
echo "  - workforce_manager_export/ (folder with all files)"
echo "  - workforce_manager_export.tar.gz (compressed archive)"
echo "  - database_backup.sql (database backup)"
echo ""
echo "To use on your local machine:"
echo "1. Extract the archive: tar -xzf workforce_manager_export.tar.gz"
echo "2. Follow instructions in README_EXPORT.md"