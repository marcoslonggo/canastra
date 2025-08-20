# Buraco/Canastra Game - Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- **Node.js** (v16+ **REQUIRED**, v18+ recommended)
- **npm** (comes with Node.js)
- **Git**

⚠️ **IMPORTANT**: Node.js v14 or older will cause TypeScript compilation errors. Please upgrade to Node.js v16+.

### 🩹 Quick Fix for Node.js Version Error
If you get `SyntaxError: Unexpected token '?'` during build:
```bash
# Install Node.js 18 using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
node --version  # Should show v18.x.x
```

### 1. Clone the Repository
```bash
git clone https://github.com/marcoslonggo/canastra.git
cd canastra
```

### 2. Install Dependencies

#### Backend Setup
```bash
cd server
npm install
```

#### Frontend Setup
```bash
cd ../client
npm install
```

### 3. Environment Configuration

#### Backend Environment (.env)
```bash
cd ../server
```

Create a `.env` file in the server directory:
```env
# Database
DATABASE_PATH=database.db

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key-here

# Admin Password
ADMIN_PASSWORD=your-admin-password-here

# Server Configuration
PORT=3002
NODE_ENV=development
```

### 4. Build the Application

#### Build Backend
```bash
cd server
npm run build
```

#### Build Frontend (Optional - for production)
```bash
cd ../client
npm run build
```

### 5. Start the Application

#### Development Mode
Start both servers in separate terminals:

**Terminal 1 - Backend:**
```bash
cd server
ADMIN_PASSWORD=test_admin_123 PORT=3002 npm start
```

**Terminal 2 - Frontend:**
```bash
cd client
PORT=3004 npm start
```

#### Production Mode
For production, you can serve the built frontend:

**Backend:**
```bash
cd server
ADMIN_PASSWORD=your-admin-password PORT=3002 npm start
```

**Frontend (using serve):**
```bash
cd client
npm install -g serve
serve -s build -l 3004
```

### 6. Access the Application

- **Game Interface**: http://localhost:3004
- **Backend API**: http://localhost:3002

## 🎮 Quick Login Users

The application automatically creates test users on first startup:

| Username | Password | 
|----------|----------|
| marcos   | cro123   |
| michele  | mibisa   |
| miriam   | 123456   |
| marcelo  | 123456   |

## 📱 Testing Multi-Player Games

1. Open multiple browser tabs/windows to http://localhost:3004
2. Use the quick login buttons for different users
3. Create a game with one user, join with others
4. Test the Buraco/Canastra gameplay

## 🛠 Development Scripts

### Backend Commands
```bash
cd server
npm run dev          # Development with auto-reload
npm run build        # Build TypeScript to JavaScript
npm start           # Run built application
npm run lint        # Run ESLint
```

### Frontend Commands
```bash
cd client
npm start           # Development server
npm run build       # Production build
npm test           # Run tests
npm run lint       # Run ESLint
```

## 🐳 Docker Deployment (Optional)

If you prefer Docker, you can create these files:

**Dockerfile (Backend):**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - "3002:3002"
    environment:
      - ADMIN_PASSWORD=test_admin_123
      - PORT=3002
    volumes:
      - ./server/database.db:/app/database.db
  
  frontend:
    build: ./client
    ports:
      - "3004:3000"
    depends_on:
      - backend
```

## 🔧 Troubleshooting

### Common Issues

**Node.js Version Too Old (SyntaxError: Unexpected token '?'):**
```bash
# Check current Node.js version
node --version

# If version is < 16, update Node.js:

# Option 1: Using Node Version Manager (nvm) - Recommended
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Option 2: Using NodeSource repository (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Option 3: Using Homebrew (macOS)
brew install node@18

# Verify installation
node --version  # Should show v18.x.x or v16.x.x+
npm --version
```

**Port Already in Use:**
```bash
# Find process using port
lsof -i :3002
lsof -i :3004

# Kill process if needed
kill -9 <PID>
```

**Database Issues:**
- Database file is created automatically in `server/database.db`
- Delete `database.db` to reset all data
- Check server logs for database creation messages

**Permission Issues:**
```bash
# Fix npm permissions (if needed)
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

**Build Errors:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🌐 Production Deployment

### Environment Variables
For production, set these environment variables:

```bash
NODE_ENV=production
JWT_SECRET=your-very-secure-random-string-here
ADMIN_PASSWORD=your-secure-admin-password
DATABASE_PATH=/path/to/persistent/database.db
```

### Security Considerations
1. **Change default passwords** in production
2. **Use HTTPS** with proper SSL certificates
3. **Set strong JWT_SECRET**
4. **Configure firewall rules**
5. **Use environment variables** for secrets

### Process Management
Consider using PM2 for production:

```bash
npm install -g pm2

# Start backend
cd server
pm2 start npm --name "canastra-backend" -- start

# Start frontend (if serving built version)
cd ../client
pm2 serve build 3004 --name "canastra-frontend"

# Save PM2 configuration
pm2 save
pm2 startup
```

## 📝 Architecture Overview

- **Backend**: Node.js + TypeScript + Express + WebSocket + SQLite
- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion
- **Database**: SQLite (file-based, no setup required)
- **Real-time**: WebSocket for game state synchronization

## 🎯 Game Features

- ✅ Complete Buraco/Canastra rules implementation
- ✅ Mobile-first responsive design
- ✅ Real-time multiplayer gameplay
- ✅ Automatic user management
- ✅ Touch-optimized controls
- ✅ Multiple language support (i18n ready)

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Ensure all dependencies are correctly installed
4. Verify environment variables are set properly

---
*Generated with Claude Code - Ready to play Buraco/Canastra! 🃏*