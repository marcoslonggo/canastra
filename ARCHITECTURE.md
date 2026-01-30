# Brazilian Canastra Game - Architecture Documentation

## Project Overview
A web-based multiplayer Brazilian Buraco (Canastra) card game with real-time WebSocket communication, team selection, and mobile-responsive design.

## Technology Stack
- **Frontend**: React + TypeScript + Socket.io-client
- **Backend**: Node.js + Express + TypeScript + Socket.io
- **Database**: SQLite (file-based)
- **Authentication**: JWT tokens + bcrypt

## Project Structure

```
/path/to/canastra/
├── PLAN.md                    # Development roadmap and session logs
├── ARCHITECTURE.md            # This file - component documentation
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # React UI components
│   │   ├── services/          # WebSocket and API services
│   │   ├── types.ts          # TypeScript type definitions
│   │   └── App.tsx           # Main application component
│   └── package.json
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── auth/             # Authentication logic
│   │   ├── database/         # SQLite operations
│   │   ├── game/             # Game logic and state management
│   │   ├── socket/           # WebSocket event handlers
│   │   └── server.ts         # Main server file
│   ├── database.db           # SQLite database file
│   └── package.json
└── shared/                    # Shared TypeScript types
    └── types.ts
```

## Frontend Components

### App.tsx (Main Application)
**Location**: `/client/src/App.tsx`
**Purpose**: Root component managing application state and routing
**Key Responsibilities**:
- User authentication state management
- WebSocket connection lifecycle (CRITICAL: connects on login, disconnects on logout)
- Screen navigation (auth → lobby → waiting → game)
- Game reconnection handling (game-reconnected, waiting-room-reconnected events)
- Persistent authentication via localStorage

**Critical Implementation Notes**:
- Manages WebSocket connection at app level to prevent disconnections during screen transitions
- Handles automatic reconnection when page refreshes
- Sets up reconnection listeners for seamless game/waiting room rejoining

### Auth.tsx (Authentication)
**Location**: `/client/src/components/Auth.tsx`
**Purpose**: Login and registration forms
**Key Responsibilities**:
- User login/register UI
- Form validation
- JWT token handling
- Calls onLogin callback to App component

### GameLobby.tsx (Main Lobby)
**Location**: `/client/src/components/GameLobby.tsx`
**Purpose**: Main game lobby where users create/join games
**Key Responsibilities**:
- Display available games list
- Create new games
- Join games by code
- Lobby chat functionality
- Connection status indicator
- Game list real-time updates

**Critical Implementation Notes**:
- NO LONGER manages WebSocket connection (moved to App.tsx to fix disconnection bug)
- Only handles lobby-specific events (game-created, game-list-updated, chat-message)
- Transitions to waiting room via onGameStart callback

### WaitingRoom.tsx (Pre-Game Room)
**Location**: `/client/src/components/WaitingRoom.tsx`
**Purpose**: Team selection and game setup before starting
**Key Responsibilities**:
- Display current players and team assignments
- Team switching functionality (Join Team 1/2 buttons)
- Host controls (Start Game button)
- Room code sharing
- Player connection status
- Real-time team updates

**Critical Implementation Notes**:
- Accepts initialGameState prop to avoid loading screen
- Shows team selection buttons only for teams player is not currently on
- Validates team capacity (max 2 players per team)
- Host is always the first player who created the game

### GameTable.tsx (Game Playing)
**Location**: `/client/src/components/GameTable.tsx`
**Purpose**: Main game interface for playing Buraco
**Key Responsibilities**:
- Card rendering and interactions
- Game state display (hands, sequences, scores)
- Player actions (draw, baixar, discard, bater)
- Turn management
- Game completion handling
- **Modern chat overlay system** (Issue #15 implementation)

**Chat System Features**:
- **Non-intrusive overlay**: Glassmorphism design that doesn't consume game space
- **Auto-fade messaging**: Messages auto-fade after 4 seconds when chat is closed
- **Mobile-responsive**: Touch-friendly design with comprehensive breakpoints
- **Message management**: Limited to 100 messages for performance
- **Smooth animations**: Enter/exit animations with accessibility support

## Frontend Services

### gameService.ts (WebSocket Manager)
**Location**: `/client/src/services/gameService.ts`
**Purpose**: Singleton service managing WebSocket communication
**Key Methods**:
- `connect(user)`: Establish WebSocket connection
- `disconnect()`: Close connection
- `isConnected()`: Check connection status
- `createGame()`: Request new game creation
- `joinGame(gameId)`: Join existing game
- `switchTeam(teamNumber)`: Change team assignment
- `startGame()`: Start game (host only)
- `sendChatMessage()`: Send lobby/game chat

**Event Handling**:
- Emits: authenticate, create-game, join-game, switch-team, start-game, game-action
- Listens: authenticated, game-created, game-state-update, waiting-room-reconnected, etc.

## Backend Components

### server.ts (Main Server)
**Location**: `/server/src/server.ts`
**Purpose**: Express server with Socket.io integration
**Key Responsibilities**:
- HTTP routes for authentication (/auth/login, /auth/register)
- WebSocket event handling
- CORS configuration for frontend
- Database initialization

**Critical Socket Events**:
- `authenticate`: Validate user and setup reconnection
- `create-game`: Create new game room
- `join-game`: Join existing game
- `switch-team`: Change team assignment
- `start-game`: Begin game play
- `game-action`: Handle game moves (draw, baixar, discard, bater)

### game-manager.ts (Game State Manager)
**Location**: `/server/src/game/game-manager.ts`
**Purpose**: Central manager for all active games
**Key Responsibilities**:
- Game creation and player assignment
- Team management and validation
- Game state retrieval
- Player reconnection logic
- Game lifecycle management

**Key Methods**:
- `createGame(playerId, username)`: Create new game room
- `joinGame(gameId, playerId, username)`: Add player to game
- `switchTeam(gameId, playerId, newTeam)`: Handle team changes
- `startGame(gameId, requestingPlayerId)`: Begin game play
- `reconnectPlayer(playerId)`: Handle player reconnection

### buraco-engine.ts (Game Logic)
**Location**: `/server/src/game/buraco-engine.ts`
**Purpose**: Core Brazilian Buraco game rules and mechanics
**Key Responsibilities**:
- Card dealing and deck management
- Turn management
- Sequence validation (same-suit sequences, 3-aces rule)
- **Wildcard validation and limits** (Issue #16 implementation)
- Scoring calculation
- Canastra detection (Limpa +200, Suja +100, Ás-à-Ás +1000)
- Bater and Morto mechanics
- Win condition checking

### sequences.ts (Sequence Validation)
**Location**: `/server/src/game/sequences.ts`
**Purpose**: Sequence validation logic and wildcard rule enforcement
**Key Responsibilities**:
- Sequence structure validation (minimum 3 cards, same suit)
- **Wildcard limit enforcement**: Maximum 1 wildcard per sequence
- **Special exception**: Wildcard 2 in natural position (A-2-3) allows 2 wildcards
- Ace sequence validation (A-A-A combinations)
- Optimal wildcard positioning for game display
- Canastra type detection (Limpa/Suja/Ás-à-Ás)

### auth.ts (Authentication)
**Location**: `/server/src/auth/auth.ts`
**Purpose**: User authentication and JWT management
**Key Responsibilities**:
- User registration with bcrypt password hashing
- Login validation
- JWT token generation and verification
- User data retrieval

### Database Schema
**Location**: `/server/database.db`
**Tables**:
- `users`: User accounts with authentication
- `games`: Game records and results
- `game_results`: Player participation and scores

## Data Flow

### Game Creation Flow
1. User clicks "Create Game" in GameLobby
2. GameLobby emits `create-game` via gameService
3. Server creates game via gameManager.createGame()
4. Server emits `game-created` + immediate `game-state-update`
5. Frontend transitions to WaitingRoom with initial state
6. WaitingRoom displays team selection UI

### Team Switching Flow
1. User clicks "Join Team X" button in WaitingRoom
2. WaitingRoom calls gameService.switchTeam(teamNumber)
3. Server validates switch via gameManager.switchTeam()
4. Server broadcasts `game-state-update` to all players
5. All WaitingRoom components update team display

### Connection Management
1. App.tsx establishes WebSocket connection on login
2. Connection persists across all screen transitions
3. GameLobby handles lobby-specific events
4. WaitingRoom handles waiting room events
5. GameTable handles game play events
6. Connection only closed on logout or page close

## Key Design Decisions

### WebSocket Connection Lifecycle
- **Problem**: Component-level connection management caused disconnections during screen transitions
- **Solution**: Moved connection to App.tsx level for persistence
- **Result**: Stable connections across all game states

### Team Selection Implementation
- **Auto-assignment**: Players initially assigned to teams 1,1,2,2
- **Manual switching**: Players can click buttons to change teams
- **Validation**: Max 2 players per team, prevent joining current team
- **Real-time**: Changes broadcast immediately to all players

### Game State Management
- **Server authority**: All game state managed server-side
- **Event-driven**: Frontend reacts to server state updates
- **Reconnection**: Automatic rejoin to games/waiting rooms
- **Persistence**: In-memory storage with reconnection support

## Common Issues and Solutions

### Loading Screen Stuck
- **Cause**: Missing initial game state after creation
- **Solution**: Server sends game-state-update immediately after game-created
- **Prevention**: Always provide initial state for waiting room

### WebSocket Disconnections
- **Cause**: Component unmounting during transitions
- **Solution**: App-level connection management
- **Prevention**: Never disconnect except on logout

### Team Switching Failures
- **Cause**: Connection drops during screen transitions
- **Solution**: Persistent connection + proper event handling
- **Prevention**: Validate connection before team operations

## File Locations Quick Reference

**Main Configuration**:
- Server: `/server/src/server.ts`
- Frontend Entry: `/client/src/App.tsx`
- Game Logic: `/server/src/game/buraco-engine.ts`

**Key Services**:
- WebSocket: `/client/src/services/gameService.ts`
- Game Manager: `/server/src/game/game-manager.ts`
- Authentication: `/server/src/auth/auth.ts`

**UI Components**:
- Lobby: `/client/src/components/GameLobby.tsx`
- Waiting Room: `/client/src/components/WaitingRoom.tsx`
- Game Table: `/client/src/components/GameTable.tsx`
- Login: `/client/src/components/Auth.tsx`

**Types and Interfaces**:
- Frontend: `/client/src/types.ts`
- Backend: `/server/src/types.ts`
- Shared: `/shared/types.ts`

## Development Commands

**Backend**:
```bash
cd /path/to/canastra/server
npm run build    # Compile TypeScript
PORT=3002 npm start    # Start server
```

**Frontend**:
```bash
cd /path/to/canastra/client  
PORT=3004 npm start    # Start development server
```

**Testing**:
- Backend: Port 3002
- Frontend: Port 3004
- Both services must be running for full functionality

## Game Rules Implementation

### Wildcard Validation Rules (Issue #16)
**Implementation**: `/server/src/game/sequences.ts` + `/server/src/game/buraco-engine.ts`
**Rule**: Only one wildcard should be playable in an existing or new hand (sequence)

**Core Rules**:
1. **Maximum 1 wildcard per sequence** - Each sequence can contain at most one wildcard (Joker or wildcard 2)
2. **Special Exception**: When wildcard 2 is in its natural position (value 2 between A and 3), that sequence may contain 2 wildcards total
3. **Cross-sequence validation**: When playing multiple sequences simultaneously, wildcard limits are enforced across all sequences

**Technical Implementation**:
- `validateWildcardLimits()`: Validates individual sequence wildcard count
- `hasWildcard2InNaturalPosition()`: Detects the A-2(wild)-3 exception pattern
- `validateCrossSequenceWildcards()`: Enforces limits across multiple sequences in `handleBaixar()`
- `handleAddToSequence()`: Validates wildcard limits when adding cards to existing sequences

**Examples**:
- ✅ Valid: `A♥ - 2♥(wild) - 3♥` (1 wildcard)
- ✅ Valid: `A♥ - 2♥(wild) - 3♥ - Joker(wild) - 5♥` (2 wildcards, exception applies)
- ❌ Invalid: `4♥ - 2♥(wild) - 6♥ - Joker(wild) - 8♥` (2 wildcards, no exception)
- ❌ Invalid: Multiple sequences with total wildcards > sequences + exceptions

## Recent Bug Fixes

### Bug #1: Game Creation Loading Screen
- **Fixed**: Added immediate game state emission after creation
- **Impact**: Smooth game creation without refresh needed

### Bug #2: Team Switching Not Working
- **Fixed**: Moved WebSocket connection to App.tsx level
- **Impact**: Persistent connections, working team selection

### Feature #3: Wildcard Limit Enforcement (Issue #16)
- **Implemented**: Wildcard validation rules according to Brazilian Buraco regulations
- **Impact**: Prevents invalid sequences with excessive wildcards, enforces game authenticity

### Feature #4: Modern In-Game Chat Overlay System (Issue #15)
- **Implemented**: Non-intrusive glassmorphism chat overlay system
- **Key Features**:
  - **Overlay Design**: Translucent backdrop-blur chat that doesn't consume game space
  - **Auto-fade Messages**: 4-second auto-fade with max 3 overlay messages
  - **Mobile-First Responsive**: Touch-friendly design with 4+ breakpoints
  - **Performance Optimized**: Message history limited to 100 messages
  - **Accessibility Support**: Smooth animations with prefers-reduced-motion support
  - **Smooth UX**: Enter/exit animations, notification pulses, scroll management
- **Technical Implementation**:
  - **CSS**: 470+ lines of modern styling with glassmorphism effects
  - **React State**: Auto-fade logic with timeout management and cleanup
  - **Responsive Breakpoints**: 1024px (tablet), 768px (phone), 480px (small phone), landscape
  - **Translation Support**: Fixed duplicate translation keys causing display issues
- **Impact**: Chat no longer interferes with gameplay, provides modern mobile-friendly experience

---

*Last Updated: Session 7 - December 2024*
*Architecture documented after implementing modern chat overlay system (Issue #15)*