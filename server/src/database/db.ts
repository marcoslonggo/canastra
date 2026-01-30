import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
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
  
  // Seed default test users
  seedDefaultUsers();
}

async function seedDefaultUsers() {
  // Check if seeding is enabled via environment variable
  const seedUsers = process.env.SEED_DEFAULT_USERS === 'true';
  
  if (!seedUsers) {
    console.log('ℹ️  Default user seeding is disabled. Set SEED_DEFAULT_USERS=true to enable.');
    return;
  }

  const defaultUsers = [
    { username: 'testuser1', password: 'test123' },
    { username: 'testuser2', password: 'test456' }
  ];

  for (const user of defaultUsers) {
    try {
      const existingUser = await new Promise<any>((resolve, reject) => {
        db.get('SELECT id FROM users WHERE username = ?', [user.username], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!existingUser) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        await new Promise<void>((resolve, reject) => {
          const stmt = db.prepare(`
            INSERT INTO users (username, password_hash, email, is_admin)
            VALUES (?, ?, ?, ?)
          `);
          
          stmt.run([user.username, passwordHash, null, 0], function(this: sqlite3.RunResult, err: Error | null) {
            if (err) {
              reject(err);
            } else {
              console.log(`✅ Created default user: ${user.username}`);
              resolve();
            }
          });
        });
      }
    } catch (err) {
      console.error(`❌ Error creating user ${user.username}:`, err);
    }
  }
}

export default db;