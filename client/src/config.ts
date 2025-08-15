interface Config {
  api: {
    baseUrl: string;
  };
  websocket: {
    url: string;
  };
  app: {
    port: number;
  };
}

const config: Config = {
  api: {
    baseUrl: process.env.REACT_APP_API_BASE || 'http://localhost:3002',
  },
  websocket: {
    url: process.env.REACT_APP_WS_URL || process.env.REACT_APP_SERVER_URL || 'http://localhost:3002',
  },
  app: {
    port: parseInt(process.env.PORT || '3004', 10),
  },
};

// Validate configuration
if (!config.api.baseUrl) {
  throw new Error('REACT_APP_API_BASE environment variable is required');
}

if (!config.websocket.url) {
  throw new Error('REACT_APP_WS_URL or REACT_APP_SERVER_URL environment variable is required');
}

export default config;