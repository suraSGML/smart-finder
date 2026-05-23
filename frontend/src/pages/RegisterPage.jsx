/**
 * Registration page with role selection (Customer or Shop Owner).
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, EyeOff, Loader, AlertCircle, User, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showError, showSuccess } from '../components/Toast';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'CUSTOMER',
    password: '',
    password_confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: null, general: null }));
  };

  const handleRoleSelect = (role) => {
    setForm((f) => ({ ...f, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors = {};
    if (!form.username) newErrors.username = 'Username is required.';
    if (!form.email) newErrors.email = 'Email is required.';
    if (!form.first_name) newErrors.first_name = 'First name is required.';
    if (!form.last_name) newErrors.last_name = 'Last name is required.';
    if (!form.password) newErrors.password = 'Password is required.';
    if (form.password !== form.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showError('Please fill in all required fields correctly.');
      return;
    }

    setLoading(true);
    const result = await register(form);
    setLoading(false);

    if (result.success) {
      showSuccess('Account created successfully!');
      const role = result.user?.role;
      if (role === 'SHOP_OWNER') navigate('/shop-dashboard');
      else navigate('/');
    } else {
      if (result.errors) {
        setErrors(result.errors);
        showError('Registration failed. Please check your information.');
      } else {
        setErrors({ general: result.error });
        showError(result.error || 'Registration failed. Please try again.');
      }
    }
  };

  const inputClass = (field) =>
    `w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <ShoppingBag className="h-10 w-10 text-blue-600" aria-hidden="true" />
            <span className="text-2xl font-bold text-gray-800">Smart Finder</span>
          </Link>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Get Started</h1>

          {errors.general && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4" role="alert">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" aria-hidden="true" />
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Role selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect('CUSTOMER')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  form.role === 'CUSTOMER'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                aria-pressed={form.role === 'CUSTOMER'}
              >
                <User className="h-6 w-6" aria-hidden="true" />
                <span className="text-sm font-medium">Customer</span>
                <span className="text-xs text-center opacity-70">Find & compare products</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('SHOP_OWNER')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  form.role === 'SHOP_OWNER'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                aria-pressed={form.role === 'SHOP_OWNER'}
              >
                <Store className="h-6 w-6" aria-hidden="true" />
                <span className="text-sm font-medium">Shop Owner</span>
                <span className="text-xs text-center opacity-70">List your products</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input id="first_name" name="first_name" type="text" value={form.first_name} onChange={handleChange} className={inputClass('first_name')} required />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
              </div>
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input id="last_name" name="last_name" type="text" value={form.last_name} onChange={handleChange} className={inputClass('last_name')} required />
                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input id="username" name="username" type="text" value={form.username} onChange={handleChange} className={inputClass('username')} autoComplete="username" required />
              {errors.username && <p className="text-red-500 text-xs mt-1">{Array.isArray(errors.username) ? errors.username[0] : errors.username}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className={inputClass('email')} autoComplete="email" required />
              {errors.email && <p className="text-red-500 text-xs mt-1">{Array.isArray(errors.email) ? errors.email[0] : errors.email}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-gray-400">(optional)</span></label>
              <input id="phone_number" name="phone_number" type="tel" value={form.phone_number} onChange={handleChange} placeholder="+251912345678" className={inputClass('phone_number')} />
              {errors.phone_number && <p className="text-red-500 text-xs mt-1">{Array.isArray(errors.phone_number) ? errors.phone_number[0] : errors.phone_number}</p>}
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className={`${inputClass('password')} pr-12`}
                  autoComplete="new-password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{Array.isArray(errors.password) ? errors.password[0] : errors.password}</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input id="password_confirm" name="password_confirm" type={showPassword ? 'text' : 'password'} value={form.password_confirm} onChange={handleChange} className={inputClass('password_confirm')} autoComplete="new-password" required />
              {errors.password_confirm && <p className="text-red-500 text-xs mt-1">{errors.password_confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader className="h-4 w-4 animate-spin" aria-hidden="true" /> Creating account...</>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
