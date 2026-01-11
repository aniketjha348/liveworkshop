import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { 
  getWorkshop, 
} from '@/services/api/workshop.api';
import { 
  getWorkshopStudents, 
  updateWorkshop, 
  sendWorkshopReminder 
} from '@/services/api/admin.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Calendar, Clock, Users, DollarSign, 
  Mail, Settings, CheckCircle, Trash2, Plus,
  Save, Video, AlertCircle, Send
} from 'lucide-react';
import { toast } from 'sonner';

const AdminWorkshopDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ revenue: 0, attendees: 0 });

  // Form states
  const [formData, setFormData] = useState({});
  const [reminders, setReminders] = useState([]);
  const [newReminderHours, setNewReminderHours] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [workshopData, studentsData] = await Promise.all([
          getWorkshop(id),
          getWorkshopStudents(id)
        ]);

        setWorkshop(workshopData);
        setStudents(studentsData);
        // Convert price to Rupees for form state
        setFormData({
          ...workshopData,
          price: workshopData.price / 100
        });
        setReminders(workshopData.reminder_settings || []);

        // Calculate stats
        const revenue = studentsData.reduce((sum, s) => sum + (s.amount || 0), 0);
        setStats({
          revenue,
          attendees: studentsData.length
        });

      } catch (error) {
        toast.error('Failed to load workshop details');
        navigate('/admin/workshops');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Map formData fields to match backend expectations
      // Backend expects 'duration' not 'duration_minutes'
      const { duration_minutes, ...rest } = formData;
      const updated = await updateWorkshop(id, {
        ...rest,
        duration: duration_minutes, // Backend expects 'duration', converts to duration_minutes
        price: formData.price, // Send Rupees, backend multiplies by 100
        reminder_settings: reminders
      });
      setWorkshop(updated);
      toast.success('Workshop updated successfully');
    } catch (error) {
      toast.error('Failed to update workshop');
    }
  };

  const addReminder = () => {
    if (!newReminderHours || newReminderHours <= 0) {
      toast.error('Please enter valid hours');
      return;
    }
    const hours = parseInt(newReminderHours);
    if (reminders.some(r => r.hours_before === hours)) {
      toast.error('Reminder for this time already exists');
      return;
    }

    setReminders([
      ...reminders, 
      { hours_before: hours, type: 'email', subject: null }
    ].sort((a, b) => b.hours_before - a.hours_before)); // Sort descending
    setNewReminderHours('');
  };

  const removeReminder = (index) => {
    const newReminders = [...reminders];
    newReminders.splice(index, 1);
    setReminders(newReminders);
  };

  const handleManualReminder = async () => {
    if (!confirm('Send immediate reminder email to all registered students?')) return;
    try {
      const res = await sendWorkshopReminder(id);
      toast.success(res.message);
    } catch (error) {
      toast.error('Failed to send reminders');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading details...</div>;
  if (!workshop) return <div className="p-8 text-center text-slate-500">Workshop not found</div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <Button variant="ghost" className="mb-2 pl-0 hover:pl-2 transition-all" onClick={() => navigate('/admin/workshops')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Workshops
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">{workshop.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-slate-500 text-sm">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(workshop.date_time).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(workshop.date_time).toLocaleTimeString()}</span>
            <span className="flex items-center gap-1"><Video className="w-4 h-4" /> {workshop.duration_minutes} mins</span>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleManualReminder}>
             <Send className="w-4 h-4 mr-2" /> Send Broadcast
           </Button>
           <Button onClick={handleUpdate} className="bg-violet-600 hover:bg-violet-700">
             <Save className="w-4 h-4 mr-2" /> Save Changes
           </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center">
             <div>
                <p className="text-sm text-slate-500 font-medium">Registrations</p>
                <h3 className="text-2xl font-bold text-slate-900">{stats.attendees}</h3>
             </div>
             <div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Users className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center">
             <div>
                <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
                <h3 className="text-2xl font-bold text-slate-900">₹{stats.revenue / 100}</h3>
             </div>
             <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600"><DollarSign className="w-6 h-6" /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center">
             <div>
                <p className="text-sm text-slate-500 font-medium">Active Reminders</p>
                <h3 className="text-2xl font-bold text-slate-900">{reminders.length}</h3>
             </div>
             <div className="p-3 bg-amber-50 rounded-lg text-amber-600"><Mail className="w-6 h-6" /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-violet-600 text-violet-600 bg-violet-50/50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'students' ? 'border-violet-600 text-violet-600 bg-violet-50/50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
          >
            Students ({stats.attendees})
          </button>
          <button 
            onClick={() => setActiveTab('reminders')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reminders' ? 'border-violet-600 text-violet-600 bg-violet-50/50' : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
          >
            Reminder Settings
          </button>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea 
                    className="w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" 
                    rows="4"
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Instructor</label>
                  <Input value={formData.instructor_name} onChange={e => setFormData({...formData, instructor_name: e.target.value})} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                    <Input 
                      type="datetime-local" 
                      value={formData.date_time ? new Date(formData.date_time).toISOString().slice(0, 16) : ''} 
                      onChange={e => setFormData({...formData, date_time: new Date(e.target.value).toISOString()})} 
                    />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                    <Input type="number" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} />
                   </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                    <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Zoom Join URL</label>
                    <Input value={formData.zoom_join_url || ''} readOnly className="bg-slate-50 text-slate-500 cursor-not-allowed" />
                    <p className="text-xs text-slate-500 mt-1">This link is auto-generated when you save the workshop. It's unique for each student.</p>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Email</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Registered At</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Payment ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{student.name}</td>
                      <td className="px-4 py-3 text-slate-500">{student.email}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(student.registered_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{student.payment_id}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-400">No students registered yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="max-w-2xl">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3 text-blue-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>Configure automated email reminders for this workshop. Reminders are sent automatically based on the time remaining before the workshop starts.</p>
              </div>

              <div className="space-y-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Add Reminder</label>
                    <div className="flex gap-2">
                       <Input 
                        type="number" 
                        placeholder="Value" 
                        value={newReminderHours}
                        onChange={e => setNewReminderHours(e.target.value)}
                        min="0"
                        className="flex-1"
                      />
                      <select
                        id="reminder-unit"
                        className="flex h-10 w-32 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        defaultValue="hours"
                      >
                        <option value="minutes">Minutes</option>
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={() => {
                    const unit = document.getElementById('reminder-unit').value;
                    const val = parseFloat(newReminderHours);
                    
                    if (isNaN(val) || val <= 0) {
                      toast.error('Please enter a valid number');
                      return;
                    }

                    let hoursToAdd = val;
                    if (unit === 'minutes') hoursToAdd = val / 60;
                    if (unit === 'days') hoursToAdd = val * 24;

                    // Avoid precision issues
                    hoursToAdd = parseFloat(hoursToAdd.toFixed(4));

                    if (reminders.some(r => r.hours_before === hoursToAdd)) {
                      toast.error('This reminder already exists');
                      return;
                    }

                    setReminders([...reminders, { hours_before: hoursToAdd, type: 'email', subject: '' }].sort((a, b) => b.hours_before - a.hours_before));
                    setNewReminderHours('');
                    toast.success(`Reminder added for ${val} ${unit} before`);
                  }} variant="outline" className="border-dashed border-2 border-slate-300 hover:border-violet-500 hover:text-violet-600">
                    <Plus className="w-4 h-4 mr-2" /> Add
                  </Button>
                </div>

                <div className="space-y-3 mt-4">
                  {reminders.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
                      <Mail className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-600 font-medium">No custom reminders set</p>
                      <p className="text-xs text-slate-400 mt-1">We'll use the default system setting (usually 24 hours before)</p>
                    </div>
                  ) : (
                    reminders.map((reminder, index) => {
                      // Smart Display Logic
                      let displayVal = reminder.hours_before;
                      let displayUnit = 'Hours';
                      
                      if (displayVal < 1) {
                        displayVal = Math.round(displayVal * 60);
                        displayUnit = 'Minutes';
                      } else if (displayVal % 24 === 0) {
                        displayVal = displayVal / 24;
                        displayUnit = 'Days';
                      }

                      return (
                        <div key={index} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm group hover:border-violet-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                              <Clock className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{displayVal} {displayUnit} Before Start</p>
                              <p className="text-xs text-slate-500">Will receive email with join link</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              const newReminders = [...reminders];
                              newReminders.splice(index, 1);
                              setReminders(newReminders);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })
                  )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWorkshopDetail;
