import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyEmail: string;
  company: string;
  tenantId: string;
  role: 'admin' | 'agent' | 'viewer';
  avatar?: string;
  isActive: boolean;
  timezone: string;
  createdAt: Date;
}

interface Tenant {
  id: string;
  name: string;
  domain: string;
  plan: 'free' | 'pro' | 'enterprise';
  ownerId: string;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  companyEmail: string;
  company: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tenant: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const navigate = useNavigate();
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const storedUser = localStorage.getItem('teamInbox_user');
      const storedTenant = localStorage.getItem('teamInbox_tenant');
      const storedToken = localStorage.getItem('teamInbox_token');

      if (storedUser && storedTenant && storedToken) {
        setAuthState({
          user: JSON.parse(storedUser),
          tenant: JSON.parse(storedTenant),
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        clearAuthData();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      clearAuthData();
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('teamInbox_user');
    localStorage.removeItem('teamInbox_tenant');
    localStorage.removeItem('teamInbox_token');


    setAuthState({
      user: null,
      tenant: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      // setAuthState(prev => ({ ...prev, isLoading: true }));

      if (!validateEmail(email)) return { success: false, error: 'Invalid email' };
      if (password.length < 6) return { success: false, error: 'Password too short' };

      const response = await fetch("http://localhost:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setAuthState({
          user: null,
          tenant: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return { success: false, error: result.error || 'Login failed' };
      }

      // Save user, tenant, and token
      if (result.user) localStorage.setItem('teamInbox_user', JSON.stringify(result.user));
      if (result.tenant) localStorage.setItem('teamInbox_tenant', JSON.stringify(result.tenant));
      if (result.token) localStorage.setItem('teamInbox_token', result.token);

      console.log("this is the result", authState)
      setAuthState({
        user: result.user || null,
        tenant: result.tenant || null,
        isAuthenticated: true,
        isLoading: false,
      });
      // navigate('/inbox');

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login error. Try again later.' };
    }
  };

  const register = async (data: RegisterData): Promise<AuthResult> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const requiredFields = ['firstName', 'lastName', 'email', 'companyEmail', 'company', 'password'];
      for (const field of requiredFields) {
        if (!data[field as keyof RegisterData]?.trim()) {
          return { success: false, error: `${field} is required` };
        }
      }

      if (!validateEmail(data.email)) return { success: false, error: 'Invalid personal email' };
      if (!validateEmail(data.companyEmail)) return { success: false, error: 'Invalid company email' };
      if (data.password.length < 8) return { success: false, error: 'Password must be at least 8 characters' };

      const response = await fetch("http://localhost:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Registration failed' };
      }

      if (result.user) localStorage.setItem('teamInbox_user', JSON.stringify(result.user));
      if (result.tenant) localStorage.setItem('teamInbox_tenant', JSON.stringify(result.tenant));
      if (result.token) localStorage.setItem('teamInbox_token', result.token);

      setAuthState({
        user: result.user || null,
        tenant: result.tenant || null,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Server error. Try again later.' };
    }
  };

  const logout = () => {
    clearAuthData();
    // navigate('/auth');

  };

  return {
    ...authState,
    login,
    register,
    logout,
  };
}
