import { AuthResponse, LoginRequest, RegisterRequest } from './types';
import config from './config';

const API_BASE = config.api.baseUrl;

export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  return response.json();
}

export async function registerUser(userData: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  return response.json();
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