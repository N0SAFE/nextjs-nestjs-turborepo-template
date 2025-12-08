/**
 * PostgreSQL Generator
 *
 * Sets up PostgreSQL database configuration.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
} from "../../../../types/generator.types";

@Injectable()
export class PostgresqlGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "postgresql",
    priority: 40,
    version: "1.0.0",
    description: "PostgreSQL database setup",
    dependencies: ["docker"],
    contributesTo: [".env", ".env.example", "docker-compose.yml"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const { projectConfig } = context;
    const dbName = projectConfig.name?.replace(/-/g, "_") || "app";
    
    const files: FileSpec[] = [
      this.file("docker/init-scripts/01-init.sql", this.getInitScript(context)),
      // Environment file with PostgreSQL variables
      this.file(".env.example", this.getEnvExample(dbName), { mergeStrategy: "append" }),
    ];

    // Add backup scripts
    files.push(
      this.file("scripts/db-backup.sh", this.getBackupScript(context), { permissions: 0o755 }),
      this.file("scripts/db-restore.sh", this.getRestoreScript(context), { permissions: 0o755 })
    );

    return files;
  }

  private getEnvExample(dbName: string): string {
    return `# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=${dbName}
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/${dbName}
`;
  }

  private getInitScript(context: GeneratorContext): string {
    const { projectConfig } = context;
    const dbName = projectConfig.name?.replace(/-/g, "_") || "app";

    return `-- PostgreSQL initialization script
-- This runs when the container is first created

-- Create additional databases if needed
-- CREATE DATABASE ${dbName}_test;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO postgres;

-- Create schemas
CREATE SCHEMA IF NOT EXISTS app;

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Database ${dbName} initialized successfully';
END $$;
`;
  }

  private getBackupScript(context: GeneratorContext): string {
    return `#!/bin/bash
# PostgreSQL backup script

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\${BACKUP_DIR}/backup_\${TIMESTAMP}.sql.gz"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Create backup directory if it doesn't exist
mkdir -p "\${BACKUP_DIR}"

echo "Starting PostgreSQL backup..."

# Run backup
docker compose exec -T postgres pg_dump -U "\${POSTGRES_USER:-postgres}" "\${POSTGRES_DB:-app}" | gzip > "\${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup completed successfully: \${BACKUP_FILE}"
  
  # Remove backups older than 30 days
  find "\${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime +30 -delete
  echo "Cleaned up old backups"
else
  echo "Backup failed!"
  exit 1
fi
`;
  }

  private getRestoreScript(context: GeneratorContext): string {
    return `#!/bin/bash
# PostgreSQL restore script

set -e

# Check for backup file argument
if [ -z "$1" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

# Verify backup file exists
if [ ! -f "\${BACKUP_FILE}" ]; then
  echo "Backup file not found: \${BACKUP_FILE}"
  exit 1
fi

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

echo "WARNING: This will overwrite the current database!"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore cancelled"
  exit 0
fi

echo "Starting PostgreSQL restore from: \${BACKUP_FILE}"

# Restore backup
gunzip -c "\${BACKUP_FILE}" | docker compose exec -T postgres psql -U "\${POSTGRES_USER:-postgres}" "\${POSTGRES_DB:-app}"

if [ $? -eq 0 ]; then
  echo "Restore completed successfully!"
else
  echo "Restore failed!"
  exit 1
fi
`;
  }
}
