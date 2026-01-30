# 🃏 Canastra - Brazilian Canastra Card Game

A modern, real-time multiplayer implementation of the classic Brazilian Canastra (Buraco) card game, built with cutting-edge web technologies.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-19-blue)
![License](https://img.shields.io/badge/License-ISC-yellow)

## 🎮 Features

- **Real-time Multiplayer**: Play with friends using WebSocket-based real-time communication
- **Mobile-First Design**: Fully responsive interface optimized for touch devices
- **Team-Based Gameplay**: Classic 2v2 or 2v3 Canastra team mechanics
- **Authentication System**: Secure user registration and login with JWT tokens
- **Modern UI**: Beautiful interface built with Tailwind CSS and Framer Motion
- **Internationalization**: Multi-language support (Portuguese and English)
- **Game Logic**: Complete Buraco/Canastra rules implementation including:
  - Card drawing and discarding
  - Sequence formation and validation
  - Mortos (dead decks) system
  - Team score tracking
  - Win condition detection

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.9
- **Framework**: Express.js
- **Database**: SQLite3
- **Real-time**: Socket.IO
- **Authentication**: bcrypt + JWT
- **Build Tool**: TypeScript Compiler

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **UI Components**: Radix UI
- **Internationalization**: i18next
- **Testing**: Playwright + React Testing Library

## 📸 Screenshots

Coming soon! Add screenshots of your game to showcase the interface.

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher (v16 minimum)
- **npm**: Comes with Node.js
- **Git**: For cloning the repository

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/marcoslonggo/canastra.git
   cd canastra
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd ../client
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**

   Create `.env` file in `server/` directory:
   ```env
   PORT=3002
   NODE_ENV=development
   DB_PATH=./database.db
   JWT_SECRET=your-secret-key-change-in-production
   JWT_EXPIRES_IN=24h
   ADMIN_PASSWORD=your-admin-password-here
   ALLOWED_ORIGINS=http://localhost:3004
   LOG_LEVEL=info
   ```

4. **Start the application**

   **Terminal 1 - Backend:**
   ```bash
   cd server
   npm run build
   npm start
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd client
   npm start
   ```

5. **Access the game**
   - Frontend: http://localhost:3004
   - Backend API: http://localhost:3002

### Using the Startup Script

For convenience, use the provided startup script:

```bash
# Make executable
chmod +x start-canastra.sh

# Start both backend and frontend
./start-canastra.sh start

# Check status
./start-canastra.sh status

# View logs
./start-canastra.sh logs

# Stop everything
./start-canastra.sh stop
```

## 🎯 How to Play

1. **Register/Login**: Create an account or log in with existing credentials
2. **Create Game**: Create a new game and wait for players to join
3. **Join Game**: Join an existing game from the lobby
4. **Play**: Take turns drawing cards, forming sequences, and discarding
5. **Win**: First team to reach the target score wins!

For detailed rules, see [BURACO_RULES.md](BURACO_RULES.md).

## 🧪 Development

### Backend Development

```bash
cd server
npm run dev  # Runs with auto-reload using nodemon
npm run build  # Compiles TypeScript
npm start      # Runs compiled server
```

### Frontend Development

```bash
cd client
npm run dev    # Vite dev server with HMR
npm run build  # Production build
npm run preview # Preview production build
```

### Project Structure

```
canastra/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components (atoms, molecules, organisms)
│   │   ├── stores/        # Zustand state management
│   │   └── ...
│   └── public/           # Static assets
├── server/                # Node.js backend
│   ├── src/
│   │   ├── game/         # Game logic and rules
│   │   ├── database/      # Database operations
│   │   ├── auth/         # Authentication
│   │   └── server.ts     # Express server
│   └── database.db       # SQLite database (git-ignored)
├── shared/                # Shared TypeScript types
└── tests/                # E2E and integration tests
```

## 🧪 Testing

### Run Tests

```bash
# End-to-end tests with Playwright
cd tests
npx playwright install
npm test

# Backend tests (if available)
cd server
npm test
```

### Test Files

- `tests/e2e/` - End-to-end tests with Playwright
- `tests/backend/` - Backend integration tests
- `test-*.js` - Manual test scripts in root directory

## 🚢 Deployment

### Production Build

```bash
# Build backend
cd server
npm run build

# Build frontend
cd client
npm run build
```

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions including:
- Environment configuration
- Production server setup
- Security considerations
- Performance optimization

### Quick Production Start

```bash
# Backend
cd server
ADMIN_PASSWORD=your-secure-password PORT=3002 npm start

# Frontend (using Vite preview)
cd client
npm run build
HOST=0.0.0.0 npm run preview
```

## 🔒 Security

This project follows security best practices:

- ✅ No hardcoded credentials in code
- ✅ Environment-based configuration
- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ CORS protection
- ✅ Comprehensive .gitignore for sensitive files

For detailed security information, see [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

## 🌐 API Documentation

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### WebSocket Events

- `authenticate` - Authenticate WebSocket connection
- `create-game` - Create new game
- `join-game` - Join existing game
- `draw-card` - Draw card from deck
- `discard-card` - Discard card to discard pile
- `play-cards` - Play card sequence

See [ARCHITECTURE.md](ARCHITECTURE.md) for full API documentation.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add some amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Add comments for complex logic
- Update documentation as needed

## 📝 Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and design decisions
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [BURACO_RULES.md](BURACO_RULES.md) - Game rules and mechanics
- [SECURITY_AUDIT.md](SECURITY_AUDIT.md) - Security audit and best practices
- [GUIA_DO_JOGADOR.md](GUIA_DO_JOGADOR.md) - Player guide (Portuguese)
- [COMO_INICIAR.md](COMO_INICIAR.md) - Quick start guide (Portuguese)

## 🐛 Troubleshooting

### Common Issues

**Problem**: Build fails with syntax error
```
Solution: Upgrade Node.js to v18 or higher
nvm install 18
nvm use 18
```

**Problem**: Database locked error
```
Solution: Ensure only one server instance is running
pkill -f "npm start"
```

**Problem**: WebSocket connection fails
```
Solution: Check CORS settings in server/.env
Ensure ALLOWED_ORIGINS includes your frontend URL
```

For more issues, see [BUGS.md](BUGS.md).

## 📊 Current Status

- ✅ Core game logic implemented
- ✅ Real-time multiplayer
- ✅ Authentication system
- ✅ Mobile-responsive UI
- ✅ Internationalization support
- 🚧 Advanced testing (in progress)
- 🚧 Performance optimization (in progress)

See [TODO.md](TODO.md) for planned features and improvements.

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Socket.IO](https://socket.io/) - Real-time bidirectional communication
- [React](https://reactjs.org/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Framer Motion](https://www.framer.com/motion) - Animation library
- [Radix UI](https://www.radix-ui.com/) - Unstyled UI components

## 📧 Contact & Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/marcoslonggo/canastra/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/marcoslonggo/canastra/discussions)
- 📧 **Support**: Create an issue for bugs or feature requests

---

**Built with ❤️ using modern web technologies**
