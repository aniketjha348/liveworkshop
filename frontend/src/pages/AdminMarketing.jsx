import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '../components/ui/dialog';
import { 
    Tag, Timer, Plus, Trash2, Calendar, Zap 
} from 'lucide-react';
import { toast } from 'sonner';

const AdminMarketing = () => {
    const [activeTab, setActiveTab] = useState('coupons'); // coupons, flash_sales
    const [coupons, setCoupons] = useState([]);
    const [workshops, setWorkshops] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Coupon State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount_type: 'percent',
        discount_value: '',
        valid_until: '',
        max_uses: ''
    });

    // Flash Sale State
    const [selectedWorkshop, setSelectedWorkshop] = useState(null);
    const [saleConfig, setSaleConfig] = useState({
        sale_price: '',
        sale_end_time: ''
    });
    const [isSaleOpen, setIsSaleOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [couponsRes, workshopsRes] = await Promise.all([
                api.get('/coupons'),
                api.get('/workshops')
            ]);
            setCoupons(couponsRes.data);
            setWorkshops(workshopsRes.data);
        } catch (error) {
            toast.error('Failed to load marketing data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            await api.post('/coupons', {
                ...newCoupon,
                discount_value: parseInt(newCoupon.discount_value),
                max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
                valid_until: newCoupon.valid_until ? new Date(newCoupon.valid_until).toISOString() : null
            });
            toast.success('Coupon created successfully!');
            setIsCreateOpen(false);
            fetchData();
            setNewCoupon({ code: '', discount_type: 'percent', discount_value: '', valid_until: '', max_uses: '' });
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create coupon');
        }
    };

    const handleDeleteCoupon = async (code) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;
        try {
            await api.delete(`/coupons/${code}`);
            toast.success('Coupon deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete coupon');
        }
    };

    const openSaleDialog = (workshop) => {
        setSelectedWorkshop(workshop);
        // Pre-fill if exists
        setSaleConfig({
            sale_price: workshop.sale_price ? (workshop.sale_price/100).toString() : '',
            sale_end_time: workshop.sale_end_time ? workshop.sale_end_time.slice(0, 16) : '' // format for datetime-local
        });
        setIsSaleOpen(true);
    };

    const handleSaveSale = async (e) => {
        e.preventDefault();
        try {
            // We need an endpoint to update JUST the sale info, or use the general edit endpoint.
            // Assuming general edit endpoint (PUT /admin/workshops/{id}) exists and accepts partials
            // Actually, server.py likely expects full WorkshopCreate object for PUT.
            // Let's check server.py: @api_router.put("/admin/workshops/{workshop_id}") -> takes WorkshopCreate.
            // This is annoying because we need to send ALL fields.
            // Workaround: Construct full object from selectedWorkshop + changes.
            
            const payload = {
                title: selectedWorkshop.title,
                description: selectedWorkshop.description,
                date_time: selectedWorkshop.date_time,
                duration: selectedWorkshop.duration,
                price: selectedWorkshop.price,
                instructor_name: selectedWorkshop.instructor_name,
                thumbnail: selectedWorkshop.thumbnail,
                // New Fields
                sale_price: saleConfig.sale_price ? parseInt(saleConfig.sale_price) * 100 : null,
                sale_end_time: saleConfig.sale_end_time ? new Date(saleConfig.sale_end_time).toISOString() : null
            };

            await api.put(`/admin/workshops/${selectedWorkshop.id}`, payload);
            toast.success('Flash sale updated!');
            setIsSaleOpen(false);
            fetchData();
        } catch (error) {
             toast.error('Failed to update flash sale');
        }
    };

    const handleRemoveSale = async () => {
        setSaleConfig({ sale_price: '', sale_end_time: '' });
        // Trigger save with nulls
        try {
            const payload = {
                title: selectedWorkshop.title,
                description: selectedWorkshop.description,
                date_time: selectedWorkshop.date_time,
                duration: selectedWorkshop.duration,
                price: selectedWorkshop.price,
                instructor_name: selectedWorkshop.instructor_name,
                thumbnail: selectedWorkshop.thumbnail,
                sale_price: null,
                sale_end_time: null
            };
            await api.put(`/admin/workshops/${selectedWorkshop.id}`, payload);
            toast.success('Flash sale removed');
            setIsSaleOpen(false);
            fetchData();
        } catch (error) {
             toast.error('Failed to remove sale');
        }
    };

    if (loading) return <div className="p-8">Loading marketing data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marketing & Promotions</h1>
                    <p className="text-muted-foreground">Manage coupons and flash sales to drive revenue.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('coupons')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'coupons' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Tag className="w-4 h-4" />
                    Coupons
                </button>
                <button
                    onClick={() => setActiveTab('flash_sales')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'flash_sales' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Zap className="w-4 h-4" />
                    Flash Sales
                </button>
            </div>

            {/* COUPONS TAB */}
            {activeTab === 'coupons' && (
                <div className="space-y-6">
                    <div className="flex justify-end">
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="w-4 h-4" /> Create Coupon
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Coupon</DialogTitle>
                                    <DialogDescription>Generate a code for customers to use at checkout.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateCoupon} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label>Coupon Code</Label>
                                        <Input 
                                            placeholder="e.g. SUMMER25" 
                                            value={newCoupon.code}
                                            onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Discount Type</Label>
                                            <select 
                                                className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm"
                                                value={newCoupon.discount_type}
                                                onChange={(e) => setNewCoupon({...newCoupon, discount_type: e.target.value})}
                                            >
                                                <option value="percent">Percentage (%)</option>
                                                <option value="flat">Flat Amount (₹)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Value</Label>
                                            <Input 
                                                type="number" 
                                                placeholder={newCoupon.discount_type === 'percent' ? "20" : "500"}
                                                value={newCoupon.discount_value}
                                                onChange={(e) => setNewCoupon({...newCoupon, discount_value: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Max Uses (Optional)</Label>
                                            <Input 
                                                type="number" 
                                                placeholder="e.g. 100"
                                                value={newCoupon.max_uses}
                                                onChange={(e) => setNewCoupon({...newCoupon, max_uses: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Valid Until (Optional)</Label>
                                            <Input 
                                                type="datetime-local" 
                                                value={newCoupon.valid_until}
                                                onChange={(e) => setNewCoupon({...newCoupon, valid_until: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full">Create Coupon</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {coupons.length === 0 && <div className="col-span-full text-center text-slate-500 py-10">No coupons active. Create one!</div>}
                        {coupons.map((coupon) => (
                            <div key={coupon.code} className="bg-white border border-slate-200 rounded-xl p-6 flex justify-between items-start group hover:shadow-md transition-shadow">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-mono text-xl font-bold tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                                            {coupon.code}
                                        </span>
                                    </div>
                                    <p className="text-slate-900 font-medium">
                                        {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value / 100} OFF`}
                                    </p>
                                    <div className="text-sm text-slate-500 mt-2 space-y-1">
                                        {coupon.max_uses && <div>Uses: {coupon.used_count} / {coupon.max_uses}</div>}
                                        {coupon.valid_until && <div>Exp: {new Date(coupon.valid_until).toLocaleDateString()}</div>}
                                    </div>
                                </div>
                                <Button size="icon" variant="ghost" className="text-slate-400 hover:text-red-600" onClick={() => handleDeleteCoupon(coupon.code)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FLASH SALES TAB */}
            {activeTab === 'flash_sales' && (
                <div className="space-y-6">
                     <p className="text-slate-600">Select a workshop to configure a limited-time sale price.</p>
                     
                     <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                <tr>
                                    <th className="p-4">Workshop</th>
                                    <th className="p-4">Original Price</th>
                                    <th className="p-4">Sale Status</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {workshops.map((ws) => {
                                    const isOnSale = ws.sale_price && ws.sale_end_time && new Date(ws.sale_end_time) > new Date();
                                    return (
                                        <tr key={ws.id} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-medium text-slate-900">{ws.title}</td>
                                            <td className="p-4 text-slate-600">₹{ws.price / 100}</td>
                                            <td className="p-4">
                                                {isOnSale ? (
                                                    <div className="inline-flex flex-col">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 w-fit">
                                                            <Zap className="w-3 h-3 mr-1" /> ₹{ws.sale_price / 100}
                                                        </span>
                                                        <span className="text-xs text-slate-500 mt-1">
                                                            Ends {new Date(ws.sale_end_time).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">No active sale</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button variant="outline" size="sm" onClick={() => openSaleDialog(ws)}>
                                                    Configure Sale
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                     </div>

                    <Dialog open={isSaleOpen} onOpenChange={setIsSaleOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Configure Flash Sale</DialogTitle>
                                <DialogDescription>
                                    Set a discounted price and end time for <strong>{selectedWorkshop?.title}</strong>.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSaveSale} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Original Price</Label>
                                    <div className="text-sm font-bold">₹{(selectedWorkshop?.price || 0) / 100}</div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Sale Price (₹)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="e.g. 499" 
                                        value={saleConfig.sale_price}
                                        onChange={(e) => setSaleConfig({...saleConfig, sale_price: e.target.value})}
                                        required
                                    />
                                    {saleConfig.sale_price && (parseInt(saleConfig.sale_price) * 100) >= (selectedWorkshop?.price || 0) && (
                                        <div className="text-xs text-red-500">Sale price must be lower than original price.</div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Sale Ends At</Label>
                                    <Input 
                                        type="datetime-local" 
                                        value={saleConfig.sale_end_time}
                                        onChange={(e) => setSaleConfig({...saleConfig, sale_end_time: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="outline" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleRemoveSale}>
                                        Remove Sale
                                    </Button>
                                    <Button type="submit" className="flex-1">
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </div>
    );
};

export default AdminMarketing;
