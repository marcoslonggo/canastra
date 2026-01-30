import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface Config {
  server: {
    port: number;
    nodeEnv: string;
  };
  database: {
    path: string;
  };
  cors: {
    allowedOrigins: string[];
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  admin: {
    password?: string;
  };
  logging: {
    level: string;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3002', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    path: process.env.DB_PATH || './database.db',
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : ['http://localhost:3004', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'],
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  admin: {
    password: process.env.ADMIN_PASSWORD,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate critical configuration
if (!config.jwt.secret || config.jwt.secret === 'your-secret-key-change-in-production') {
  if (config.server.nodeEnv === 'production') {
    throw new Error('JWT_SECRET environment variable must be set in production');
  } else {
    console.warn('⚠️  Using default JWT_SECRET in development mode. Set JWT_SECRET in production!');
  }
}

if (config.server.port < 1 || config.server.port > 65535) {
  throw new Error(`Invalid PORT: ${config.server.port}. Must be between 1 and 65535.`);
}

export default config;