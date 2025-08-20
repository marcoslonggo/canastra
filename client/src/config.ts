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

function getApiBaseUrl(): string {
  if (process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }
  if (process.env.REACT_APP_SERVER_URL) {
    return process.env.REACT_APP_SERVER_URL;
  }
  
  // Dynamic URL based on current location for cross-device testing
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3002`;
}

// Dynamic config that recalculates URLs on each access
const config: Config = {
  get api() {
    return {
      baseUrl: getApiBaseUrl(),
    };
  },
  get websocket() {
    return {
      url: getWebSocketUrl(),
    };
  },
  app: {
    port: parseInt(process.env.PORT || '3004', 10),
  },
};

// Validate configuration
if (!config.websocket.url) {
  throw new Error('WebSocket URL configuration is required');
}

if (!config.api.baseUrl) {
  throw new Error('API base URL configuration is required');
}

export default config;