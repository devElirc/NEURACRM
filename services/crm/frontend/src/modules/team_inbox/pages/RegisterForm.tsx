import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Building, ArrowRight } from 'lucide-react';

interface RegisterFormProps {
  onRegister: (data: RegisterData) => void;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  companyEmail: string;
  company: string;
  password: string;
}

export function RegisterForm({ onRegister, onSwitchToLogin, isLoading = false }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    companyEmail: '',
    company: '',
    password: '',
    confirmPassword: '',
  });



  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    if (!formData.email) {
      newErrors.email = 'Personal email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.companyEmail) {
      newErrors.companyEmail = 'Company email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'Please enter a valid company email address';
    }

    if (!formData.company.trim()) newErrors.company = 'Company name is required';

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onRegister({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      companyEmail: formData.companyEmail,
      company: formData.company,
      password: formData.password,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 2) return { strength: 1, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength: 3, label: 'Good', color: 'bg-blue-500' };
    return { strength: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
            First name
          </label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={`block w-full px-4 py-3 border-2 rounded-xl ${
              errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            }`}
            placeholder="John"
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={`block w-full px-4 py-3 border-2 rounded-xl ${
              errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            }`}
            placeholder="Doe"
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
          Personal email
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`block w-full px-4 py-3 border-2 rounded-xl ${
              errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            }`}
            placeholder="john@example.com"
          />
          <User className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="companyEmail" className="block text-sm font-semibold text-gray-700 mb-2">
          Company email
        </label>
        <div className="relative">
          <input
            id="companyEmail"
            type="email"
            value={formData.companyEmail}
            onChange={(e) => handleInputChange('companyEmail', e.target.value)}
            className={`block w-full px-4 py-3 border-2 rounded-xl ${
              errors.companyEmail ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            }`}
            placeholder="you@company.com"
          />
          <Mail className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.companyEmail && <p className="mt-2 text-sm text-red-600">{errors.companyEmail}</p>}
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-2">
          Company name
        </label>
        <div className="relative">
          <input
            id="company"
            type="text"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            className={`block w-full px-4 py-3 border-2 rounded-xl ${
              errors.company ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            }`}
            placeholder="Acme Inc."
          />
          <Building className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
        </div>
        {errors.company && <p className="mt-2 text-sm text-red-600">{errors.company}</p>}
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
            className={`block w-full px-4 py-3 border-2 rounded-xl ${
              errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5"
          >
            {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
          </button>
        </div>
        {formData.password && (
          <div className="mt-2">
            <div className="flex items-center space-x-2 mb-1">
              <div className="flex-1 bg-gray-200 rounded-full h-1">
                <div className={`h-1 rounded-full ${passwordStrength.color}`} style={{ width: `${(passwordStrength.strength / 4) * 100}%` }} />
              </div>
              <span className={`text-xs font-medium ${passwordStrength.color.replace('bg', 'text')}`}>
                {passwordStrength.label}
              </span>
            </div>
          </div>
        )}
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
          Confirm password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={`block w-full px-4 py-3 border-2 rounded-xl ${
              errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3.5"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center px-4 py-3 text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>
          Create your team inbox
          <ArrowRight className="ml-2 h-4 w-4" />
        </>}
      </button>

      <div className="text-center pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          Sign in
        </button>
      </div>
    </form>
  );
}
