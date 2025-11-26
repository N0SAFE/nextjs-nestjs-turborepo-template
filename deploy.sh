#!/bin/bash
# Automated Deployment Script for The Gossip Club
# Ubuntu/Debian compatible
# This script will install all dependencies, configure Nginx, obtain SSL certificates, and start the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_header "🚀 The Gossip Club - Automated Deployment"

# Get the actual user who ran sudo
ACTUAL_USER="${SUDO_USER:-$USER}"
ACTUAL_HOME=$(eval echo ~$ACTUAL_USER)

print_info "Running as user: $ACTUAL_USER"
print_info "Home directory: $ACTUAL_HOME"

# Project directory (current directory)
PROJECT_DIR="$(pwd)"
print_info "Project directory: $PROJECT_DIR"

# Update system packages
print_header "📦 Updating System Packages"
apt-get update -y
apt-get upgrade -y
print_success "System packages updated"

# Install essential packages
print_header "📦 Installing Essential Packages"
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    lsb-release \
    unzip
print_success "Essential packages installed"

# Install Docker if not present
print_header "🐳 Installing Docker"
if ! command -v docker &> /dev/null; then
    print_info "Docker not found. Installing Docker..."
    
    # Add Docker's official GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add user to docker group
    usermod -aG docker "$ACTUAL_USER"
    
    print_success "Docker installed successfully"
else
    print_success "Docker already installed ($(docker --version))"
fi

# Install Docker Compose (standalone) if not present
print_header "🐳 Installing Docker Compose"
if ! command -v docker-compose &> /dev/null; then
    print_info "Docker Compose not found. Installing..."
    
    DOCKER_COMPOSE_VERSION="v2.24.0"
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose already installed ($(docker-compose --version))"
fi

# Install Bun if not present
print_header "🥟 Installing Bun"
if ! command -v bun &> /dev/null; then
    print_info "Bun not found. Installing Bun..."
    
    # Install Bun as the actual user
    su - "$ACTUAL_USER" -c "curl -fsSL https://bun.sh/install | bash"
    
    # Add Bun to PATH for root as well
    export BUN_INSTALL="$ACTUAL_HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    print_success "Bun installed successfully"
else
    print_success "Bun already installed ($(bun --version))"
fi

# Install Node.js if not present (fallback)
print_header "📦 Installing Node.js"
if ! command -v node &> /dev/null; then
    print_info "Node.js not found. Installing Node.js 20..."
    
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    print_success "Node.js installed successfully"
else
    print_success "Node.js already installed ($(node --version))"
fi

# Install Nginx
print_header "🌐 Installing Nginx"
if ! command -v nginx &> /dev/null; then
    print_info "Nginx not found. Installing..."
    apt-get install -y nginx
    print_success "Nginx installed successfully"
else
    print_success "Nginx already installed ($(nginx -v 2>&1))"
fi

# Install Certbot
print_header "🔒 Installing Certbot"
if ! command -v certbot &> /dev/null; then
    print_info "Certbot not found. Installing..."
    apt-get install -y certbot python3-certbot-nginx
    print_success "Certbot installed successfully"
else
    print_success "Certbot already installed ($(certbot --version))"
fi

# Configure environment file
print_header "⚙️  Configuring Environment Variables"

if [ ! -f "$PROJECT_DIR/.env.prod" ]; then
    print_warning ".env.prod not found. Creating from example..."
    
    if [ -f "$PROJECT_DIR/.env.prod.example" ]; then
        cp "$PROJECT_DIR/.env.prod.example" "$PROJECT_DIR/.env.prod"
        
        # Generate secure secrets
        print_info "Generating secure secrets..."
        DB_PASSWORD=$(openssl rand -hex 32)
        JWT_SECRET=$(openssl rand -hex 32)
        AUTH_SECRET=$(openssl rand -hex 32)
        API_ADMIN_TOKEN=$(openssl rand -hex 32)
        
        # Update .env.prod with generated secrets
        sed -i "s/your-secure-database-password-here/$DB_PASSWORD/g" "$PROJECT_DIR/.env.prod"
        sed -i "s/your-secure-jwt-secret-here/$JWT_SECRET/g" "$PROJECT_DIR/.env.prod"
        sed -i "s/your-secure-auth-secret-here/$AUTH_SECRET/g" "$PROJECT_DIR/.env.prod"
        sed -i "s/your-secure-admin-token-here/$API_ADMIN_TOKEN/g" "$PROJECT_DIR/.env.prod"
        
        # Save secrets to a file
        cat > "$PROJECT_DIR/.secrets.txt" << EOF
# Generated Secrets - Keep this file secure!
# Generated on: $(date)

DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
AUTH_SECRET=$AUTH_SECRET
API_ADMIN_TOKEN=$API_ADMIN_TOKEN
EOF
        
        chmod 600 "$PROJECT_DIR/.secrets.txt"
        chown "$ACTUAL_USER:$ACTUAL_USER" "$PROJECT_DIR/.secrets.txt"
        
        print_success "Environment file created with secure secrets"
        print_warning "Secrets saved to .secrets.txt - KEEP THIS FILE SECURE!"
    else
        print_error ".env.prod.example not found!"
        exit 1
    fi
else
    print_success ".env.prod already exists"
fi

# Set proper ownership for project files
chown -R "$ACTUAL_USER:$ACTUAL_USER" "$PROJECT_DIR"

# Install project dependencies
print_header "📦 Installing Project Dependencies"
cd "$PROJECT_DIR"

if [ -f "package.json" ]; then
    print_info "Installing dependencies with Bun..."
    su - "$ACTUAL_USER" -c "cd $PROJECT_DIR && $ACTUAL_HOME/.bun/bin/bun install"
    print_success "Dependencies installed"
else
    print_warning "No package.json found, skipping dependency installation"
fi

# Configure Nginx (HTTP-only first, SSL later)
print_header "🌐 Configuring Nginx"

# Create certbot webroot first
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot

if [ -f "$PROJECT_DIR/nginx.conf" ]; then
    print_info "Creating temporary HTTP-only Nginx configuration..."
    
    # Backup existing config if present
    if [ -f "/etc/nginx/sites-available/gossip-club" ]; then
        cp /etc/nginx/sites-available/gossip-club /etc/nginx/sites-available/gossip-club.backup.$(date +%Y%m%d%H%M%S)
        print_info "Backed up existing Nginx configuration"
    fi
    
    # Create temporary HTTP-only configuration for certificate generation
    cat > /etc/nginx/sites-available/gossip-club << 'EOF'
# Temporary HTTP-only configuration for SSL certificate generation
server {
    listen 80;
    listen [::]:80;
    server_name the-gossip-club.sebille.net;

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Temporary proxy to app (will redirect to HTTPS after SSL setup)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name api-the-gossip-club.sebille.net;

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Temporary proxy to API (will redirect to HTTPS after SSL setup)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    
    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Create symlink
    ln -sf /etc/nginx/sites-available/gossip-club /etc/nginx/sites-enabled/
    
    # Test configuration
    if nginx -t; then
        systemctl reload nginx
        print_success "Temporary HTTP-only Nginx configuration installed"
        print_info "Full SSL configuration will be installed after obtaining certificates"
    else
        print_error "Nginx configuration test failed!"
        exit 1
    fi
else
    print_warning "nginx.conf not found, skipping Nginx configuration"
fi

# SSL Certificate setup
print_header "🔒 SSL Certificate Setup"

print_info "Do you want to obtain SSL certificates now? (y/n)"
read -r OBTAIN_SSL

if [[ "$OBTAIN_SSL" =~ ^[Yy]$ ]]; then
    print_info "Enter your email address for Let's Encrypt notifications:"
    read -r EMAIL
    
    if [ -z "$EMAIL" ]; then
        print_warning "No email provided, skipping SSL certificate setup"
        print_info "You can run ./setup-ssl.sh later to obtain certificates"
    else
        print_info "Obtaining SSL certificates..."
        
        # Obtain certificate for Australia app
        if certbot certonly --webroot -w /var/www/certbot \
            -d the-gossip-club.sebille.net \
            --email "$EMAIL" \
            --agree-tos \
            --non-interactive; then
            print_success "Certificate obtained for the-gossip-club.sebille.net"
        else
            print_warning "Failed to obtain certificate for the-gossip-club.sebille.net"
            print_info "Make sure DNS is properly configured and ports 80/443 are open"
        fi
        
        # Obtain certificate for API
        if certbot certonly --webroot -w /var/www/certbot \
            -d api-the-gossip-club.sebille.net \
            --email "$EMAIL" \
            --agree-tos \
            --non-interactive; then
            print_success "Certificate obtained for api-the-gossip-club.sebille.net"
        else
            print_warning "Failed to obtain certificate for api-the-gossip-club.sebille.net"
            print_info "Make sure DNS is properly configured and ports 80/443 are open"
        fi
        
        # Enable auto-renewal
        systemctl enable certbot.timer
        systemctl start certbot.timer
        
        # Install full SSL Nginx configuration
        print_info "Installing full SSL Nginx configuration..."
        if [ -f "$PROJECT_DIR/nginx.conf" ]; then
            cp "$PROJECT_DIR/nginx.conf" /etc/nginx/sites-available/gossip-club
            
            if nginx -t; then
                systemctl reload nginx
                print_success "Full SSL Nginx configuration installed and activated"
            else
                print_warning "Full SSL configuration test failed, keeping temporary HTTP configuration"
                print_info "You may need to manually update the configuration later"
            fi
        fi
        
        print_success "SSL certificates configured"
    fi
else
    print_warning "Skipping SSL certificate setup"
    print_info "You can run ./setup-ssl.sh later to obtain certificates"
fi

# Configure PostgreSQL for Docker network access
print_header "🐘 Configuring PostgreSQL for Docker Network Access"

if command -v psql &> /dev/null; then
    print_info "PostgreSQL found. Configuring network access for Docker containers..."
    
    # Docker containers access host PostgreSQL via the Docker bridge gateway IP
    # The gateway IP is stable (typically 172.x.0.1) and acts as the "host" from container perspective
    # We add common Docker network ranges to handle any bridge network Docker might create
    
    print_info "Configuring PostgreSQL to accept connections from Docker bridge networks..."
    print_info "Containers connect from IPs within Docker subnets (e.g., 172.18.0.2, 172.18.0.3)"
    
    # Docker Network Subnets
    # Containers get IPs from these subnets (e.g., 172.18.0.2)
    # We must allow the ENTIRE subnet, not just gateway IPs
    
    declare -a DOCKER_SUBNETS=()
    
    # Add standard Docker bridge network ranges (172.16-31.0.0/16)
    # Docker uses 172.17.0.0/16 by default and allocates custom bridges sequentially
    for i in {16..31}; do
        DOCKER_SUBNETS+=("172.${i}.0.0/16")
    done
    
    # Check for custom Docker network ranges in daemon.json
    DOCKER_CONFIG="/etc/docker/daemon.json"
    if [ -f "$DOCKER_CONFIG" ]; then
        print_info "Checking Docker daemon.json for custom network ranges..."
        
        # Extract default-address-pools if configured
        # Example: "default-address-pools": [{"base": "10.10.0.0/16", "size": 24}]
        CUSTOM_BASES=$(grep -oP '"base"\s*:\s*"\K[0-9.]+/[0-9]+' "$DOCKER_CONFIG" 2>/dev/null || echo "")
        
        if [ ! -z "$CUSTOM_BASES" ]; then
            while IFS= read -r BASE; do
                DOCKER_SUBNETS+=("$BASE")
                print_info "Found custom Docker network: $BASE"
            done <<< "$CUSTOM_BASES"
        fi
    fi
    
    print_info "Total Docker subnets to configure: ${#DOCKER_SUBNETS[@]}"
    
    # Configure postgresql.conf to listen on Docker bridge interfaces
    PG_CONF="/etc/postgresql/16/main/postgresql.conf"
    if [ -f "$PG_CONF" ]; then
        print_info "Configuring PostgreSQL to listen on all interfaces..."
        
        # Check if already configured
        if grep -q "^listen_addresses = '\*'" "$PG_CONF"; then
            print_info "✓ PostgreSQL already listening on all interfaces"
        else
            # Backup and update
            cp "$PG_CONF" "$PG_CONF.backup.$(date +%Y%m%d_%H%M%S)"
            
            # Update listen_addresses to accept connections from all interfaces
            # This is safe because pg_hba.conf controls authentication
            sed -i "s/^#listen_addresses = .*/listen_addresses = '*'/" "$PG_CONF"
            sed -i "s/^listen_addresses = 'localhost'/listen_addresses = '*'/" "$PG_CONF"
            
            print_success "✓ Updated listen_addresses to '*'"
            NEED_RESTART=true
        fi
    fi
    
    # Configure pg_hba.conf
    PG_HBA_CONF="/etc/postgresql/16/main/pg_hba.conf"
    
    if [ -f "$PG_HBA_CONF" ]; then
        print_info "Updating $PG_HBA_CONF..."
        
        for SUBNET in "${DOCKER_SUBNETS[@]}"; do
            # Check if subnet already exists in pg_hba.conf
            if grep -q "host.*all.*all.*$SUBNET" "$PG_HBA_CONF"; then
                print_info "✓ $SUBNET already configured"
            else
                print_info "Adding subnet $SUBNET to pg_hba.conf..."
                # Use md5 authentication (password-based, no SSL required)
                # This is safe because Docker networks are isolated from external access
                echo "host    all             all             $SUBNET           md5" >> "$PG_HBA_CONF"
                print_success "✓ Added $SUBNET to PostgreSQL allowed connections"
            fi
        done
        
        # Restart or reload PostgreSQL based on what changed
        if systemctl is-active --quiet postgresql; then
            if [ "${NEED_RESTART:-false}" = "true" ]; then
                print_info "Restarting PostgreSQL to apply listen_addresses change..."
                systemctl restart postgresql
                print_success "PostgreSQL restarted"
            else
                systemctl reload postgresql
                print_success "PostgreSQL configuration reloaded"
            fi
        else
            print_warning "PostgreSQL service is not running. Configuration will apply on next start."
        fi
        
        print_info ""
        print_info "📝 PostgreSQL Network Configuration:"
        print_info "   ✓ Docker bridge networks (172.16-31.0.0/16) are allowed"
        print_info "   ✓ Containers connect via: host.docker.internal → PostgreSQL"
        print_info "   ✓ Authentication: MD5 password (no SSL required for Docker networks)"
        print_info "   ✓ Docker networks are isolated from external access"
        print_info ""
        print_info "   Connection string: postgresql://user:pass@host.docker.internal:5432/db"
        print_info ""
    else
        print_warning "PostgreSQL configuration file not found at $PG_HBA_CONF"
        print_info "If using a different PostgreSQL version, manually add Docker network ranges to pg_hba.conf"
    fi
else
    print_info "PostgreSQL not found on host. Skipping network configuration."
    print_info "If using external PostgreSQL, ensure Docker network has access."
fi

# Build and start Docker containers
print_header "🐳 Building and Starting Docker Containers"

print_info "Building Docker images (this may take a while)..."
cd "$PROJECT_DIR"

# Run docker-compose as the actual user (with sudo privileges for docker)
if su - "$ACTUAL_USER" -c "cd $PROJECT_DIR && docker-compose -f docker/compose/docker-compose.prod.yml --env-file .env.prod up -d --build"; then
    print_success "Docker containers started successfully"
    print_info "PostgreSQL is accessible via Docker bridge gateway (already configured)"
else
    print_error "Failed to start Docker containers"
    print_info "Check logs with: docker-compose -f docker/compose/docker-compose.prod.yml logs"
    exit 1
fi

# Wait for services to be healthy
print_info "Waiting for services to start..."
sleep 10

# Check container status
print_header "📊 Container Status"
su - "$ACTUAL_USER" -c "cd $PROJECT_DIR && docker-compose -f docker/compose/docker-compose.prod.yml ps"

# Configure firewall (if UFW is available)
print_header "🔥 Configuring Firewall"
if command -v ufw &> /dev/null; then
    print_info "Configuring UFW firewall..."
    
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    
    # Enable UFW if not already enabled
    print_info "Do you want to enable UFW firewall? (y/n)"
    read -r ENABLE_UFW
    
    if [[ "$ENABLE_UFW" =~ ^[Yy]$ ]]; then
        echo "y" | ufw enable
        print_success "Firewall configured and enabled"
    else
        print_warning "Firewall rules added but not enabled"
    fi
else
    print_warning "UFW not found, skipping firewall configuration"
fi

# Final summary
print_header "🎉 Deployment Complete!"

echo ""
print_success "The Gossip Club has been deployed successfully!"
echo ""
print_info "Important Information:"
echo ""
echo "  📁 Project Directory: $PROJECT_DIR"
echo "  🔑 Secrets File: $PROJECT_DIR/.secrets.txt (KEEP SECURE!)"
echo "  ⚙️  Environment File: $PROJECT_DIR/.env.prod"
echo ""
print_info "Services:"
echo ""
echo "  🌐 Australia App: https://the-gossip-club.sebille.net"
echo "  🔌 API: https://api-the-gossip-club.sebille.net"
echo ""
print_info "Useful Commands:"
echo ""
echo "  📊 View logs: docker-compose -f docker/compose/docker-compose.prod.yml logs -f"
echo "  🔄 Restart services: docker-compose -f docker/compose/docker-compose.prod.yml restart"
echo "  🛑 Stop services: docker-compose -f docker/compose/docker-compose.prod.yml down"
echo "  📈 Container status: docker-compose -f docker/compose/docker-compose.prod.yml ps"
echo "  🔒 SSL status: sudo certbot certificates"
echo ""
print_warning "Next Steps:"
echo ""
echo "  1. Make sure your DNS records are configured:"
echo "     - the-gossip-club.sebille.net → $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo "     - api-the-gossip-club.sebille.net → $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo ""
echo "  2. If you skipped SSL setup, run: sudo ./setup-ssl.sh"
echo ""
echo "  3. Review your secrets in: $PROJECT_DIR/.secrets.txt"
echo ""
echo "  4. Test your application:"
echo "     - Open https://the-gossip-club.sebille.net in your browser"
echo "     - Check API health: https://api-the-gossip-club.sebille.net/health"
echo ""
print_success "Happy deploying! 🚀"
echo ""
