import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api, BACKEND_URL } from '@/services/api';
import { Button } from '../components/ui/button';
import { formatDateSimple, formatTime, formatPrice } from '@/utils/dateUtils';
import { getThumbnailUrl } from '@/utils/imageUtils';
import { 
  Calendar, Clock, Video, 
  BookOpen, History, User,
  Trophy, Receipt
} from 'lucide-react';
import { toast } from 'sonner';

const MyWorkshops = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, past, payments

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyWorkshops();
  }, [user, navigate]);

  const fetchMyWorkshops = async () => {
    try {
      const response = await api.get('/registrations/my-workshops');
      setWorkshops(response.data);
    } catch (error) {
      toast.error('Failed to load your workshops');
    } finally {
      setLoading(false);
    }
  };

  // Logic for Greeting
  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 18) return "Good Afternoon";
      return "Good Evening";
  };

  // Filter Workshops
  const now = new Date();
  const upcomingWorkshops = workshops.filter(w => new Date(w.date_time) > now);
  const pastWorkshops = workshops.filter(w => new Date(w.date_time) <= now);
  
  // Calculate Stats
  const totalHours = workshops.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60;

  const stats = [
    {
      label: "Upcoming",
      value: upcomingWorkshops.length,
      icon: Calendar,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      label: "Completed",
      value: pastWorkshops.length,
      icon: Trophy,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      label: "Hours",
      value: Math.round(totalHours),
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      label: "Spent",
      value: formatPrice(workshops.reduce((acc, curr) => acc + curr.price, 0)),
      icon: Receipt,
      color: "text-amber-600",
      bg: "bg-amber-50"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">My Learning</h1>
            <p className="text-slate-500 text-sm mt-0.5">
                {getGreeting()}, <span className="font-medium text-slate-700">{user?.name}</span>
            </p>
          </div>
          <Button size="sm" onClick={() => navigate('/')} variant="outline" className="gap-1.5 text-xs">
             <BookOpen className="w-3.5 h-3.5" />
             Browse
          </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{stat.value}</h3>
              </div>
              <div className={`p-1.5 rounded-md ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
          
          {/* Tabs/Filter Header */}
          <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                  <button 
                      onClick={() => setActiveTab('upcoming')}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          activeTab === 'upcoming' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                      Upcoming
                  </button>
                  <button 
                      onClick={() => setActiveTab('past')}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          activeTab === 'past' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                      History
                  </button>
                  <button 
                      onClick={() => setActiveTab('payments')}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          activeTab === 'payments' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                      Payments
                  </button>
              </div>
          </div>

          {/* Content */}
          <div className="p-6">
              {(activeTab === 'upcoming' || activeTab === 'past') && (
                <>
                    {(activeTab === 'upcoming' ? upcomingWorkshops : pastWorkshops).length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                {activeTab === 'upcoming' ? <Calendar className="w-8 h-8 text-slate-300" /> : <History className="w-8 h-8 text-slate-300" />}
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">No {activeTab} workshops</h3>
                            <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">
                                {activeTab === 'upcoming' 
                                    ? "You don't have any upcoming sessions scheduled." 
                                    : "You haven't completed any workshops yet."}
                            </p>
                            {activeTab === 'upcoming' && (
                                <Button variant="link" onClick={() => navigate('/')} className="mt-4 text-blue-600">
                                    Browse available workshops
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(activeTab === 'upcoming' ? upcomingWorkshops : pastWorkshops).map((workshop) => (
                                <div key={workshop.id} className="group flex flex-col bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden">
                                    {/* Thumbnail */}
                                    <div className="h-40 bg-slate-100 relative overflow-hidden">
                                         {workshop.thumbnail ? (
                                            <img 
                                                src={getThumbnailUrl(workshop.thumbnail, BACKEND_URL)} 
                                                alt={workshop.title} 
                                                className="w-full h-full object-cover" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <BookOpen className="w-8 h-8" />
                                            </div>
                                        )}
                                        {activeTab === 'upcoming' && (
                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-semibold text-blue-700 shadow-sm">
                                                Upcoming
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2" title={workshop.title}>
                                            {workshop.title}
                                        </h3>
                                        
                                        <div className="space-y-2 mb-4 flex-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <User className="w-3.5 h-3.5" />
                                                <span>{workshop.instructor_name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{formatDateSimple(workshop.date_time)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{formatTime(workshop.date_time)}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex gap-2">
                                            {activeTab === 'upcoming' && (
                                                <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => workshop.zoom_join_url ? window.open(workshop.zoom_join_url, '_blank') : toast.info('Link active 15 mins before start')}>
                                                    Join
                                                </Button>
                                            )}
                                            <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/workshop/${workshop.id}`)}>
                                                Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
              )}

              {activeTab === 'payments' && (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                  <th className="px-6 py-4 font-semibold text-slate-700">Workshop</th>
                                  <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                                  <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                                  <th className="px-6 py-4 font-semibold text-slate-700">Invoice ID</th>
                                  <th className="px-6 py-4 font-semibold text-slate-700 text-right">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {workshops.map((t) => (
                                  <tr key={t.id} className="hover:bg-slate-50/50">
                                      <td className="px-6 py-4 font-medium text-slate-900">{t.title}</td>
                                      <td className="px-6 py-4 text-slate-500">{formatDateSimple(t.registered_at)}</td>
                                      <td className="px-6 py-4 text-slate-900">{formatPrice(t.price)}</td>
                                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{t.payment_id}</td>
                                      <td className="px-6 py-4 text-right">
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              Paid
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                              {workshops.length === 0 && (
                                  <tr>
                                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                          No payment history found
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default MyWorkshops;