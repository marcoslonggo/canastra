import sqlite3 from 'sqlite3';
import path from 'path';
import config from '../config';

const dbPath = path.isAbsolute(config.database.path) 
  ? config.database.path 
  : path.join(__dirname, '../../', config.database.path);

export const db = new sqlite3.Database(dbPath, (err: Error | null) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeTables();
  }
});

function initializeTables() {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT UNIQUE,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      games_played INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0
    )
  `);

  // Add is_admin column if it doesn't exist (for existing databases)
  db.run(`
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0
  `, (err) => {
    // Ignore error if column already exists
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding is_admin column:', err.message);
    }
  });

  // Create games table
  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_count INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      winner_team INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  // Create game_results table
  db.run(`
    CREATE TABLE IF NOT EXISTS game_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER REFERENCES games(id),
      user_id INTEGER REFERENCES users(id),
      team INTEGER NOT NULL,
      won BOOLEAN NOT NULL,
      final_score INTEGER
    )
  `);

  console.log('Database tables initialized');
}

export default db;