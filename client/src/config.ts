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

function getWebSocketUrl(): string {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL;
  }
  if (process.env.REACT_APP_SERVER_URL) {
    return process.env.REACT_APP_SERVER_URL;
  }
  
  // Dynamic URL based on current location
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3002`;
}

const config: Config = {
  api: {
    baseUrl: '',  // Force empty for proxy - no environment variable override
  },
  websocket: {
    url: getWebSocketUrl(),
  },
  app: {
    port: parseInt(process.env.PORT || '3004', 10),
  },
};

// Validate configuration - allow empty baseUrl for proxy setup
if (!config.websocket.url) {
  throw new Error('REACT_APP_WS_URL or REACT_APP_SERVER_URL environment variable is required');
}

export default config;