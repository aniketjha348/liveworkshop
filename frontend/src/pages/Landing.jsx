import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api, BACKEND_URL } from '@/services/api';
import { Button } from '../components/ui/button';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { getThumbnailUrl } from '@/utils/imageUtils';
import { 
  Calendar, Clock, User, Video, 
  ArrowRight, Sparkles, Users, Star, Play,
  Zap, TrendingUp, Award, Flame, Timer
} from 'lucide-react';
import { toast } from 'sonner';

// Workshop Card Component with Sale Support
const WorkshopCard = ({ workshop, navigate, BACKEND_URL }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [saleActive, setSaleActive] = useState(false);

  // Check if sale is active and manage countdown
  useEffect(() => {
    if (workshop.sale_price && workshop.sale_end_time) {
      const updateTimer = () => {
        const end = new Date(workshop.sale_end_time).getTime();
        const now = new Date().getTime();
        const distance = end - now;

        if (distance < 0) {
          setSaleActive(false);
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        } else {
          setSaleActive(true);
          setTimeLeft({
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          });
        }
      };
      
      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [workshop.sale_price, workshop.sale_end_time]);

  const discount = saleActive ? Math.round((1 - workshop.sale_price / workshop.price) * 100) : 0;
  const displayPrice = saleActive ? workshop.sale_price : workshop.price;

  // Format date for card
  const cardFormatDate = (dateStr) => formatDate(dateStr);
  const cardFormatTime = (dateStr) => formatTime(dateStr);

  return (
    <div
      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-indigo-200"
      data-testid={`workshop-card-${workshop.id}`}
    >
      {/* Flash Sale Header Banner */}
      {saleActive && (
        <div className="bg-gradient-to-r from-red-600 via-orange-500 to-red-600 text-white py-2 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-bold">FLASH SALE</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">{discount}% OFF</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono">
              <Timer className="w-3 h-3" />
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>
      )}

      {/* Live Badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-md text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        LIVE
      </div>
      
      {/* Thumbnail with Overlay */}
      <div className="relative h-36 overflow-hidden">
        <img
          src={getThumbnailUrl(workshop.thumbnail, BACKEND_URL)}
          alt={workshop.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Discount Badge on Image */}
        {saleActive && (
          <div className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
            Save ₹{(workshop.price - workshop.sale_price) / 100}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Instructor */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
            {workshop.instructor_name?.[0] || 'I'}
          </div>
          <span className="text-xs text-slate-500 font-medium">{workshop.instructor_name}</span>
        </div>
        
        <h3 className="text-base font-semibold text-slate-900 mb-1.5 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {workshop.title}
        </h3>
        
        <p className="text-slate-500 text-xs mb-3 line-clamp-2">
          {workshop.description}
        </p>
        
        {/* Date & Time */}
        <div className="flex items-center gap-3 mb-4 p-2 bg-indigo-50/50 rounded-lg text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-medium text-slate-700">{cardFormatDate(workshop.date_time)}</span>
          </div>
          <div className="w-px h-3 bg-slate-200"></div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-medium text-slate-700">{cardFormatTime(workshop.date_time)}</span>
          </div>
        </div>
        
        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-lg font-bold ${saleActive ? 'text-red-600' : 'text-slate-900'}`}>
                ₹{displayPrice / 100}
              </span>
              {saleActive && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{workshop.price / 100}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">{workshop.duration} min</span>
          </div>
          
          <Button 
            size="sm"
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              saleActive 
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/workshop/${workshop.id}`);
            }}
          >
            {saleActive ? 'Grab Deal' : 'Enroll'}
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const response = await api.get('/workshops');
      setWorkshops(response.data);
    } catch (error) {
      toast.error('Failed to load workshops');
    } finally {
      setLoading(false);
    }
  };

  // Check if any workshop has active sale\n  const hasAnySaleActive = workshops.some(w => \n    w.sale_price && w.sale_end_time && new Date(w.sale_end_time) > new Date()\n  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-50 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-40"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Live Interactive Workshops</span>
          </div>
          
          <h1 
            className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4"
            data-testid="hero-title"
          >
            Master Skills with
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Live Experts
            </span>
          </h1>
          
          <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto mb-6 leading-relaxed">
            Join real-time workshops led by industry experts. 
            Ask questions and accelerate your learning.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              className="rounded-full px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300"
              onClick={() => document.getElementById('workshops').scrollIntoView({ behavior: 'smooth' })}
            >
              Explore Workshops
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            
            {!user && (
              <Button
                variant="outline"
                className="rounded-full px-6 py-2.5 text-sm font-medium border hover:bg-slate-50"
                onClick={() => navigate('/register')}
              >
                Create Free Account
              </Button>
            )}
          </div>
          
          {/* Trust Badges */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-slate-500 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="font-medium">500+ Students</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-medium">4.9 Rating</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">Certificate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Why Learn With Us?</h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">Interactive online learning platform</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Video,
                title: "Live Sessions",
                description: "Real-time Zoom classes with Q&A",
                gradient: "from-indigo-500 to-purple-500"
              },
              {
                icon: TrendingUp,
                title: "Expert Instructors",
                description: "10+ years industry experience",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: Zap,
                title: "Smart Reminders",
                description: "Never miss a session",
                gradient: "from-amber-500 to-orange-500"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group bg-white rounded-lg p-5 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{feature.title}</h3>
                <p className="text-xs text-slate-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshops Section */}
      <section id="workshops" className="py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-8">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-600 font-medium text-xs mb-1">
                <Play className="w-3 h-3" />
                LIVE WORKSHOPS
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Upcoming Sessions
              </h2>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              Limited seats available
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading workshops...</p>
              </div>
            </div>
          ) : workshops.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Workshops Scheduled</h3>
              <p className="text-slate-600">New sessions coming soon. Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {workshops.map((workshop) => (
                <WorkshopCard 
                  key={workshop.id} 
                  workshop={workshop} 
                  navigate={navigate}
                  BACKEND_URL={BACKEND_URL}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M1.22676 0C1.91374 0 2.45351 0.539773 2.45351 1.22676C2.45351 1.91374 1.91374 2.45351 1.22676 2.45351C0.539773 2.45351 0 1.91374 0 1.22676C0 0.539773 0.539773 0 1.22676 0Z\" fill=\"rgba(255,255,255,0.07)\"%3E%3C/path%3E%3C/svg%3E')] opacity-50"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Level Up Your Skills?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of learners who have transformed their careers through our live workshops.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 rounded-full px-10 py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
            onClick={() => navigate(user ? '/dashboard' : '/register')}
          >
            {user ? 'Go to Dashboard' : 'Start Learning Today'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-center">
        <p className="text-slate-400 text-sm">© 2026 WorkshopFlow. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;