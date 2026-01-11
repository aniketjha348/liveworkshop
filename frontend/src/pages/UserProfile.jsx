import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, Mail, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';

const UserProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  // Placeholder for future update logic
  const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: ''
  });

  const handleSave = async (e) => {
      e.preventDefault();
      toast.info("Profile update coming soon (Backend integration required)");
      setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Account Settings</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                    {user?.name?.[0]}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                    <p className="text-slate-500">{user?.role === 'student' ? 'Student Account' : 'Administrator'}</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="pl-9"
                                disabled={!isEditing}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                value={formData.email} 
                                className="pl-9 bg-slate-50"
                                disabled // Email usually immutable
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-400" /> Security
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input 
                                type="password" 
                                placeholder="Leave blank to keep current"
                                disabled={!isEditing}
                                value={formData.newPassword}
                                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-3">
                    {isEditing ? (
                        <>
                            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </>
                    ) : (
                        <Button type="button" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    )}
                </div>
            </form>
        </div>
    </div>
  );
};

export default UserProfile;
