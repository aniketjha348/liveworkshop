import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { LogOut, User, BookOpen } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="glass-header sticky top-0 z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-semibold text-slate-900">WorkshopFlow</span>
          </Link>

          <nav className="flex items-center gap-4">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Button
                    data-testid="admin-dashboard-btn"
                    variant="ghost"
                    onClick={() => navigate('/admin')}
                  >
                    Admin Dashboard
                  </Button>
                ) : (
                  <Button
                    data-testid="my-workshops-btn"
                    variant="ghost"
                    onClick={() => navigate('/dashboard')}
                  >
                    Dashboard
                  </Button>
                )}
                <Button
                  data-testid="logout-btn"
                  variant="outline"
                  onClick={handleLogout}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  data-testid="login-btn"
                  variant="ghost"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button
                  data-testid="register-btn"
                  onClick={() => navigate('/register')}
                  className="rounded-full"
                >
                  Get Started
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;