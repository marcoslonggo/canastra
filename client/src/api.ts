import { AuthResponse, LoginRequest, RegisterRequest } from './types';
import config from './config';

const API_BASE = config.api.baseUrl;

export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  const url = `${API_BASE}/auth/login`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return {
        success: false,
        message: `Network error: ${response.status} ${response.statusText}`,
        user: undefined,
        token: undefined
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login network failure:', error);
    
    // Check if it's a CORS or network connectivity issue
    let errorMessage = 'Unknown network error';
    if (error instanceof Error) {
      if (error.message.includes('Load failed') || error.message.includes('fetch')) {
        errorMessage = `Network connectivity issue: ${error.message}. Check if server is accessible from your network.`;
      } else if (error.message.includes('CORS')) {
        errorMessage = `CORS policy blocked the request: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      message: `Connection failed: ${errorMessage}`,
      user: undefined,
      token: undefined
    };
  }
}

export async function registerUser(userData: RegisterRequest): Promise<AuthResponse> {
  const url = `${API_BASE}/auth/register`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      console.error(`Registration Error: ${response.status} ${response.statusText}`);
      return {
        success: false,
        message: `Network error: ${response.status} ${response.statusText}`,
        user: undefined,
        token: undefined
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Registration network failure:', error);
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown network error'}`,
      user: undefined,
      token: undefined
    };
  }
}

export async function fetchProfile(token: string) {
  const response = await fetch(`${API_BASE}/api/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}

// Admin API functions
export async function fetchAllUsers(token: string) {
  const response = await fetch(`${API_BASE}/api/admin/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
}

export async function promoteUser(token: string, userId: number) {
  const response = await fetch(`${API_BASE}/api/admin/users/${userId}/promote`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to promote user');
  }

  return response.json();
}

export async function demoteUser(token: string, userId: number) {
  const response = await fetch(`${API_BASE}/api/admin/users/${userId}/demote`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to demote user');
  }

  return response.json();
}

export async function resetUserPassword(token: string, userId: number, newPassword: string) {
  const response = await fetch(`${API_BASE}/api/admin/users/${userId}/reset-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ newPassword }),
  });

  if (!response.ok) {
    throw new Error('Failed to reset password');
  }

  return response.json();
}

// Admin game management API functions
export async function fetchAllGames(token: string) {
  const response = await fetch(`${API_BASE}/api/admin/games`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch games');
  }

  return response.json();
}

export async function terminateGame(token: string, gameId: string) {
  const response = await fetch(`${API_BASE}/api/admin/games/${gameId}/terminate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to terminate game');
  }

  return response.json();
}

export async function restartServer(token: string) {
  const response = await fetch(`${API_BASE}/api/admin/server/restart`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to restart server');
  }

  return response.json();
}