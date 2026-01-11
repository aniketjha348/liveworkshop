/**
 * Workshop Detail Page - Modern Fresh Design 2026
 * Contemporary product page with vibrant accents
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { api, BACKEND_URL } from '@/services/api';
import { checkCoupon, createPaymentOrder, verifyPayment, checkRegistration } from '@/services/api';
import { getWorkshopRoute } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Calendar, Clock, User, Video, Timer, X, 
  CheckCircle2, Shield, Award, Users, Star, 
  ArrowLeft, Tag, Play, Monitor, FileText,
  MessageCircle, Download, BadgeCheck, ChevronRight,
  Zap, Gift, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/constants';

const WorkshopDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // Marketing State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isSaleActive, setIsSaleActive] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const fetchWorkshop = useCallback(async () => {
    try {
      const response = await api.get(`/workshops/${id}`);
      setWorkshop(response.data);
    } catch (error) {
      toast.error('Failed to load workshop');
      navigate(ROUTES.HOME);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchWorkshop();
  }, [fetchWorkshop]);

  // Check if user is already registered
  useEffect(() => {
    const checkUserRegistration = async () => {
      if (user && id) {
        try {
          const data = await checkRegistration(id);
          setIsRegistered(data.is_registered);
        } catch (error) {
          // User not logged in or error - ignore
          setIsRegistered(false);
        }
      }
    };
    checkUserRegistration();
  }, [user, id]);

  // Sale Timer
  useEffect(() => {
    if (workshop?.sale_end_time && workshop?.sale_price) {
      const updateTimer = () => {
        const end = new Date(workshop.sale_end_time).getTime();
        const now = new Date().getTime();
        const distance = end - now;

        if (distance < 0) {
          setIsSaleActive(false);
        } else {
          setIsSaleActive(true);
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
  }, [workshop]);

  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const data = await checkCoupon(couponCode, workshop.id);
      // Map server response to include code and calculate final_price/discount_amount
      setAppliedCoupon({
        ...data,
        code: couponCode.toUpperCase(),
        final_price: data.discounted_price,
        discount_amount: data.original_price - data.discounted_price
      });
      toast.success('Coupon applied successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handlePayment = async () => {
    if (!user) {
      // Redirect to register with return URL
      const workshopUrl = getWorkshopRoute(id);
      toast.info('Please create an account to enroll');
      navigate(`${ROUTES.REGISTER}?redirect=${encodeURIComponent(workshopUrl)}`);
      return;
    }

    if (isRegistered) {
      toast.info('You are already registered for this workshop!');
      navigate(ROUTES.DASHBOARD);
      return;
    }

    setPaying(true);
    
    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
      toast.error("Payment gateway failed to load");
      setPaying(false);
      return;
    }

    try {
      const order = await createPaymentOrder(
        workshop.id,
        appliedCoupon ? appliedCoupon.code : undefined
      );

      // Handle free orders (coupon made it free or workshop is free)
      if (order.free) {
        toast.success('You\'re enrolled! 🎉 (Free registration)');
        navigate(ROUTES.DASHBOARD);
        return;
      }

      const options = {
        key: order.key, 
        amount: order.amount.toString(),
        currency: order.currency,
        name: "WorkshopFlow",
        description: order.workshop_title,
        order_id: order.order_id,
        handler: async function (response) {
          setVerifying(true);
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              workshop_id: workshop.id
            });
            toast.success('You\'re enrolled! 🎉');
            navigate(ROUTES.DASHBOARD);
          } catch (error) {
            toast.error(error.response?.data?.detail || 'Payment verification failed');
          } finally {
            setVerifying(false);
          }
        },
        prefill: {
          name: order.user_name,
          email: order.user_email,
        },
        theme: {
          color: "#7C3AED"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('You are already registered for this workshop');
      } else if (error.response?.status === 503) {
        toast.error('Payment service not configured');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to initiate payment');
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
          <span className="text-sm font-medium">{verifying ? 'Completing enrollment...' : 'Loading...'}</span>
        </div>
      </div>
    );
  }

  if (!workshop) return null;

  // Calculate Prices
  const basePrice = workshop.price;
  const currentPrice = isSaleActive ? workshop.sale_price : basePrice;
  const discountPercent = isSaleActive ? Math.round((1 - workshop.sale_price / workshop.price) * 100) : 0;
  const finalPrice = appliedCoupon ? appliedCoupon.final_price : currentPrice;

  // Format Date
  const workshopDate = new Date(workshop.date_time);
  const formattedDate = workshopDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long', 
    year: 'numeric'
  });
  const formattedTime = workshopDate.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-violet-50/20" data-testid="workshop-detail">
      {/* Sale Banner */}
      {isSaleActive && (
        <div className="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white py-3 px-4">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center items-center gap-4 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <Zap className="w-4 h-4" />
              <span>Flash Sale — {discountPercent}% OFF</span>
            </div>
            <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
              <Timer className="w-4 h-4" />
              <div className="flex items-center gap-1 font-mono text-sm">
                <span className="bg-white/20 px-2 py-0.5 rounded">{String(timeLeft.days).padStart(2, '0')}d</span>
                <span>:</span>
                <span className="bg-white/20 px-2 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
                <span>:</span>
                <span className="bg-white/20 px-2 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                <span>:</span>
                <span className="bg-white/20 px-2 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate(ROUTES.HOME)} 
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to workshops
        </button>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Left Column - Content (3/5) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hero Image */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 shadow-lg">
              <img
                src={workshop.thumbnail ? (workshop.thumbnail.startsWith('http') ? workshop.thumbnail : `${BACKEND_URL}${workshop.thumbnail}`) : "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800"}
                alt={workshop.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1.5 bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Live Workshop
                </span>
              </div>
              {isSaleActive && (
                <div className="absolute bottom-4 right-4">
                  <span className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg">
                    {discountPercent}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Instructor & Title */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-lg">
                  {workshop.instructor_name?.[0]?.toUpperCase() || 'I'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{workshop.instructor_name}</span>
                    <BadgeCheck className="w-5 h-5 text-violet-500" />
                  </div>
                  <span className="text-sm text-slate-500">Verified Instructor</span>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4" data-testid="workshop-title">
                {workshop.title}
              </h1>
              
              {/* Rating & Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full font-medium">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>4.9</span>
                  <span className="text-amber-600/70">(86)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-4 h-4" />
                  <span>142 enrolled</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>{workshop.duration} min</span>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-3">About This Workshop</h2>
              <p className="text-slate-600 leading-relaxed" data-testid="workshop-description">
                {workshop.description}
              </p>
            </div>

            {/* What You'll Get */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-4">What You'll Get</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Video, label: 'Live Interactive Session', color: 'text-violet-500 bg-violet-50' },
                  { icon: MessageCircle, label: 'Real-time Q&A', color: 'text-emerald-500 bg-emerald-50' },
                  { icon: Award, label: 'Certificate of Completion', color: 'text-amber-500 bg-amber-50' },
                  { icon: Download, label: '30-day Recording Access', color: 'text-blue-500 bg-blue-50' },
                  { icon: Monitor, label: 'Hands-on Exercises', color: 'text-rose-500 bg-rose-50' },
                  { icon: Users, label: 'Community Access', color: 'text-indigo-500 bg-indigo-50' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-slate-700 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Session Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: Calendar, label: 'Date', value: formattedDate, color: 'from-violet-500 to-indigo-500' },
                  { icon: Clock, label: 'Time', value: formattedTime, color: 'from-emerald-500 to-teal-500' },
                  { icon: Timer, label: 'Duration', value: `${workshop.duration} minutes`, color: 'from-amber-500 to-orange-500' },
                  { icon: Monitor, label: 'Platform', value: 'Zoom (Live)', color: 'from-blue-500 to-cyan-500' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-50 rounded-xl p-4">
                    <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{item.label}</p>
                      <p className="font-semibold text-slate-800" data-testid={item.label === 'Date' ? 'workshop-datetime' : undefined}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Pricing Card (2/5) */}
          <div className="lg:col-span-2">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100">
                {/* Price Header */}
                <div className="p-6 bg-gradient-to-br from-slate-50 to-violet-50/50">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-4xl font-bold text-slate-800" data-testid="workshop-price">
                      ₹{finalPrice / 100}
                    </span>
                    {(isSaleActive || appliedCoupon) && (
                      <span className="text-lg text-slate-400 line-through">
                        ₹{basePrice / 100}
                      </span>
                    )}
                  </div>
                  {isSaleActive && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full mt-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      You save ₹{(basePrice - finalPrice) / 100}
                    </span>
                  )}
                </div>
                
                {/* Coupon */}
                <div className="px-6 py-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Have a coupon?" 
                        className="pl-10 uppercase text-sm border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 rounded-xl"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={!!appliedCoupon}
                      />
                    </div>
                    {appliedCoupon ? (
                      <Button variant="outline" size="icon" onClick={removeCoupon} className="shrink-0 border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600">
                        <X className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={handleApplyCoupon} 
                        disabled={!couponCode}
                        className="shrink-0 border-slate-200 text-slate-700 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 rounded-xl"
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                  {appliedCoupon && (
                    <p className="flex items-center gap-1.5 text-sm text-emerald-600 mt-3 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Saved ₹{appliedCoupon.discount_amount / 100}!
                    </p>
                  )}
                </div>

                {/* CTA */}
                <div className="p-6 pt-0">
                  {isRegistered ? (
                    <>
                      <div className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-4 rounded-xl text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Already Registered
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-3 rounded-xl border-slate-200"
                        onClick={() => navigate(ROUTES.DASHBOARD)}
                      >
                        Go to Dashboard
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="lg"
                      data-testid="register-workshop-btn"
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all text-base"
                      onClick={handlePayment}
                      disabled={paying}
                    >
                      {paying ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {user ? 'Enroll Now' : 'Create Account to Enroll'}
                          <ChevronRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  )}
                  
                  {!isRegistered && (
                    <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      Secure payment via Razorpay
                    </p>
                  )}
                </div>

                {/* Trust Signals */}
                <div className="px-6 pb-6">
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    {[
                      { icon: Award, label: 'Certificate included' },
                      { icon: Shield, label: '30-day money-back guarantee' },
                      { icon: Users, label: 'Lifetime community access' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <item.icon className="w-4 h-4 text-emerald-500" />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="mt-6 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl p-4 flex items-center justify-center gap-6 text-sm border border-violet-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="w-4 h-4 text-violet-500" />
                  <span className="font-medium">142 enrolled</span>
                </div>
                <div className="w-px h-4 bg-violet-200"></div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="font-medium">4.9 rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopDetail;
