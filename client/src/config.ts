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
  // ALWAYS use dynamic calculation to match the current page's hostname
  // This ensures external WebSocket connections work correctly
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:3002`;
}

function getApiBaseUrl(): string {
  // ALWAYS use dynamic calculation to match the current page's hostname
  // This ensures external access works correctly
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = window.location.hostname;
  
  // Use the same hostname as the current page (external IP if accessed externally)
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