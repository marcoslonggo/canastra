/**
 * Session Manager
 * Handles user session tracking and prevents multiple simultaneous sessions
 */

import { Socket } from 'socket.io';

export interface UserSession {
  userId: string;
  username: string;
  socketId: string;
  socket: Socket;
  connectedAt: Date;
  lastActivity: Date;
  gameId?: string;
}

export interface SessionConflictResult {
  hasConflict: boolean;
  previousSession?: UserSession;
  action: 'allow' | 'disconnect_previous' | 'deny_new';
  message?: string;
}

export class SessionManager {
  private sessions: Map<string, UserSession> = new Map(); // userId -> session
  private socketToUser: Map<string, string> = new Map(); // socketId -> userId

  /**
   * Register a new user session
   */
  authenticateUser(userId: string, username: string, socket: Socket): SessionConflictResult {
    const existingSession = this.sessions.get(userId);
    
    if (existingSession) {
      // Handle session conflict
      return this.handleSessionConflict(userId, username, socket, existingSession);
    }

    // No conflict, create new session
    const session: UserSession = {
      userId,
      username,
      socketId: socket.id,
      socket,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.sessions.set(userId, session);
    this.socketToUser.set(socket.id, userId);

    console.log(`🔐 New session created for user: ${username} (${socket.id})`);
    
    return {
      hasConflict: false,
      action: 'allow'
    };
  }

  /**
   * Handle session conflict when user already has an active session
   */
  private handleSessionConflict(
    userId: string, 
    username: string, 
    newSocket: Socket, 
    existingSession: UserSession
  ): SessionConflictResult {
    console.log(`⚠️ Session conflict for user: ${username}`);
    console.log(`   Existing: ${existingSession.socketId} (connected: ${existingSession.connectedAt})`);
    console.log(`   New: ${newSocket.id}`);

    // Check if existing socket is still connected
    if (!existingSession.socket.connected) {
      console.log(`🧹 Cleaning up disconnected session for ${username}`);
      this.removeSession(existingSession.userId);
      return this.authenticateUser(userId, username, newSocket);
    }

    // Disconnect the previous session
    this.disconnectPreviousSession(existingSession, 'New login detected from another device/browser');

    // Create new session
    const newSession: UserSession = {
      userId,
      username,
      socketId: newSocket.id,
      socket: newSocket,
      connectedAt: new Date(),
      lastActivity: new Date(),
      gameId: existingSession.gameId // Preserve game state
    };

    this.sessions.set(userId, newSession);
    this.socketToUser.set(newSocket.id, userId);

    return {
      hasConflict: true,
      previousSession: existingSession,
      action: 'disconnect_previous',
      message: `Previous session disconnected. Logged in from new device/browser.`
    };
  }

  /**
   * Disconnect a previous session gracefully
   */
  private disconnectPreviousSession(session: UserSession, reason: string) {
    console.log(`🚪 Disconnecting previous session for ${session.username}: ${reason}`);
    
    // Notify the user about the disconnection
    session.socket.emit('session-terminated', {
      reason,
      timestamp: new Date(),
      message: 'You have been logged out because you logged in from another device/browser.'
    });

    // Give a moment for the message to be sent, then disconnect
    setTimeout(() => {
      if (session.socket.connected) {
        session.socket.disconnect(true);
      }
    }, 1000);

    // Clean up session tracking
    this.socketToUser.delete(session.socketId);
  }

  /**
   * Remove session when user disconnects
   */
  removeSession(userId: string) {
    const session = this.sessions.get(userId);
    if (session) {
      console.log(`🔓 Removing session for user: ${session.username}`);
      this.sessions.delete(userId);
      this.socketToUser.delete(session.socketId);
    }
  }

  /**
   * Remove session by socket ID (for disconnect events)
   */
  removeSessionBySocket(socketId: string) {
    const userId = this.socketToUser.get(socketId);
    if (userId) {
      this.removeSession(userId);
    }
  }

  /**
   * Update session activity
   */
  updateActivity(userId: string) {
    const session = this.sessions.get(userId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  /**
   * Set game ID for a user session
   */
  setUserGame(userId: string, gameId: string | undefined) {
    const session = this.sessions.get(userId);
    if (session) {
      session.gameId = gameId;
    }
  }

  /**
   * Get session by user ID
   */
  getSession(userId: string): UserSession | undefined {
    return this.sessions.get(userId);
  }

  /**
   * Get session by socket ID
   */
  getSessionBySocket(socketId: string): UserSession | undefined {
    const userId = this.socketToUser.get(socketId);
    return userId ? this.sessions.get(userId) : undefined;
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clean up stale sessions (optional maintenance)
   */
  cleanupStaleSessions(maxIdleTime: number = 30 * 60 * 1000) { // 30 minutes default
    const now = new Date();
    const staleUserIds: string[] = [];

    for (const [userId, session] of this.sessions.entries()) {
      const idleTime = now.getTime() - session.lastActivity.getTime();
      
      if (idleTime > maxIdleTime || !session.socket.connected) {
        staleUserIds.push(userId);
      }
    }

    staleUserIds.forEach(userId => {
      console.log(`🧹 Cleaning up stale session for user: ${userId}`);
      this.removeSession(userId);
    });

    if (staleUserIds.length > 0) {
      console.log(`🧹 Cleaned up ${staleUserIds.length} stale sessions`);
    }
  }

  /**
   * Get session statistics
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(s => s.socket.connected).length,
      usersInGames: Array.from(this.sessions.values()).filter(s => s.gameId).length
    };
  }
}

export const sessionManager = new SessionManager();