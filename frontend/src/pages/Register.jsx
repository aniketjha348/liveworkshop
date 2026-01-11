import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(name, email, password);
      toast.success('Registration successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold mb-2" data-testid="register-title">Get Started</h1>
          <p className="text-slate-600">Create your account to join workshops</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" data-testid="register-form">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              data-testid="name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

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
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            data-testid="register-submit-btn"
            className="w-full rounded-full"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-600">Already have an account? </span>
          <Link to="/login" className="text-blue-600 font-medium hover:underline" data-testid="login-link">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;