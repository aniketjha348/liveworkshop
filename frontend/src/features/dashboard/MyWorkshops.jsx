/**
 * My Workshops Page (Student Dashboard)
 * Shows user's enrolled workshops with stats and quick actions
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL, getMyWorkshops } from '@/services/api';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Clock, Video, ExternalLink, 
  BookOpen, CheckCircle, Receipt, History, User,
  Zap, Trophy, Sparkles, MonitorPlay, Play, ArrowRight,
  GraduationCap, Target, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES, getWorkshopRoute } from '@/constants';

const MyWorkshops = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }
    fetchMyWorkshops();
  }, [user, navigate]);

  const fetchMyWorkshops = async () => {
    try {
      const data = await getMyWorkshops();
      setWorkshops(data);
    } catch (error) {
      toast.error('Failed to load your workshops');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const now = new Date();
  
  // A workshop is "upcoming/live" if current time is before (start_time + duration)
  // This way, workshops that have started but are still in progress show as "upcoming"
  const upcomingWorkshops = workshops.filter(w => {
    const startTime = new Date(w.date_time);
    const endTime = new Date(startTime.getTime() + (w.duration || 60) * 60 * 1000); // duration in minutes
    return endTime > now;
  });
  
  const pastWorkshops = workshops.filter(w => {
    const startTime = new Date(w.date_time);
    const endTime = new Date(startTime.getTime() + (w.duration || 60) * 60 * 1000);
    return endTime <= now;
  });
  
  const totalHours = workshops.reduce((acc, curr) => acc + (curr.duration || 0), 0) / 60;
  
  // Find next upcoming workshop
  const nextWorkshop = upcomingWorkshops.length > 0 
    ? upcomingWorkshops.sort((a, b) => new Date(a.date_time) - new Date(b.date_time))[0] 
    : null;

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const getTimeUntil = (dateString) => {
    const diff = new Date(dateString) - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} to go`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} to go`;
    return 'Starting soon!';
  };

  // Check if workshop is currently LIVE (started but not ended)
  const isWorkshopLive = (workshop) => {
    const startTime = new Date(workshop.date_time);
    const endTime = new Date(startTime.getTime() + (workshop.duration || 60) * 60 * 1000);
    return now >= startTime && now < endTime;
  };

  // Check if user can join (30 mins before start OR during live session)
  const canJoinWorkshop = (workshop) => {
    const startTime = new Date(workshop.date_time);
    const endTime = new Date(startTime.getTime() + (workshop.duration || 60) * 60 * 1000);
    const joinableFrom = new Date(startTime.getTime() - 30 * 60 * 1000); // 30 mins before
    return now >= joinableFrom && now < endTime;
  };

  const stats = [
    { label: "Upcoming", value: upcomingWorkshops.length, icon: Calendar, color: "blue", bg: "bg-blue-50" },
    { label: "Completed", value: pastWorkshops.length, icon: Trophy, color: "emerald", bg: "bg-emerald-50" },
    { label: "Learning Hours", value: Math.round(totalHours), icon: Clock, color: "purple", bg: "bg-purple-50" },
    { label: "Invested", value: formatPrice(workshops.reduce((acc, curr) => acc + curr.price, 0)), icon: Receipt, color: "orange", bg: "bg-orange-50" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* Welcome Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-6 h-6" />
              <span className="text-blue-200 text-sm font-medium">My Learning Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">{getGreeting()}, {user?.name}! 👋</h1>
            <p className="text-blue-100 mt-2 max-w-xl">
              {upcomingWorkshops.length > 0 
                ? `You have ${upcomingWorkshops.length} upcoming workshop${upcomingWorkshops.length > 1 ? 's' : ''}. Keep learning and growing!`
                : "Start your learning journey by enrolling in a workshop."}
            </p>
            <Button onClick={() => navigate(ROUTES.HOME)} className="mt-5 bg-white text-blue-700 hover:bg-blue-50 gap-2 shadow-lg">
              <BookOpen className="w-4 h-4" /> Browse Workshops
            </Button>
          </div>

          {/* Next Session Card */}
          {nextWorkshop && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 min-w-[280px]">
              <div className="flex items-center gap-2 text-blue-200 text-xs font-medium mb-3">
                <Star className="w-4 h-4" /> NEXT SESSION
              </div>
              <h3 className="font-semibold text-lg line-clamp-2">{nextWorkshop.title}</h3>
              <div className="flex items-center gap-2 text-blue-100 text-sm mt-2">
                <Calendar className="w-4 h-4" /> {formatDate(nextWorkshop.date_time)}
              </div>
              <div className="flex items-center gap-2 text-blue-100 text-sm mt-1">
                <Clock className="w-4 h-4" /> {formatTime(nextWorkshop.date_time)}
              </div>
              <div className="mt-3 inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                {getTimeUntil(nextWorkshop.date_time)}
              </div>
              {canJoinWorkshop(nextWorkshop) ? (
                <Button 
                  onClick={() => {
                    if (nextWorkshop.zoom_join_url) {
                      window.open(nextWorkshop.zoom_join_url, '_blank');
                    } else {
                      toast.error('Zoom link not available. Please contact support.');
                    }
                  }} 
                  className={`mt-4 w-full gap-2 ${isWorkshopLive(nextWorkshop) ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-white text-blue-700 hover:bg-blue-50'}`}
                  size="sm"
                >
                  <Play className="w-4 h-4" /> {isWorkshopLive(nextWorkshop) ? '🔴 Join Now' : 'Join Meeting'}
                </Button>
              ) : (
                <div className="mt-4 w-full bg-white/20 text-white/80 text-center py-2 rounded-lg text-sm">
                  <Clock className="w-4 h-4 inline mr-2" /> Join opens 30 min before
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
              </div>
              <div className={`p-2.5 ${stat.bg} rounded-xl`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          
        {/* Tabs */}
        <div className="border-b border-slate-100 px-6 pt-4">
          <nav className="flex gap-1 -mb-px" aria-label="Tabs">
            {[
              { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: upcomingWorkshops.length },
              { id: 'past', label: 'Completed', icon: CheckCircle, count: pastWorkshops.length },
              { id: 'payments', label: 'Payments', icon: Receipt, count: null },
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {(activeTab === 'upcoming' || activeTab === 'past') && (
            <>
              {(activeTab === 'upcoming' ? upcomingWorkshops : pastWorkshops).length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    {activeTab === 'upcoming' ? <Calendar className="w-10 h-10 text-slate-300" /> : <Trophy className="w-10 h-10 text-slate-300" />}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">No {activeTab} workshops</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mt-2">
                    {activeTab === 'upcoming' 
                      ? "You don't have any upcoming sessions scheduled." 
                      : "You haven't completed any workshops yet."}
                  </p>
                  {activeTab === 'upcoming' && (
                    <Button onClick={() => navigate(ROUTES.HOME)} className="mt-6 gap-2">
                      <BookOpen className="w-4 h-4" /> Browse Workshops
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {(activeTab === 'upcoming' ? upcomingWorkshops : pastWorkshops).map((workshop) => (
                    <div key={workshop.id} className="group flex flex-col bg-white rounded-2xl border border-slate-100 hover:border-violet-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] transition-all duration-300 overflow-hidden h-full">
                      <div className="h-48 bg-slate-100 relative overflow-hidden">
                        <img 
                          src={workshop.thumbnail ? (workshop.thumbnail.startsWith('http') ? workshop.thumbnail : `${BACKEND_URL}${workshop.thumbnail}`) : "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"} 
                          alt={workshop.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                        
                        {activeTab === 'upcoming' && (
                          isWorkshopLive(workshop) ? (
                            <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1 animate-pulse border border-white/20 backdrop-blur-sm">
                              <span className="w-2 h-2 bg-white rounded-full"></span> LIVE NO
                            </div>
                          ) : (
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-700 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                              <Zap className="w-3 h-3 text-violet-600" /> Upcoming
                            </div>
                          )
                        )}
                        {activeTab === 'past' && (
                          <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Completed
                          </div>
                        )}

                       <div className="absolute bottom-3 left-4 right-4 text-white">
                          <h3 className="font-bold text-lg leading-tight line-clamp-2 drop-shadow-md">{workshop.title}</h3>
                       </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="space-y-3 mb-5 flex-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                            <User className="w-4 h-4 text-violet-500" />
                            <span>{workshop.instructor_name}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                             <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-2 text-xs text-slate-600">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{formatDate(workshop.date_time)}</span>
                             </div>
                             <div className="bg-slate-50 p-2 rounded-lg flex items-center gap-2 text-xs text-slate-600">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{formatTime(workshop.date_time)}</span>
                             </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex gap-3">
                          {activeTab === 'upcoming' && (
                            canJoinWorkshop(workshop) ? (
                              <Button 
                                size="sm" 
                                className={`flex-1 gap-2 shadow-lg ${isWorkshopLive(workshop) ? 'bg-red-600 hover:bg-red-700 animate-pulse text-white' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'}`} 
                                onClick={() => {
                                  if (workshop.zoom_join_url) {
                                    window.open(workshop.zoom_join_url, '_blank');
                                  } else {
                                    toast.error('Zoom link not available. Please contact support.');
                                  }
                                }}
                              >
                                {isWorkshopLive(workshop) ? <Play className="w-3.5 h-3.5 fill-white" /> : <Video className="w-3.5 h-3.5" />} 
                                {isWorkshopLive(workshop) ? 'Join Now' : 'Join Class'}
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                className="flex-1 gap-2 bg-slate-100 text-slate-400 hover:bg-slate-100 cursor-not-allowed border border-slate-200 shadow-none" 
                                disabled
                              >
                                <Clock className="w-3.5 h-3.5" /> Opens in 30m
                              </Button>
                            )
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className={`border-slate-200 hover:bg-slate-50 text-slate-600 ${activeTab === 'upcoming' ? "px-3" : "w-full"}`}
                            onClick={() => navigate(getWorkshopRoute(workshop.id))}
                          >
                            {activeTab === 'upcoming' ? <ExternalLink className="w-4 h-4" /> : 'View Details'}
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
            <div className="overflow-x-auto">
              {workshops.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">No payment history</h3>
                  <p className="text-slate-500 text-sm mt-2">Your payment records will appear here once you enroll in workshops.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-600">Workshop</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Date</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Amount</th>
                      <th className="px-6 py-4 font-semibold text-slate-600">Invoice ID</th>
                      <th className="px-6 py-4 font-semibold text-slate-600 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {workshops.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-medium text-slate-900">{t.title}</td>
                        <td className="px-6 py-4 text-slate-500">{formatDate(t.registered_at)}</td>
                        <td className="px-6 py-4 text-slate-900 font-semibold">{formatPrice(t.price)}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{t.payment_id || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-3 h-3 mr-1" /> Paid
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyWorkshops;
