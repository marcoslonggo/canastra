- no text show to the user should be hardcoded - it should always be written in the translation file for internationalization compatibility
- commit and push to git after each bug or feature finished and move the items to in progress and done as appropriate in the project

## Recent Updates (Latest Commit: 11ff8be)

### Issue #17 - Enhanced Discard Pile Viewer ✅ COMPLETED
- **Selective Card Drawing**: Players can now select which cards to LEAVE in the discard pile
- **Intuitive UI**: Modern modal with zoom animation from discard pile location
- **Auto-sorting**: Cards automatically sorted by suit and value for easy viewing
- **Mobile Responsive**: Grid layout that adapts to different screen sizes
- **Visual Indicators**: Clear position numbers and selection feedback

### Auto Team Assignment ✅ COMPLETED
- **1st player** → Automatically assigned to Team 1
- **2nd player** → Automatically assigned to Team 2
- **3rd+ players** → Automatically assigned to Team 1 (can switch teams)
- **Benefits**: No manual setup needed for 2-player games

### IDDQD Super Cheat Code ✅ COMPLETED
- **Enhanced cheat system**: Typing 'iddqd' now enables ALL cheats automatically
- **Complete god mode**: Bypasses all game restrictions
- **Includes**: Allow play all cards, multiple discard, discard drawn cards, view all hands

### Technical Improvements ✅ COMPLETED
- **Fixed connection spam**: Removed excessive reconnection messages flooding server logs
- **Proper card ID handling**: Ensures accurate discard pile selection
- **Clean server logs**: Enhanced debugging without production noise

## Cheat Codes Available
- `iddqd` - Enable all cheats (god mode)
- `cardy` - Show all players' hands
- `winme` - Auto-win for testing
- `speedx` - Speed up animations
- `reset` - Disable all test modes

## Development Commands
- Backend: `ADMIN_PASSWORD=test_admin_123 PORT=3002 npm start`
- Frontend: `PORT=3004 npm start`
- Admin login: username `admin`, password from ADMIN_PASSWORD env var