import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Compass, 
  User, 
  LogOut,
  Menu,
  X,
  BookOpen
} from 'lucide-react';
import { Button } from './ui/button';

const UserLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'My Learning', path: '/dashboard' },
    { icon: Compass, label: 'Browse Workshops', path: '/' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900">
                StudentHub
                </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'} 
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          
          {/* REMOVED BOTTOM SECTION */}

        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 z-20">
            <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 text-slate-600 lg:hidden hover:bg-slate-100 rounded-lg">
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            <div className="flex items-center gap-4">
                 <div className="text-right hidden md:block leading-tight">
                     <div className="text-sm font-bold text-slate-900">{user?.name}</div>
                     <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
                 </div>
                 
                 {/* User Dropdown */}
                 <div className="relative" ref={profileRef}>
                     <button 
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200 hover:shadow-lg transition-all border-2 border-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                     >
                        {user?.name?.[0]?.toUpperCase()}
                     </button>
                     
                     {/* Dropdown Menu */}
                     {profileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 z-50">
                            <div className="px-4 py-3 border-b border-slate-50 md:hidden">
                                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                            <div className="px-2 py-1">
                                <button onClick={() => {navigate('/dashboard/profile'); setProfileOpen(false)}} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 w-full text-left rounded-lg transition-colors">
                                    <User className="w-4 h-4" /> My Profile
                                </button>
                                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 w-full text-left rounded-lg transition-colors">
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        </div>
                     )}
                 </div>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UserLayout;
