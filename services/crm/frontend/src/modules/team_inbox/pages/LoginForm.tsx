import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
  isLoading?: boolean;
}

export function LoginForm({ onLogin, onSwitchToRegister, isLoading = false }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: 'devElirc@gmail.com',
    password: 'SecurePass123!',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onLogin(formData.email, formData.password);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
          Email address
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`block w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${
              errors.email 
                ? 'border-red-300 bg-red-50 focus:border-red-500' 
                : 'border-gray-200 focus:border-blue-500 bg-white'
            }`}
            placeholder="Enter your email"
            autoComplete="email"
          />
          <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`block w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-0 transition-colors ${
              errors.password 
                ? 'border-red-300 bg-red-50 focus:border-red-500' 
                : 'border-gray-200 focus:border-blue-500 bg-white'
            }`}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
            Keep me signed in
          </label>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Sign in to TeamInbox
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </button>

      <div className="text-center pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600">New to TeamInbox? </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Create an account
        </button>
      </div>
    </form>
  );
}
