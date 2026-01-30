# Canastra Game - Feature Roadmap & Bug Tracker

This document contains all pending features and improvements for the Canastra game that should be moved to GitHub Issues.

## 🚀 Features to Implement

### 1. Add reconnect button when backend dies or player disconnects
**Priority:** High
**Description:** Currently when the backend server goes down or a player loses connection, there's no easy way to reconnect without refreshing the page.
**Acceptance Criteria:**
- [ ] Detect when WebSocket connection is lost
- [ ] Show reconnect button in UI when disconnected  
- [ ] Implement reconnect functionality
- [ ] Restore user state after successful reconnection

### 2. Make chat visible inside the game (not just lobby)
**Priority:** Medium
**Description:** Players should be able to chat during gameplay, not only in the lobby.
**Acceptance Criteria:**
- [ ] Add chat component to GameTable
- [ ] Implement game-specific chat channels
- [ ] Ensure chat doesn't interfere with game UI
- [ ] Add toggle to show/hide chat during game

### 3. Allow game owner to end game with options
**Priority:** Medium  
**Description:** Game creators should be able to end games early with different options.
**Acceptance Criteria:**
- [ ] Add "End Game" button for game owner
- [ ] Provide options: "No prejudice" vs "Declare winner"
- [ ] Implement server-side game termination logic
- [ ] Update game state and notify all players

### 4. Implement player session management
**Priority:** High
**Description:** When a player logs in from a new device/browser, kick the previous connection.
**Acceptance Criteria:**
- [ ] Track active sessions per user
- [ ] Disconnect previous sessions when new login occurs
- [ ] Notify user about session changes
- [ ] Handle graceful session transitions

### 5. Add Easy mode with card combination hints/highlights
**Priority:** Low
**Description:** Help new players learn the game by showing valid card combinations.
**Acceptance Criteria:**
- [ ] Add difficulty setting to game creation
- [ ] Highlight valid sequences in player's hand
- [ ] Show hint tooltips for valid moves
- [ ] Add toggle for experienced players

### 6. Implement chat channels (Lobby and per-game)
**Priority:** Medium
**Description:** Separate chat channels for lobby and individual games.
**Acceptance Criteria:**
- [ ] Create lobby-wide chat channel
- [ ] Create game-specific chat channels
- [ ] Switch chat context based on player location
- [ ] Message history persistence per channel

### 7. Add spectator mode for games
**Priority:** Low
**Description:** Allow users to watch ongoing games without participating.
**Acceptance Criteria:**
- [ ] Add "Spectate" option to available games
- [ ] Implement read-only game view for spectators
- [ ] Limit spectator chat permissions
- [ ] Show spectator count in game lobby

### 8. Improve mobile responsiveness
**Priority:** Medium
**Description:** Optimize the game interface for mobile devices.
**Acceptance Criteria:**
- [ ] Test game on various mobile screen sizes
- [ ] Optimize card layout for touch interfaces
- [ ] Improve touch gesture support for card actions
- [ ] Ensure admin panel works on mobile

### 9. Implement localization system
**Priority:** Low
**Description:** Add multi-language support for international players.
**Acceptance Criteria:**
- [ ] Set up i18n framework (react-i18next)
- [ ] Extract all user-facing text to translation files
- [ ] Implement language switcher in UI
- [ ] Add Portuguese and English translations

## 🐛 Bugs to Fix

### 1. Fix quick flicker of login screen when refreshing
**Priority:** Low
**Description:** When refreshing the page while logged in, there's a brief flash of the login screen before redirecting to the lobby.
**Acceptance Criteria:**
- [ ] Implement proper loading state management
- [ ] Show loading spinner instead of login form
- [ ] Optimize token validation timing
- [ ] Improve user experience during app initialization

## ✅ Recently Completed
- [x] Create git checkpoint of current working Canastra game
- [x] Push code to GitHub repository  
- [x] Add ADMIN_PASSWORD environment variable and admin user creation
- [x] Test admin system by rebuilding and restarting server
- [x] Create admin panel UI in lobby
- [x] Fix localStorage token key mismatch in admin panel
- [x] Fix chat duplicated messages issue

---

## How to Use This Roadmap

1. **Create GitHub Issues**: Each feature/bug should become a separate GitHub issue
2. **Add Labels**: Use labels like `enhancement`, `bug`, `high-priority`, `low-priority`
3. **Link to Project**: Create a GitHub Project board to track progress
4. **Assign Milestones**: Group related features into release milestones
5. **Add Details**: Each issue should have detailed acceptance criteria and technical notes

## Contributing

When working on any of these items:
1. Create a new branch from `main`
2. Reference the GitHub issue in your commits
3. Test thoroughly before creating a PR
4. Update documentation as needed
5. Request code review before merging