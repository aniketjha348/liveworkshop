/**
 * Landing Page - Modern Fresh Design 2026
 * Contemporary aesthetics with vibrant accents
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { api, BACKEND_URL } from '@/services/api';
import { getWorkshops, getMyWorkshops } from '@/services/api';
import { Button } from '@/components/ui/button';
import { 
  Calendar, Clock, Video, CheckCircle2, 
  ArrowRight, Users, Star, Play,
  Timer, ChevronRight, Shield, BadgeCheck,
  Sparkles, GraduationCap, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES, getWorkshopRoute } from '@/constants';

// Modern Workshop Card
const WorkshopCard = ({ workshop, navigate, BACKEND_URL, isRegistered }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [saleActive, setSaleActive] = useState(false);

  useEffect(() => {
    if (workshop.sale_price && workshop.sale_end_time) {
      const updateTimer = () => {
        const end = new Date(workshop.sale_end_time).getTime();
        const now = new Date().getTime();
        const distance = end - now;

        if (distance < 0) {
          setSaleActive(false);
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

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };

  const { date, time } = formatDateTime(workshop.date_time);

  return (
    <article
      className="group bg-white rounded-3xl overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 border border-slate-100 hover:border-violet-100/50 flex flex-col h-full"
      data-testid={`workshop-card-${workshop.id}`}
    >
      {/* Sale Strip */}
      {saleActive && (
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 text-white px-4 py-2.5 flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-1.5 animate-pulse">
            <Zap className="w-4 h-4 fill-white" />
            <span>{discount}% OFF — Flash Sale</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
            <Timer className="w-3 h-3" />
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </div>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={workshop.thumbnail ? (workshop.thumbnail.startsWith('http') ? workshop.thumbnail : `${BACKEND_URL}${workshop.thumbnail}`) : "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"}
          alt={workshop.title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        <div className="absolute top-4 right-4 flex gap-2">
          {isRegistered && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Registered
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-slate-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
            <span className="w-2 h-2 bg-rose-500 rounded-full absolute"></span>
            <span className="ml-1">Live Interactive</span>
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 flex flex-col flex-grow relative">
        {/* Floating Instructor Avatar */}
        <div className="absolute -top-6 left-6 w-12 h-12 rounded-2xl bg-white p-1 shadow-lg ring-1 ring-slate-100 rotate-3 group-hover:rotate-0 transition-all duration-300">
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
            {workshop.instructor_name?.[0]?.toUpperCase() || 'I'}
          </div>
        </div>

        <div className="mt-4 mb-2">
          <span className="text-xs font-semibold tracking-wider text-violet-600 uppercase bg-violet-50 px-2 py-1 rounded-md">
            Workshop
          </span>
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-slate-800 mb-3 line-clamp-2 leading-tight group-hover:text-violet-600 transition-colors">
          {workshop.title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed flex-grow">
          {workshop.description}
        </p>
        
        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 group-hover:bg-violet-50/50 transition-colors">
            <div className="p-1.5 bg-white rounded-lg shadow-sm text-violet-500">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Date</span>
              <span className="text-xs font-bold text-slate-700">{date}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 group-hover:bg-violet-50/50 transition-colors">
            <div className="p-1.5 bg-white rounded-lg shadow-sm text-violet-500">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Time</span>
              <span className="text-xs font-bold text-slate-700">{time}</span>
            </div>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <div className="flex flex-col">
             <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Price</span>
             <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                ₹{displayPrice / 100}
              </span>
              {saleActive && (
                <span className="text-sm text-slate-400 line-through font-medium">₹{workshop.price / 100}</span>
              )}
            </div>
          </div>
          
          <Button 
            className={`
              relative overflow-hidden transition-all duration-300 
              ${isRegistered 
                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 shadow-none' 
                : 'bg-slate-900 text-white hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-200 hover:-translate-y-0.5'
              }
              font-bold rounded-xl px-6 py-2.5 h-auto rounded-xl
            `}
            onClick={(e) => {
              e.stopPropagation();
              navigate(getWorkshopRoute(workshop.id));
            }}
          >
            {isRegistered ? (
               <span className="flex items-center gap-2">
                Enrolled <CheckCircle2 className="w-4 h-4" />
               </span>
            ) : (
              <span className="flex items-center gap-2">
                Enroll <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeredWorkshopIds, setRegisteredWorkshopIds] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate(ROUTES.ADMIN);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  // Fetch user's registered workshops
  useEffect(() => {
    const fetchRegisteredWorkshops = async () => {
      if (user) {
        try {
          const myWorkshops = await getMyWorkshops();
          setRegisteredWorkshopIds(myWorkshops.map(w => w.id));
        } catch (error) {
          // Ignore errors - user might not be logged in
        }
      } else {
        setRegisteredWorkshopIds([]);
      }
    };
    fetchRegisteredWorkshops();
  }, [user]);

  const fetchWorkshops = async () => {
    try {
      const data = await getWorkshops();
      setWorkshops(data);
    } catch (error) {
      toast.error('Failed to load workshops');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-violet-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-100/40 to-indigo-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-100/30 to-rose-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-violet-100 rounded-full px-4 py-2 mb-8 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-sm font-medium text-slate-600">Live Learning Platform</span>
              </div>
            </div>
            
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight"
              data-testid="hero-title"
            >
              Learn from{' '}
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Industry Experts
              </span>
              <br />in Real-Time
            </h1>
            
            <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join interactive live workshops, get hands-on experience, and accelerate your career with personalized guidance from professionals.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mb-16">
              <Button
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all text-base"
                onClick={() => document.getElementById('workshops').scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Workshops
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              {!user && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold px-8 py-4 rounded-xl text-base"
                  onClick={() => navigate(ROUTES.REGISTER)}
                >
                  Create Free Account
                </Button>
              )}
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800">500+</div>
                <div className="text-sm text-slate-500 mt-1">Happy Learners</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-3xl font-bold text-slate-800">
                  4.9 <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
                <div className="text-sm text-slate-500 mt-1">Avg. Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800">15+</div>
                <div className="text-sm text-slate-500 mt-1">Expert Mentors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">Why Choose Us?</h2>
            <p className="text-slate-500">A better way to learn and grow your skills</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Video,
                title: "Live Interactive",
                description: "Real-time sessions with Q&A. Ask questions and get instant answers.",
                color: "from-violet-500 to-indigo-500",
                bgColor: "bg-violet-50"
              },
              {
                icon: GraduationCap,
                title: "Expert-Led",
                description: "Learn from professionals with 10+ years of industry experience.",
                color: "from-emerald-500 to-teal-500",
                bgColor: "bg-emerald-50"
              },
              {
                icon: Shield,
                title: "Certified",
                description: "Get verified certificates to showcase your new skills.",
                color: "from-amber-500 to-orange-500",
                bgColor: "bg-amber-50"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`${feature.bgColor} rounded-2xl p-6 border border-slate-100 hover:shadow-lg transition-all duration-300`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workshops Section */}
      <section id="workshops" className="py-16 md:py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
                <Play className="w-3.5 h-3.5" />
                UPCOMING
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800" data-testid="workshops-title">
                Live Sessions
              </h2>
            </div>
            <p className="text-slate-500 text-sm max-w-sm">
              Small batch sizes for personalized attention & maximum impact.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="flex items-center gap-3 text-slate-500">
                <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
                <span>Loading workshops...</span>
              </div>
            </div>
          ) : workshops.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200" data-testid="no-workshops">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-700 mb-2">No workshops scheduled</h3>
              <p className="text-sm text-slate-500">New sessions are added regularly. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.map((workshop) => (
                <WorkshopCard 
                  key={workshop.id} 
                  workshop={workshop} 
                  navigate={navigate}
                  BACKEND_URL={BACKEND_URL}
                  isRegistered={registeredWorkshopIds.includes(workshop.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            {/* Pattern */}
            <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
            
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to level up your skills?
              </h2>
              <p className="text-violet-100 mb-8 max-w-lg mx-auto">
                Join thousands of learners who've transformed their careers through our live workshops.
              </p>
              <Button
                size="lg"
                className="bg-white text-violet-600 hover:bg-violet-50 font-semibold px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all text-base"
                onClick={() => navigate(user ? ROUTES.DASHBOARD : ROUTES.REGISTER)}
              >
                {user ? 'Go to Dashboard' : 'Start Learning Free'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-slate-800 text-center">
        <p className="text-slate-400 text-sm">© 2026 WorkshopFlow. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
