#!/bin/bash

# Canastra Game Management Script
# Usage: ./start-canastra.sh [start|stop|restart|status]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=3002
FRONTEND_PORT=3004
ADMIN_PASSWORD="test_admin_123"
PROJECT_DIR="/path/to/canastra"
BACKEND_DIR="$PROJECT_DIR/server"
FRONTEND_DIR="$PROJECT_DIR/client"

# PID files
BACKEND_PID_FILE="/tmp/canastra-backend.pid"
FRONTEND_PID_FILE="/tmp/canastra-frontend.pid"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if process is running
is_running() {
    local pid_file=$1
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0  # Running
        else
            rm -f "$pid_file"  # Clean up stale PID file
            return 1  # Not running
        fi
    fi
    return 1  # Not running
}

# Function to get process status
get_status() {
    echo -e "${BLUE}=== Canastra Game Status ===${NC}"
    
    # Check backend
    if is_running "$BACKEND_PID_FILE"; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        print_success "Backend: Running (PID: $backend_pid, Port: $BACKEND_PORT)"
    else
        print_warning "Backend: Not running"
    fi
    
    # Check frontend
    if is_running "$FRONTEND_PID_FILE"; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        print_success "Frontend: Running (PID: $frontend_pid, Port: $FRONTEND_PORT)"
    else
        print_warning "Frontend: Not running"
    fi
    
    # Check ports
    echo ""
    print_status "Port check:"
    if netstat -ln 2>/dev/null | grep -q ":$BACKEND_PORT "; then
        echo "  ✅ Backend port $BACKEND_PORT is in use"
    else
        echo "  ❌ Backend port $BACKEND_PORT is free"
    fi
    
    if netstat -ln 2>/dev/null | grep -q ":$FRONTEND_PORT "; then
        echo "  ✅ Frontend port $FRONTEND_PORT is in use"
    else
        echo "  ❌ Frontend port $FRONTEND_PORT is free"
    fi
    
    echo ""
    echo "Access URLs:"
    echo "  🌐 Game: http://localhost:$FRONTEND_PORT"
    echo "  🌐 Game (Network): http://$(ip route get 1 2>/dev/null | awk '{print $7; exit}' || hostname -I | awk '{print $1}'):$FRONTEND_PORT"
    echo "  🔧 API: http://localhost:$BACKEND_PORT"
}

# Function to start backend
start_backend() {
    if is_running "$BACKEND_PID_FILE"; then
        print_warning "Backend is already running"
        return
    fi
    
    print_status "Starting backend..."
    cd "$BACKEND_DIR"
    
    # Check if dist folder exists
    if [ ! -d "dist" ]; then
        print_status "Building backend first..."
        npm run build
    fi
    
    # Start backend in background
    ADMIN_PASSWORD="$ADMIN_PASSWORD" PORT="$BACKEND_PORT" npm start > /tmp/canastra-backend.log 2>&1 &
    local backend_pid=$!
    echo "$backend_pid" > "$BACKEND_PID_FILE"
    
    # Wait a moment to check if it started successfully
    sleep 2
    if is_running "$BACKEND_PID_FILE"; then
        print_success "Backend started (PID: $backend_pid)"
    else
        print_error "Backend failed to start. Check /tmp/canastra-backend.log for details"
        return 1
    fi
}

# Function to start frontend
start_frontend() {
    if is_running "$FRONTEND_PID_FILE"; then
        print_warning "Frontend is already running"
        return
    fi
    
    print_status "Starting frontend..."
    cd "$FRONTEND_DIR"
    
    # Start frontend in background
    HOST=0.0.0.0 PORT="$FRONTEND_PORT" npm start > /tmp/canastra-frontend.log 2>&1 &
    local frontend_pid=$!
    echo "$frontend_pid" > "$FRONTEND_PID_FILE"
    
    # Wait a moment to check if it started successfully
    sleep 3
    if is_running "$FRONTEND_PID_FILE"; then
        print_success "Frontend started (PID: $frontend_pid)"
    else
        print_error "Frontend failed to start. Check /tmp/canastra-frontend.log for details"
        return 1
    fi
}

# Function to stop backend
stop_backend() {
    if is_running "$BACKEND_PID_FILE"; then
        local pid=$(cat "$BACKEND_PID_FILE")
        print_status "Stopping backend (PID: $pid)..."
        kill "$pid"
        rm -f "$BACKEND_PID_FILE"
        print_success "Backend stopped"
    else
        print_warning "Backend is not running"
    fi
}

# Function to stop frontend
stop_frontend() {
    if is_running "$FRONTEND_PID_FILE"; then
        local pid=$(cat "$FRONTEND_PID_FILE")
        print_status "Stopping frontend (PID: $pid)..."
        kill "$pid"
        rm -f "$FRONTEND_PID_FILE"
        print_success "Frontend stopped"
    else
        print_warning "Frontend is not running"
    fi
}

# Function to start all services
start_all() {
    echo -e "${BLUE}=== Starting Canastra Game ===${NC}"
    start_backend
    start_frontend
    echo ""
    get_status
}

# Function to stop all services
stop_all() {
    echo -e "${BLUE}=== Stopping Canastra Game ===${NC}"
    stop_frontend
    stop_backend
    
    # Clean up any remaining processes
    pkill -f "PORT=$BACKEND_PORT npm start" 2>/dev/null || true
    pkill -f "PORT=$FRONTEND_PORT npm start" 2>/dev/null || true
    
    print_success "All services stopped"
}

# Function to restart all services
restart_all() {
    echo -e "${BLUE}=== Restarting Canastra Game ===${NC}"
    stop_all
    sleep 2
    start_all
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}=== Recent Logs ===${NC}"
    
    if [ -f "/tmp/canastra-backend.log" ]; then
        echo -e "${YELLOW}Backend logs (last 10 lines):${NC}"
        tail -10 /tmp/canastra-backend.log
        echo ""
    fi
    
    if [ -f "/tmp/canastra-frontend.log" ]; then
        echo -e "${YELLOW}Frontend logs (last 10 lines):${NC}"
        tail -10 /tmp/canastra-frontend.log
        echo ""
    fi
}

# Function to show help
show_help() {
    echo -e "${BLUE}=== Canastra Game Management Script ===${NC}"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     - Start both backend and frontend"
    echo "  stop      - Stop both services"
    echo "  restart   - Restart both services"
    echo "  status    - Show current status"
    echo "  logs      - Show recent logs"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start          # Start the game"
    echo "  $0 status         # Check if running"
    echo "  $0 restart        # Restart everything"
    echo "  $0 logs           # Check for errors"
    echo ""
    echo "The game will be available at:"
    echo "  🌐 http://localhost:$FRONTEND_PORT (local)"
    echo "  🌐 http://$(ip route get 1 2>/dev/null | awk '{print $7; exit}' || echo '192.168.1.23'):$FRONTEND_PORT (network)"
}

# Main script logic
case "${1:-help}" in
    "start")
        start_all
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        restart_all
        ;;
    "status")
        get_status
        ;;
    "logs")
        show_logs
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac