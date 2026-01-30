import sqlite3 from 'sqlite3';
import { db } from './db';
import { User } from '../types';

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  email?: string;
  is_admin: number; // SQLite stores BOOLEAN as INTEGER (0/1)
  created_at: string;
  last_login?: string;
  games_played: number;
  games_won: number;
}

export function createUser(username: string, passwordHash: string, email?: string, isAdmin: boolean = false): Promise<number> {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, email, is_admin)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run([username, passwordHash, email, isAdmin ? 1 : 0], function(this: sqlite3.RunResult, err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID as number);
      }
    });
    
    stmt.finalize();
  });
}

export function getUserByUsername(username: string): Promise<UserRow | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (err: Error | null, row: UserRow) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      }
    );
  });
}

export function getUserById(id: number): Promise<UserRow | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [id],
      (err: Error | null, row: UserRow) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      }
    );
  });
}

export function updateUserLastLogin(id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [id],
      (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

export function updateUserGameStats(userId: number, won: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const query = won 
      ? 'UPDATE users SET games_played = games_played + 1, games_won = games_won + 1 WHERE id = ?'
      : 'UPDATE users SET games_played = games_played + 1 WHERE id = ?';
    
    db.run(query, [userId], (err: Error | null) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function userRowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    isAdmin: row.is_admin === 1,
    gamesPlayed: row.games_played,
    gamesWon: row.games_won
  };
}

export function createOrUpdateAdminUser(username: string, passwordHash: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Try to find existing admin user
    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (err: Error | null, row: UserRow) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          // Update existing admin user password and ensure admin flag is set
          db.run(
            'UPDATE users SET password_hash = ?, is_admin = 1 WHERE id = ?',
            [passwordHash, row.id],
            (updateErr: Error | null) => {
              if (updateErr) {
                reject(updateErr);
              } else {
                console.log(`✅ Admin user '${username}' password updated`);
                resolve();
              }
            }
          );
        } else {
          // Create new admin user
          const stmt = db.prepare(`
            INSERT INTO users (username, password_hash, email, is_admin)
            VALUES (?, ?, ?, 1)
          `);
          
          stmt.run([username, passwordHash, null], function(this: sqlite3.RunResult, createErr: Error | null) {
            if (createErr) {
              reject(createErr);
            } else {
              console.log(`✅ Admin user '${username}' created`);
              resolve();
            }
          });
          
          stmt.finalize();
        }
      }
    );
  });
}

export function updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET is_admin = ? WHERE id = ?',
      [isAdmin ? 1 : 0, userId],
      (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

export function getAllUsers(): Promise<UserRow[]> {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM users ORDER BY created_at DESC',
      [],
      (err: Error | null, rows: UserRow[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
}

export function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId],
      (err: Error | null) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}