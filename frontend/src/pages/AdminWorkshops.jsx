import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { api, BACKEND_URL } from "@/services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { 
  Plus, Calendar, Trash2, Image, Search, 
  Pencil, Clock, Eye
} from "lucide-react";
import { toast } from "sonner";

const AdminWorkshops = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date_time: "",
    duration: 60,
    price: 499,
    instructor_name: "",
    thumbnail: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create')) {
      resetForm();
      setDialogOpen(true);
    }
  }, [location.search]);

  useEffect(() => {
    fetchWorkshops();
  }, []);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const response = await api.get("/workshops");
      setWorkshops(response.data);
    } catch (error) {
      toast.error("Failed to load workshops");
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB allowed.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setThumbnailPreview(e.target.result);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const response = await api.post("/upload/thumbnail", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFormData({ ...formData, thumbnail: response.data.url });
      toast.success("Thumbnail uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload thumbnail");
      setThumbnailPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date_time: "",
      duration: 60,
      price: 499,
      instructor_name: "",
      thumbnail: "",
    });
    setThumbnailPreview(null);
    setEditingId(null);
  };

  const handleEdit = (workshop) => {
    setEditingId(workshop.id);
    const date = new Date(workshop.date_time);
    const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    setFormData({
      title: workshop.title,
      description: workshop.description,
      date_time: localIso,
      duration: workshop.duration_minutes,
      price: workshop.price / 100,
      instructor_name: workshop.instructor_name,
      thumbnail: workshop.thumbnail || "",
    });
    setThumbnailPreview(workshop.thumbnail || null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dateTimeISO = new Date(formData.date_time).toISOString();
      // Price is sent in Rupees, backend handles conversion to Paise
      const payload = { ...formData, date_time: dateTimeISO, price: formData.price };
      if (editingId) {
        await api.put(`/admin/workshops/${editingId}`, payload);
        toast.success("Workshop updated successfully!");
      } else {
        await api.post("/admin/workshops", payload);
        toast.success("Workshop created successfully!");
      }
      setDialogOpen(false);
      resetForm();
      fetchWorkshops();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save workshop");
    }
  };

  const handleDelete = async (workshopId) => {
    if (!window.confirm("Are you sure you want to delete this workshop?")) return;
    try {
      await api.delete(`/admin/workshops/${workshopId}`);
      toast.success("Workshop deleted");
      fetchWorkshops();
    } catch (error) {
      toast.error("Failed to delete workshop");
    }
  };

  const filteredWorkshops = workshops.filter(w =>
    w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workshops</h1>
          <p className="text-slate-500">Manage all your workshops here</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Create Workshop
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search workshops..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Workshop</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                 <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredWorkshops.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    {searchTerm ? "No matching workshops found" : "No workshops created yet"}
                  </td>
                </tr>
              ) : (
                filteredWorkshops.map((workshop) => (
                  <tr key={workshop.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/admin/workshops/${workshop.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {workshop.thumbnail ? (
                          <img src={workshop.thumbnail.startsWith('http') ? workshop.thumbnail : `${BACKEND_URL}${workshop.thumbnail}`} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {workshop.title[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{workshop.title}</div>
                          <div className="text-sm text-slate-500">{workshop.instructor_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex flex-col">
                        <span>{new Date(workshop.date_time).toLocaleDateString()}</span>
                        <span className="text-xs text-slate-400">{new Date(workshop.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-900">₹{workshop.price / 100}</span>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/admin/workshops/${workshop.id}`)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(workshop)} className="text-slate-500 hover:text-slate-700 hover:bg-slate-50" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(workshop.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Workshop" : "Create New Workshop"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Workshop Title *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_time">Date & Time *</Label>
                <Input id="date_time" type="datetime-local" value={formData.date_time} onChange={(e) => setFormData({ ...formData, date_time: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input id="duration" type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })} required min={15} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input id="price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} required min={0} />
              </div>
              <div>
                <Label htmlFor="instructor_name">Instructor Name *</Label>
                <Input id="instructor_name" value={formData.instructor_name} onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label htmlFor="thumbnail">Workshop Thumbnail</Label>
              <div className="mt-2">
                {thumbnailPreview ? (
                  <div className="relative">
                    <img src={thumbnailPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border" />
                    <button type="button" onClick={() => { setThumbnailPreview(null); setFormData({ ...formData, thumbnail: "" }); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="thumbnail-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {uploading ? <div className="animate-pulse text-slate-500">Uploading...</div> : (
                        <>
                          <Image className="w-10 h-10 mb-3 text-slate-400" />
                          <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span></p>
                          <p className="text-xs text-slate-400">PNG, JPG, WebP (max 5MB)</p>
                        </>
                      )}
                    </div>
                    <input id="thumbnail-upload" type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={uploading}>
              {uploading ? "Uploading..." : (editingId ? "Update Workshop" : "Create Workshop")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWorkshops;
