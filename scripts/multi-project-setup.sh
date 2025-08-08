#!/bin/bash

# 🚀 Multi-Project Development Setup Script
# This script sets up aliases and functions for managing multiple projects in Cursor

echo "🚀 Setting up Multi-Project Development Environment..."

# Create aliases directory if it doesn't exist
mkdir -p ~/.cursor-aliases

# Real-Estate Email Processor Project
cat > ~/.cursor-aliases/real-estate.sh << 'EOF'
#!/bin/bash

# Real-Estate Email Processor Project Aliases
export REAL_ESTATE_DIR="/Users/rustammuharamov/Cursor/real-estate-email-processor"

alias re-frontend="cd \$REAL_ESTATE_DIR/frontend && npm start"
alias re-backend="cd \$REAL_ESTATE_DIR/backend && npm run dev"
alias re-docker="cd \$REAL_ESTATE_DIR && docker-compose up -d"
alias re-logs="cd \$REAL_ESTATE_DIR && docker-compose logs -f"
alias re-stop="cd \$REAL_ESTATE_DIR && docker-compose down"
alias re-restart="cd \$REAL_ESTATE_DIR && docker-compose down && docker-compose up -d"

# Quick access functions
re-start() {
    echo "🚀 Starting Real-Estate Email Processor..."
    cd $REAL_ESTATE_DIR
    docker-compose up -d
    echo "✅ Services started on ports 3100, 3101, 3102"
    echo "🌐 Frontend: http://localhost:3100"
    echo "🔧 Backend: http://localhost:3101"
}

re-status() {
    echo "📊 Real-Estate Email Processor Status:"
    echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100 || echo "Not running")"
    echo "Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3101/real-estate-email-system-backend/api/health || echo "Not running")"
    echo "MongoDB: $(docker ps | grep 3102 | wc -l | xargs echo "Containers running:")"
}
EOF

# Flyer Creator Project
cat > ~/.cursor-aliases/flyer-creator.sh << 'EOF'
#!/bin/bash

# Flyer Creator Project Aliases
export FLYER_DIR="/Users/rustammuharamov/Cursor/flyer-creator"

alias fc-frontend="cd \$FLYER_DIR/frontend && npm start"
alias fc-backend="cd \$FLYER_DIR/backend && npm run dev"
alias fc-docker="cd \$FLYER_DIR && docker-compose up -d"
alias fc-logs="cd \$FLYER_DIR && docker-compose logs -f"
alias fc-stop="cd \$FLYER_DIR && docker-compose down"
alias fc-restart="cd \$FLYER_DIR && docker-compose down && docker-compose up -d"

# Quick access functions
fc-start() {
    echo "🚀 Starting Flyer Creator..."
    cd $FLYER_DIR
    docker-compose up -d
    echo "✅ Services started on ports 4000, 4001, 4002, 4003, 4004"
    echo "🌐 Frontend: http://localhost:4000"
    echo "🔧 Backend: http://localhost:4002"
}

fc-status() {
    echo "📊 Flyer Creator Status:"
    echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000 || echo "Not running")"
    echo "Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:4002/health || echo "Not running")"
    echo "MongoDB: $(docker ps | grep 4001 | wc -l | xargs echo "Containers running:")"
}
EOF

# General project management functions
cat > ~/.cursor-aliases/project-manager.sh << 'EOF'
#!/bin/bash

# General project management functions
projects-status() {
    echo "🏠 Real-Estate Email Processor:"
    re-status
    echo ""
    echo "🎨 Flyer Creator:"
    fc-status
}

start-all() {
    echo "🚀 Starting all projects..."
    re-start
    echo ""
    fc-start
    echo ""
    echo "✅ All projects started!"
}

stop-all() {
    echo "🛑 Stopping all projects..."
    re-stop
    fc-stop
    echo "✅ All projects stopped!"
}

restart-all() {
    echo "🔄 Restarting all projects..."
    stop-all
    sleep 2
    start-all
}

# Port checking utilities
check-ports() {
    echo "🔍 Checking port usage:"
    echo "Port 3100 (Real-Estate Frontend): $(lsof -i :3100 | wc -l | xargs echo "Processes:")"
    echo "Port 3101 (Real-Estate Backend): $(lsof -i :3101 | wc -l | xargs echo "Processes:")"
    echo "Port 4000 (Flyer Frontend): $(lsof -i :4000 | wc -l | xargs echo "Processes:")"
    echo "Port 4002 (Flyer Backend): $(lsof -i :4002 | wc -l | xargs echo "Processes:")"
}

# Cursor workspace management
open-real-estate() {
    cursor /Users/rustammuharamov/Cursor/real-estate-email-processor
}

open-flyer() {
    cursor /Users/rustammuharamov/Cursor/flyer-creator
}

# Quick navigation
cd-re() {
    cd /Users/rustammuharamov/Cursor/real-estate-email-processor
}

cd-fc() {
    cd /Users/rustammuharamov/Cursor/flyer-creator
}
EOF

# Make scripts executable
chmod +x ~/.cursor-aliases/*.sh

# Add to shell profile
SHELL_PROFILE=""
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then
    SHELL_PROFILE="$HOME/.bashrc"
fi

if [ -n "$SHELL_PROFILE" ]; then
    echo "" >> "$SHELL_PROFILE"
    echo "# Cursor Multi-Project Development Aliases" >> "$SHELL_PROFILE"
    echo "source ~/.cursor-aliases/real-estate.sh" >> "$SHELL_PROFILE"
    echo "source ~/.cursor-aliases/flyer-creator.sh" >> "$SHELL_PROFILE"
    echo "source ~/.cursor-aliases/project-manager.sh" >> "$SHELL_PROFILE"
    echo "✅ Added aliases to $SHELL_PROFILE"
fi

echo ""
echo "🎉 Multi-Project Development Setup Complete!"
echo ""
echo "📋 Available Commands:"
echo "  re-start      - Start Real-Estate project"
echo "  fc-start      - Start Flyer Creator project"
echo "  start-all     - Start both projects"
echo "  stop-all      - Stop both projects"
echo "  restart-all   - Restart both projects"
echo "  projects-status - Check status of all projects"
echo "  check-ports   - Check port usage"
echo "  open-real-estate - Open Real-Estate in Cursor"
echo "  open-flyer    - Open Flyer Creator in Cursor"
echo ""
echo "🔄 Please restart your terminal or run:"
echo "   source $SHELL_PROFILE" 