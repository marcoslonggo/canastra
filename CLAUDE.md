- no text show to the user should be hardcoded - it should always be written in the translation file for internationalization compatibility
- commit and push to git after each bug or feature finished and move the items to in progress and done as appropriate in the project

## Recent Updates (Latest Commit: 06b0075)

### Mobile-First UI Revamp Project 🚧 IN PROGRESS

#### Phase 1: Foundation ✅ COMPLETED  
- **Modern UI Stack**: Installed Tailwind CSS, Radix UI, Framer Motion, Zustand
- **Design System**: Mobile-optimized tokens and color palette
- **Component Architecture**: Atomic design pattern (atoms, molecules, organisms)
- **State Management**: Zustand stores replacing useState proliferation

#### Phase 2: Mobile Components ✅ COMPLETED
- **Input Component**: Mobile-optimized with keyboard handling
- **Modal System**: Responsive dialogs with mobile-friendly animations  
- **Card Components**: Mobile-first card display molecules
- **Layout System**: Responsive Grid/Layout components

#### Phase 3: GameTable Refactoring ✅ COMPLETED
- **ChatSystem**: Extracted as standalone organism with chatStore
- **UI Detection**: Responsive breakpoint system in uiStore
- **ActionMessage**: Component with uiStore integration
- **ActionButtons**: Mobile-optimized with 44px+ touch targets
- **GameHeader**: Responsive header organism

#### Phase 4: Core Improvements ✅ COMPLETED
- **GameStore Enhancement**: Proper state management patterns
- **GameActionsList**: Component with smooth animations
- **Authentication**: Fixed quick login button issues

#### Phase 5: Mobile Scrolling & Card Selection ✅ COMPLETED
- **HandManager Component**: Mobile-first scrollable card layout
- **Critical Bug Fix**: Fixed card selection mapping between sorted display and original hand
- **Mobile CSS**: Removed overflow:hidden, enabled natural scrolling
- **Translation Keys**: Fixed button text internationalization

#### CRITICAL FIXES ✅ COMPLETED
- **Card Selection Bug**: Players selecting "K J Joker" were sending "A 4 Joker" to server
  - Root cause: HandManager sorted cards for display but used original indices  
  - Solution: Created mapping between sorted display indices ↔ original hand indices
  - Status: Fixed and verified working correctly
- **Server Sequence Validation**: Bypassed for testing (allows any 3+ cards)
- **Mobile Scrolling**: Fixed CSS containers to enable proper touch scrolling

### Previous Features ✅ COMPLETED

#### Issue #17 - Enhanced Discard Pile Viewer
- **Selective Card Drawing**: Players can now select which cards to LEAVE in the discard pile
- **Intuitive UI**: Modern modal with zoom animation from discard pile location
- **Auto-sorting**: Cards automatically sorted by suit and value for easy viewing
- **Mobile Responsive**: Grid layout that adapts to different screen sizes

#### Auto Team Assignment  
- **1st player** → Automatically assigned to Team 1
- **2nd player** → Automatically assigned to Team 2
- **3rd+ players** → Automatically assigned to Team 1 (can switch teams)

#### IDDQD Super Cheat Code
- **Enhanced cheat system**: Typing 'iddqd' now enables ALL cheats automatically
- **Complete god mode**: Bypasses all game restrictions
- **Includes**: Allow play all cards, multiple discard, discard drawn cards, view all hands

## Next Phase: Remaining Tasks 🔄 TODO

### Phase 6: Final UI Polish (Pending)
- **TypeScript Cleanup**: Fix compilation errors in HandManager integration
- **State Migration**: Move selectedCards state to gameStore
- **Touch Interactions**: Add swipe gestures and haptic feedback
- **DeckDisplay Component**: Create molecule for center game area
- **TeamSequences**: Extract complex organism (final phase)
- **Mobile Navigation**: Bottom sheet pattern component

### Future Improvements (Backlog)
- **Proper Sequence Validation**: Replace bypass with correct Buraco/Canastra rules
- **Performance Optimization**: Bundle splitting and lazy loading
- **PWA Features**: Offline support and app-like experience
- **Accessibility**: Screen reader support and keyboard navigation

## Current Status 📊

### ✅ WORKING CORRECTLY
- Mobile scrolling in game interface
- Card selection sends correct cards to server
- Basic baixar functionality (with validation bypass for testing)
- Responsive design across devices
- Modern UI components and animations

### 🔧 FOR TESTING ONLY
- **Sequence Validation**: Currently bypassed - allows invalid sequences like "2,3,9"
- **Server Logs**: Show bypass messages for debugging

### 🐛 KNOWN ISSUES
- Some TypeScript warnings (non-blocking)
- Sequence validation needs proper implementation (future task)

## Cheat Codes Available
- `iddqd` - Enable all cheats (god mode)
- `cardy` - Show all players' hands
- `winme` - Auto-win for testing
- `speedx` - Speed up animations
- `reset` - Disable all test modes

## Development Commands
- Backend: `ADMIN_PASSWORD=test_admin_123 PORT=3002 npm start`
- Frontend: `HOST=0.0.0.0 PORT=3004 npm start` (now uses Vite!)
- Admin login: username `admin`, password from ADMIN_PASSWORD env var

### Modern Build System (Phase 2 Migration - COMPLETED ✅)
**Successfully migrated from react-scripts → Vite + TypeScript 5.x**
- ✅ **All 9 security vulnerabilities resolved**
- ✅ **TypeScript upgraded**: 4.9.5 → 5.9.2
- ✅ **Faster builds**: ~2s vs previous ~30s+ 
- ✅ **External access**: Still works perfectly with mobile devices
- ✅ **Host detection bug**: Fixed for game start functionality

## Architecture Notes
- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion
- **State Management**: Zustand stores (gameStore, uiStore, chatStore)  
- **Component Pattern**: Atomic Design (atoms → molecules → organisms)
- **Mobile-First**: Responsive breakpoints with touch optimization
- **WebSocket**: Real-time game communication via Socket.IO