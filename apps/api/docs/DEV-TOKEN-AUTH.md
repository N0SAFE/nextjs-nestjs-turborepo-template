# Dev Token Authentication Plugin

This plugin provides a simple bearer token authentication for development purposes. It allows the admin user to authenticate using a simple token instead of going through the full authentication flow.

## Configuration

Add the following environment variable to your `.env` file:

```bash
DEV_AUTH_KEY=your-secret-dev-key-here
```

The plugin will automatically:
- Only work in development mode (`NODE_ENV=development`)
- Look for the admin user with email `admin@admin.com` 
- Authenticate requests with `Authorization: Bearer your-secret-dev-key-here`

## Usage

### Making Authenticated Requests

```bash
# Example using curl
curl -H "Authorization: Bearer your-secret-dev-key-here" http://localhost:3001/api/protected-endpoint

# Example using fetch
fetch('http://localhost:3001/api/protected-endpoint', {
  headers: {
    'Authorization': 'Bearer your-secret-dev-key-here'
  }
})
```

### How it Works

1. The plugin intercepts all requests in development mode
2. Checks for `Authorization: Bearer <token>` header
3. Compares the token with `DEV_AUTH_KEY` environment variable
4. If valid, fetches the admin user from the database
5. Sets the user context for the request, making it authenticated

### Security Notes

- **DEVELOPMENT ONLY**: This plugin only works when `NODE_ENV=development`
- **Admin Access**: Only provides access as the admin user
- **Single Token**: Uses one token for all admin authentication
- **No Session Storage**: Creates temporary sessions, not stored in database

This is perfect for:
- Testing protected endpoints during development
- Automated testing with a simple auth mechanism
- Development tools that need admin access
- API testing without complex auth flows