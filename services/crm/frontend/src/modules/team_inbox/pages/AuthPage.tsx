import React, { useState, useEffect, useRef } from 'react';
import { AuthLayout } from './AuthLayout';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const prevAuthRef = useRef<boolean | null>(null);

  useEffect(() => {
    const prevAuth = prevAuthRef.current;

    if (prevAuth !== isAuthenticated && isAuthenticated === true && isLoading === false) {
      navigate("/inbox")
    }

    // Update ref with latest value
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, isLoading]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      else {
        console.log("success")
        navigate('/inbox');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleRegister = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    companyEmail: string;
    company: string;
    password: string;
  }) => {
    setIsLoading(true);
    setError('');

    try {
      const result = await register(data); 
      if (!result.success) {
        setError(result.error || 'Registration failed');
      }
      else {
        // navigate('/inbox'); 
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const switchToLogin = () => {
    setIsLogin(true);
    setError('');
  };

  const switchToRegister = () => {
    setIsLogin(false);
    setError('');
  };

  return (
    <AuthLayout
      title={isLogin ? 'Welcome back' : 'Create your account'}
      subtitle={
        isLogin
          ? 'Sign in to access your team inbox'
          : 'Join thousands of teams already using TeamInbox'
      }
      isLogin={isLogin}
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {isLogin ? (
        <LoginForm
          onLogin={handleLogin}
          onSwitchToRegister={switchToRegister}
          isLoading={isLoading}
        />
      ) : (
        <RegisterForm
          onRegister={handleRegister}
          onSwitchToLogin={switchToLogin}
          isLoading={isLoading}
        />
      )}
    </AuthLayout>
  );
}