import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "sonner";
import { ArrowLeft, Search, UserPlus, Download, User, Bell } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

const AdminWorkshopStudents = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Manual Enroll State
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, workshopsRes] = await Promise.all([
           api.get(`/admin/workshops/${id}/students`),
           api.get("/workshops") 
        ]);

        setStudents(studentsRes.data.students);
        const foundWorkshop = workshopsRes.data.find(w => w.id === id);
        setWorkshop(foundWorkshop || { title: "Unknown Workshop" });
        
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleManualEnroll = async (e) => {
    e.preventDefault();
    if (!enrollEmail) return;
    
    setEnrolling(true);
    try {
        await api.post(`/admin/workshops/${id}/enroll`, {
            email: enrollEmail
        });
        toast.success("Student manually enrolled!");
        setEnrollEmail("");
        // Refresh list
        const response = await api.get(`/admin/workshops/${id}/students`);
        setStudents(response.data.students);
    } catch (error) {
         toast.error(error.response?.data?.detail || "Failed to enrol student");
    } finally {
        setEnrolling(false);
    }
  };

  const handleSendReminder = async () => {
    if (!window.confirm("Send email reminder to ALL students in this workshop?")) return;
    setSendingReminder(true);
    try {
        const res = await api.post(`/admin/workshops/${id}/send-reminder`, {});
        toast.success(res.data.message);
    } catch (error) {
        toast.error("Failed to send reminders");
    } finally {
        setSendingReminder(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold text-slate-900">{workshop?.title}</h1>
            <p className="text-slate-600">Registered Students Management</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        
        {/* Manual Enroll Form */}
        <div className="flex w-full xl:w-auto gap-2 items-center flex-1 max-w-2xl">
            <div className="relative flex-1">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder="Manually enroll by email..." 
                    value={enrollEmail}
                    onChange={(e) => setEnrollEmail(e.target.value)}
                    className="pl-9"
                />
            </div>
            <Button onClick={handleManualEnroll} disabled={!enrollEmail || enrolling}>
                {enrolling ? "Enrolling..." : "Enroll"}
            </Button>
        </div>
        
        {/* Search & Export */}
        <div className="flex w-full xl:w-auto gap-2 items-center">
             <div className="relative flex-1 xl:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder="Search students..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>
            <Button variant="outline" className="gap-2 text-slate-600" onClick={handleSendReminder} disabled={sendingReminder}>
                <Bell className="w-4 h-4" />
                {sendingReminder ? "Sending..." : "Send Reminder"}
            </Button>
            <Button variant="outline" className="gap-2 text-slate-600">
                <Download className="w-4 h-4" />
                Export
            </Button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Student List</h3>
            <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                Total: {students.length}
            </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Email</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Registration Date</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No students found matching your search
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {student.name[0]}
                        </div>
                        {student.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{student.email}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(student.registered_at || Date.now()).toLocaleDateString(undefined, {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Active
                        </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkshopStudents;
