import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api, BACKEND_URL } from '@/services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getThumbnailUrl } from '@/utils/imageUtils';
import { Calendar, Clock, User, Video, Tag, Timer, X } from 'lucide-react';
import { toast } from 'sonner';

const WorkshopDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [verifying, setVerifying] = useState(false);
  
  // Marketing State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSaleActive, setIsSaleActive] = useState(false);

  // Initial Fetch
  const fetchWorkshop = useCallback(async () => {
    try {
      const response = await api.get(`/workshops/${id}`);
      setWorkshop(response.data);
    } catch (error) {
      toast.error('Failed to load workshop');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchWorkshop();
  }, [fetchWorkshop]);

  // Flash Sale Timer Logic
  useEffect(() => {
    if (workshop?.sale_end_time && workshop?.sale_price) {
        const updateTimer = () => {
            const end = new Date(workshop.sale_end_time).getTime();
            const now = new Date().getTime();
            const distance = end - now;

            if (distance < 0) {
                setTimeLeft(null);
                setIsSaleActive(false);
            } else {
                setIsSaleActive(true);
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            }
        };
        
        updateTimer(); // run immediately
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }
  }, [workshop]);

  // Load script function
  const loadScript = (src) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => { resolve(true); };
      script.onerror = () => { resolve(false); };
      document.body.appendChild(script);
    });
  };

  const handleApplyCoupon = async () => {
      if (!couponCode.trim()) return;
      try {
          const res = await api.post('/payment/check-coupon', {
              code: couponCode,
              workshop_id: workshop.id
          });
          setAppliedCoupon(res.data);
          toast.success(res.data.message);
      } catch (error) {
          toast.error(error.response?.data?.detail || 'Invalid Coupon');
          setAppliedCoupon(null);
      }
  };

  const removeCoupon = () => {
      setAppliedCoupon(null);
      setCouponCode('');
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to register');
      navigate('/login');
      return;
    }

    setPaying(true);
    
    // Load Razorpay SDK
    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setPaying(false);
        return;
    }

    try {
      // 1. Create Order with Coupon
      const response = await api.post('/payment/create-order', {
        workshop_id: workshop.id,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined
      });
      const order = response.data;

      // 2. Open Razorpay
      const options = {
        key: order.key, 
        amount: order.amount.toString(),
        currency: order.currency,
        name: "Workshop Platform",
        description: order.workshop_title,
        order_id: order.order_id,
        handler: async function (response) {
            setVerifying(true);
            try {
                await api.post('/payment/verify', {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    workshop_id: workshop.id
                });
                toast.success('Registration successful! Check your email.');
                navigate('/dashboard');
            } catch (error) {
                 toast.error(error.response?.data?.detail || 'Payment verification failed');
            } finally {
                setVerifying(false);
            }
        },
        prefill: {
            name: order.user_name,
            email: order.user_email,
            contact: "9999999999" 
        },
        theme: {
            color: "#2563EB"
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('You are already registered for this workshop');
      } else if (error.response?.status === 503) {
        toast.error('Payment service not configured.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to initiate payment');
      }
    } finally {
        setPaying(false);
    }
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{verifying ? 'Verifying payment...' : 'Loading workshop details...'}</div>
      </div>
    );
  }

  if (!workshop) {
    return null;
  }

  // Calculate Display Prices
  const basePrice = workshop.price;
  const currentPrice = isSaleActive ? workshop.sale_price : basePrice;
  const finalPrice = appliedCoupon ? appliedCoupon.final_price : currentPrice; // Note: appliedCoupon returns final_price relative to when it was checked.
  // Actually, appliedCoupon.final_price calculated by backend might differ if sale status changed in milliseconds, but for UI display it's fine.
  // Better: Re-calculate locally for display sync?
  // Frontend Display Calculation:
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const priceToDisplay = Math.max(0, currentPrice - discountAmount);
  // Note: if backend calculation logic differs, we trust backend 'order.amount' eventually.
  
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Flash Sale Banner */}
        {isSaleActive && (
             <div className="bg-red-600 text-white rounded-t-2xl p-3 flex justify-between items-center px-6 animate-pulse shadow-lg mb-[-10px] relative z-10 mx-4">
                 <div className="flex items-center gap-2 font-bold">
                     <Timer className="w-5 h-5" />
                     FLASH SALE ENDS IN:
                 </div>
                 <div className="font-mono text-xl font-bold bg-white/20 px-3 py-1 rounded">
                     {timeLeft}
                 </div>
             </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100" data-testid="workshop-detail">
          <img
            src={getThumbnailUrl(workshop.thumbnail, BACKEND_URL, "https://images.pexels.com/photos/7222952/pexels-photo-7222952.jpeg")}
            alt={workshop.title}
            className="w-full h-80 object-cover"
          />

          <div className="p-8">
            <h1 className="text-4xl font-semibold mb-4 text-slate-900" data-testid="workshop-title">{workshop.title}</h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed" data-testid="workshop-description">{workshop.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <div className="font-medium text-slate-900">Date & Time</div>
                  <div className="text-slate-600" data-testid="workshop-datetime">
                    {new Date(workshop.date_time).toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <Clock className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <div className="font-medium text-slate-900">Duration</div>
                  <div className="text-slate-600" data-testid="workshop-duration">{workshop.duration} minutes</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <User className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <div className="font-medium text-slate-900">Instructor</div>
                  <div className="text-slate-600" data-testid="workshop-instructor">{workshop.instructor_name}</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <Video className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <div className="font-medium text-slate-900">Platform</div>
                  <div className="text-slate-600">Zoom (Live Interactive)</div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8">
                {/* Coupon Section */}
                <div className="mb-6 max-w-sm">
                     <label className="text-sm font-medium text-slate-700 mb-1 block">Have a coupon code?</label>
                     <div className="flex gap-2">
                         <div className="relative flex-1">
                             <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <Input 
                                 placeholder="Enter code" 
                                 className="pl-9 uppercase"
                                 value={couponCode}
                                 onChange={(e) => setCouponCode(e.target.value)}
                                 disabled={!!appliedCoupon}
                             />
                         </div>
                         {appliedCoupon ? (
                             <Button variant="destructive" size="icon" onClick={removeCoupon}>
                                 <X className="w-4 h-4" />
                             </Button>
                         ) : (
                             <Button variant="outline" onClick={handleApplyCoupon} disabled={!couponCode}>
                                 Apply
                             </Button>
                         )}
                     </div>
                     {appliedCoupon && (
                         <div className="text-green-600 text-sm mt-2 flex items-center gap-1">
                             <Tag className="w-3 h-3" />
                             Code <strong>{appliedCoupon.code}</strong> applied! You saved ₹{appliedCoupon.discount_amount / 100}
                         </div>
                     )}
                </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                <div>
                  <div className="text-sm text-slate-500 mb-1 font-medium">Total Workshop Fee</div>
                  <div className="flex items-baseline gap-2">
                      {isSaleActive && (
                          <span className="text-lg text-slate-400 line-through">₹{basePrice / 100}</span>
                      )}
                      
                      <div className="text-4xl font-bold text-blue-600" data-testid="workshop-price">
                        ₹{appliedCoupon ? appliedCoupon.final_price / 100 : currentPrice / 100}
                      </div>

                      {appliedCoupon && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                              {Math.round((appliedCoupon.discount_amount / currentPrice) * 100)}% OFF
                          </span>
                      )}
                  </div>
                </div>

                <Button
                  size="lg"
                  data-testid="register-workshop-btn"
                  className="rounded-xl px-10 py-6 text-lg font-bold shadow-lg shadow-blue-200"
                  onClick={handlePayment}
                  disabled={paying}
                >
                  {paying ? (
                      <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                          Processing...
                      </span>
                  ) : (
                      'Register Now'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopDetail;