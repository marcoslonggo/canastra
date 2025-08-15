import sqlite3 from 'sqlite3';
import { db } from './db';
import { User } from '../types';

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  email?: string;
  created_at: string;
  last_login?: string;
  games_played: number;
  games_won: number;
}

export function createUser(username: string, passwordHash: string, email?: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, email)
      VALUES (?, ?, ?)
    `);
    
    stmt.run([username, passwordHash, email], function(this: sqlite3.RunResult, err: Error | null) {
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
    gamesPlayed: row.games_played,
    gamesWon: row.games_won
  };
}