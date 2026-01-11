/**
 * Login Page
 * User authentication login form with redirect support
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ROUTES } from '@/constants';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect');

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate(ROUTES.ADMIN);
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      // Redirect to the original page or home
      navigate(redirectUrl || ROUTES.HOME);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Build register link with redirect param
  const registerLink = redirectUrl 
    ? `${ROUTES.REGISTER}?redirect=${encodeURIComponent(redirectUrl)}`
    : ROUTES.REGISTER;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2" data-testid="login-title">Welcome Back</h1>
          <p className="text-slate-600">Login to access your workshops</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            data-testid="login-submit-btn"
            className="w-full rounded-full"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-600">Don't have an account? </span>
          <Link to={registerLink} className="text-blue-600 font-medium hover:underline" data-testid="register-link">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
