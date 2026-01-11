import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { useNavigate } from "react-router-dom";
import { api, BACKEND_URL } from "@/services/api";
import { Button } from "../components/ui/button";
import { 
  Plus, Calendar, Users, DollarSign, BookOpen, User, ArrowUpRight,
  Clock, TrendingUp, Eye, Mail
} from "lucide-react";
import { toast } from "sonner";
import { ROUTES } from "@/constants";

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_registrations: 0,
    total_workshops: 0,
    total_users: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [workshopsRes, statsRes] = await Promise.all([
        api.get("/workshops"),
        api.get("/admin/stats")
      ]);
      setWorkshops(workshopsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
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
  const upcomingWorkshops = workshops.filter(w => new Date(w.date_time) > now).slice(0, 3);

  const quickActions = [
    { icon: Plus, label: "New Workshop", action: () => navigate('/admin/workshops?create=true'), color: "blue" },
    { icon: Users, label: "Manage Users", action: () => navigate(ROUTES.ADMIN_USERS), color: "emerald" },
    { icon: Mail, label: "Email Settings", action: () => navigate(ROUTES.ADMIN_SETTINGS), color: "purple" },
    { icon: TrendingUp, label: "View Analytics", action: () => navigate(ROUTES.ADMIN_TRANSACTIONS), color: "orange" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-lg md:text-xl font-bold">{getGreeting()}, {user?.name}! 👋</h1>
          <p className="text-indigo-100 mt-1 text-sm max-w-md">
            Quick overview of your workshop platform
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button size="sm" onClick={() => navigate('/admin/workshops?create=true')} className="bg-white text-indigo-700 hover:bg-indigo-50 gap-1.5 text-xs">
              <Plus className="w-3.5 h-3.5" /> New Workshop
            </Button>
            <Button size="sm" onClick={() => navigate(ROUTES.HOME)} variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5" /> View Site
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={action.action}
              className="group bg-white p-3 rounded-lg border border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all text-left"
            >
              <div className={`w-8 h-8 rounded-md bg-${action.color}-50 flex items-center justify-center mb-2`}>
                <action.icon className={`w-4 h-4 text-${action.color}-600`} />
              </div>
              <span className="text-xs font-medium text-slate-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Revenue", value: `₹${(stats.total_revenue / 100).toLocaleString()}`, icon: DollarSign, color: "emerald", bg: "bg-emerald-50" },
          { label: "Registrations", value: stats.total_registrations, icon: Users, color: "indigo", bg: "bg-indigo-50" },
          { label: "Workshops", value: stats.total_workshops, icon: BookOpen, color: "purple", bg: "bg-purple-50" },
          { label: "Users", value: stats.total_users, icon: User, color: "amber", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{stat.value}</h3>
              </div>
              <div className={`p-2 ${stat.bg} rounded-lg`}>
                <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Workshops */}
      {upcomingWorkshops.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Upcoming</h2>
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 gap-1 text-xs h-7" onClick={() => navigate('/admin/workshops')}>
              View All <ArrowUpRight className="w-3 h-3" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {upcomingWorkshops.map((workshop) => (
              <div key={workshop.id} className="group bg-slate-50 rounded-lg p-3 hover:bg-indigo-50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/workshops/${workshop.id}`)}>
                <div className="flex items-start gap-2">
                  {workshop.thumbnail ? (
                    <img src={workshop.thumbnail.startsWith('http') ? workshop.thumbnail : `${BACKEND_URL}${workshop.thumbnail}`} alt="" className="w-10 h-10 rounded-md object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                      {workshop.title[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium text-slate-900 truncate">{workshop.title}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(workshop.date_time).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(workshop.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
