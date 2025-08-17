# Project Isolation Guide

> Optional add-on for the same Docker-first SaaS workflow: isolate multiple instances of this template on one machine using COMPOSE_PROJECT_NAME prefixes.

This guide explains how to configure unique project prefixes to avoid Docker service name conflicts when running multiple instances of this template.

## Overview

When running multiple projects based on this template on the same system, Docker service names can conflict. To solve this, we use the `COMPOSE_PROJECT_NAME` environment variable to create unique prefixes for all Docker resources.

## Quick Setup

### 1. Set Project Name

In your `.env` file, set the `COMPOSE_PROJECT_NAME` variable:

```bash
# Example for a project called "my-blog"
COMPOSE_PROJECT_NAME=my-blog
```

### 2. That's it!

All Docker resources will now be prefixed with your project name:
- Containers: `my-blog-api-dev`, `my-blog-web-dev`, etc.
- Networks: `my-blog_app_network_dev`, etc.
- Volumes: `my-blog_api_db_data_dev`, etc.

## Environment Files

### Development (`.env`)
```bash
# Project Configuration
COMPOSE_PROJECT_NAME=my-project-name

# ... rest of your environment variables
```

### API Production (`.env.api.prod`)
```bash
# Project Configuration
COMPOSE_PROJECT_NAME=my-project-name

# ... rest of your environment variables
```

### Web Production (`.env.web.prod`)
```bash
# Project Configuration
COMPOSE_PROJECT_NAME=my-project-name

# ... rest of your environment variables
```

## How It Works

The `COMPOSE_PROJECT_NAME` environment variable is a standard Docker Compose feature that:

1. **Prefixes service names**: Docker Compose automatically prefixes all resource names
2. **Creates isolated networks**: Each project gets its own network namespace
3. **Separates volumes**: Database and other persistent data is isolated per project
4. **Enables parallel deployments**: Run multiple projects simultaneously without conflicts

## Examples

### Project 1: Blog
```bash
COMPOSE_PROJECT_NAME=myblog
```
Results in:
- `myblog-api-dev`
- `myblog-web-dev`
- `myblog_app_network_dev`

### Project 2: E-commerce
```bash
COMPOSE_PROJECT_NAME=mystore
```
Results in:
- `mystore-api-dev`
- `mystore-web-dev`
- `mystore_app_network_dev`

### Project 3: Portfolio
```bash
COMPOSE_PROJECT_NAME=portfolio
```
Results in:
- `portfolio-api-dev`
- `portfolio-web-dev`
- `portfolio_app_network_dev`

## Docker Commands

When using custom project names, Docker commands need to reference the correct project:

```bash
# View containers for specific project
docker ps --filter "name=myblog"

# View logs for specific service
docker logs myblog-api-dev

# Stop specific project
docker-compose --env-file .env down

# Start specific project
docker-compose --env-file .env up -d
```

## Best Practices

1. **Use descriptive names**: Choose project names that clearly identify your project
2. **Use lowercase with hyphens**: Follow Docker naming conventions (e.g., `my-blog-api`)
3. **Keep it short**: Shorter names are easier to work with in commands
4. **Be consistent**: Use the same naming pattern across your organization

## Troubleshooting

### Services Won't Start
- Check that your `COMPOSE_PROJECT_NAME` doesn't contain special characters
- Ensure the name is unique on your system

### Can't Connect Between Services
- Service names within Docker Compose remain the same (e.g., `api-dev`)
- The prefix only affects external container names and networks

### Database Data Missing
- Volume names are prefixed, so each project has its own data
- To migrate data between projects, you'll need to export/import manually

## Migration from Existing Projects

If you have an existing project without prefixes:

1. **Backup your data**: Export your database first
2. **Stop existing containers**: `docker-compose down`
3. **Set project name**: Add `COMPOSE_PROJECT_NAME` to your `.env`
4. **Start with new names**: `docker-compose up -d`
5. **Import data**: Restore your database backup if needed

## Additional Resources

- [Docker Compose Project Names](https://docs.docker.com/compose/reference/envvars/#compose_project_name)
- [Environment Variable Substitution](https://docs.docker.com/compose/environment-variables/)
