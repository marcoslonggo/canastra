import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { createUser, getUserByUsername, updateUserLastLogin, userRowToUser } from '../database/users';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';
import config from '../config';
const SALT_ROUNDS = 10;

export interface AuthRequest extends Request {
  userId?: number;
  user?: any;
}

export async function register(req: Request<{}, AuthResponse, RegisterRequest>, res: Response<AuthResponse>) {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await createUser(username, passwordHash, email);

    // Generate JWT token
    const token = jwt.sign({ userId }, config.jwt.secret, { expiresIn: '24h' });

    const user = {
      id: userId,
      username,
      email,
      gamesPlayed: 0,
      gamesWon: 0
    };

    res.status(201).json({
      success: true,
      token,
      user,
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

export async function login(req: Request<{}, AuthResponse, LoginRequest>, res: Response<AuthResponse>) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Get user from database
    const userRow = await getUserByUsername(username);
    if (!userRow) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userRow.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Update last login
    await updateUserLastLogin(userRow.id);

    // Generate JWT token
    const token = jwt.sign({ userId: userRow.id }, config.jwt.secret, { expiresIn: '24h' });

    const user = userRowToUser(userRow);

    res.json({
      success: true,
      token,
      user,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, config.jwt.secret, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.userId = decoded.userId;
    next();
  });
}