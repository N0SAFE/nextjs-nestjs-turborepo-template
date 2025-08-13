# Environment Template System

> Part of the Docker-first SaaS workflow: use this to generate a validated `.env` for local dev and production deployments (Docker Compose or Render).

This project uses an advanced template system for environment configuration that provides an interactive setup experience with validation and smart defaults.

## Template File Format

The `.env.template` file uses a special syntax to define configuration options:

```
KEY_NAME={{type|param1=value1|param2=value2|...}}
```

## Supported Field Types

### String Fields
```
API_TOKEN={{string|label=API Token|description=Secret token for API access|default=secret123|secure=true}}
PROJECT_NAME={{string|label=Project Name|minLength=3|maxLength=50|pattern=^[a-zA-Z0-9-]+$}}
```

**Parameters:**
- `label`: Display name for the prompt
- `description`: Help text shown to user
- `default`: Default value
- `secure`: Hide input (password field)
- `minLength`: Minimum character length
- `maxLength`: Maximum character length
- `pattern`: Regex pattern for validation
- `generate`: Set to "random" to auto-generate random string
- `length`: Length for generated string (default: 32)

### Number Fields
```
PORT={{number|label=Port Number|min=1024|max=65535|default=3000}}
TIMEOUT={{number|label=Timeout (seconds)|min=1|max=300|default=30}}
```

**Parameters:**
- `min`: Minimum value
- `max`: Maximum value
- `default`: Default value

### Boolean Fields
```
ENABLE_FEATURE={{boolean|label=Enable Feature|labels=yes,no|default=yes}}
DEBUG_MODE={{boolean|label=Debug Mode|labels=enable,disable|default=disable}}
```

**Parameters:**
- `labels`: Custom labels for true/false (comma-separated)
- `default`: Default value (use the label text)

### Select Fields
```
ENVIRONMENT={{select|label=Environment|options=development,production,test|default=development}}
LOG_LEVEL={{select|label=Log Level|options=error,warn,info,debug|default=info}}
```

**Parameters:**
- `options`: Available choices (comma-separated)
- `default`: Default selected option

### Multi-Select Fields
```
FEATURES={{multiselect|label=Enable Features|options=auth,cache,logging,metrics|separator=,}}
CORS_ORIGINS={{multiselect|label=CORS Origins|options=localhost:3000,localhost:3001,127.0.0.1:3000|separator=,}}
```

**Parameters:**
- `options`: Available choices (comma-separated)
- `separator`: Character to join selected values (default: ",")

### URL Fields
```
API_URL={{url|label=API URL|protocol=http,https|default=http://localhost:3001}}
WEBHOOK_URL={{url|label=Webhook URL|protocol=https|hostname=example.com,api.example.com}}
```

**Parameters:**
- `protocol`: Allowed protocols (comma-separated)
- `hostname`: Allowed hostnames (comma-separated)
- `port`: Required port number
- `default`: Default URL

### Date Fields
```
START_DATE={{date|label=Project Start Date|format=YYYY-MM-DD|default=2024-01-01}}
EXPIRY={{date|label=License Expiry|format=YYYY-MM-DD|minDate=2024-01-01|maxDate=2025-12-31}}
```

**Parameters:**
- `format`: Date format (currently supports "YYYY-MM-DD")
- `default`: Default date value
- `minDate`: Minimum allowed date
- `maxDate`: Maximum allowed date

## Common Parameters

All field types support these parameters:

- `label`: Human-readable name for the field
- `description`: Additional help text
- `optional`: Set to "true" to make field optional
- `default`: Default value for the field

## Example Template File

```env
# Project Configuration
COMPOSE_PROJECT_NAME={{string|default=my-project|label=Project Name|description=Unique name for Docker containers}}

# API Configuration  
NEXT_PUBLIC_API_URL={{url|protocol=http,https|label=API URL|default=http://localhost:3001}}
NEXT_PUBLIC_API_PORT={{number|min=1024|max=65535|default=3001|label=API Port}}
API_ADMIN_TOKEN={{string|generate=random|length=32|label=Admin Token|secure=true}}

# Environment Settings
NODE_ENV={{select|options=development,production,test|default=development|label=Environment}}
DEBUG={{boolean|labels=yes,no|default=no|label=Enable Debug Mode}}

# Optional Features
FEATURES={{multiselect|options=auth,cache,logging|separator=,|label=Features|optional=true}}
```

## Running the Initialization

1. Ensure you have a `.env.template` file in your project root
2. Run the initialization script:
   ```bash
   bun run init
   ```
3. Follow the interactive prompts
4. The script will generate a `.env` file with your configuration

## Advanced Features

### Auto-generated Values
Use `generate=random` with a `length` parameter to automatically generate secure random strings:
```
SECRET_KEY={{string|generate=random|length=64|label=Secret Key|secure=true}}
```

### URL Validation
The URL validator supports comprehensive validation:
```
# Only HTTPS URLs
SECURE_API={{url|protocol=https|label=Secure API URL}}

# Only localhost
LOCAL_SERVICE={{url|hostname=localhost,127.0.0.1|label=Local Service}}

# Specific port
DATABASE_URL={{url|port=5432|label=Database URL}}
```

### Conditional Logic
Fields can be marked as optional and will be skipped if not needed:
```
OPTIONAL_WEBHOOK={{url|optional=true|label=Webhook URL|description=Leave empty to disable}}
```

## Error Handling

The initialization script provides comprehensive error handling:

- **Validation Errors**: Clear messages for invalid inputs
- **Template Parsing**: Helpful errors for malformed templates
- **File Operations**: Graceful handling of file system errors
- **User Cancellation**: Clean exit when user cancels setup

## Best Practices

1. **Group Related Settings**: Use comments to organize your template
2. **Provide Descriptions**: Help users understand what each setting does
3. **Use Sensible Defaults**: Make setup as smooth as possible
4. **Validate Input**: Use appropriate constraints for each field type
5. **Secure Sensitive Data**: Use `secure=true` for passwords and tokens
6. **Auto-generate Secrets**: Use random generation for security tokens

## Customization

The template system is designed to be extensible. You can:

1. Add new field types by extending the `createPromptConfig` function
2. Implement custom validation logic
3. Modify the output format in the `processValue` function
4. Customize the user interface with different colors and styling

## Migration from Simple .env

To migrate from a simple `.env` file to the template system:

1. Copy your `.env` to `.env.template`
2. Replace values with appropriate template syntax
3. Add validation and better defaults
4. Test the initialization process
5. Update documentation for your team
