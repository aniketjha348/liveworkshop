import React, { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, Clock, Send, Save, Plus, X, Settings, Palette, Shield, Bell } from "lucide-react";
import { toast } from "sonner";

const AdminSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [activeTab, setActiveTab] = useState("email");
  const [settings, setSettings] = useState({
    reminder_hours: [24, 1],
    confirmation_subject: "Workshop Registration Confirmed! 🎉",
    reminder_subject_template: "Reminder: Workshop in {hours} hours!",
    send_confirmation: true,
    send_reminders: true,
    sender_email: "",
    sender_name: "",
  });
  const [newReminderHour, setNewReminderHour] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchSettings();
  }, [user, navigate]);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/admin/settings");
      const data = response.data;
      // Normalize data: backend sends reminder_hours_before (number), we want reminder_hours (array)
      if (data.reminder_hours_before && !data.reminder_hours) {
        data.reminder_hours = [data.reminder_hours_before];
      }
      setSettings({
        ...data,
        reminder_hours: data.reminder_hours || [24]
      });
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put("/admin/settings", settings);
      const data = response.data;
      // Normalize response like in fetchSettings
      if (data.reminder_hours_before && !data.reminder_hours) {
        data.reminder_hours = [data.reminder_hours_before];
      }
      setSettings({
        ...data,
        reminder_hours: data.reminder_hours || settings.reminder_hours || [24]
      });
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTest(true);
    try {
      const response = await api.post("/admin/settings/test-email", { email: user?.email });
      toast.success(`Test email sent to ${response.data.sent_to}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  };

  const addReminderHour = () => {
    const hours = parseInt(newReminderHour);
    if (isNaN(hours) || hours <= 0) {
      toast.error("Please enter a valid number of hours");
      return;
    }
    const currentHours = settings.reminder_hours || [];
    if (currentHours.includes(hours)) {
      toast.error("This reminder time already exists");
      return;
    }
    setSettings({
      ...settings,
      reminder_hours: [...currentHours, hours].sort((a, b) => b - a),
    });
    setNewReminderHour("");
  };

  const removeReminderHour = (hour) => {
    const currentHours = settings.reminder_hours || [];
    setSettings({
      ...settings,
      reminder_hours: currentHours.filter((h) => h !== hour),
    });
  };

  const tabs = [
    { id: "email", label: "Email", icon: Mail },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="text-slate-600">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage your application settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px overflow-x-auto" aria-label="Settings tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Email Settings Tab */}
          {activeTab === "email" && (
            <div className="space-y-6">
              {/* Reminder Configuration */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-blue-100 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Reminder Timing</h2>
                    <p className="text-sm text-slate-500">
                      Set when to send reminder emails before workshops
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.send_reminders}
                      onChange={(e) =>
                        setSettings({ ...settings, send_reminders: e.target.checked })
                      }
                      className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Enable email reminders</span>
                  </label>

                  {settings.send_reminders && (
                    <>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(settings.reminder_hours || []).map((hour) => {
                          const isMinutes = hour < 1;
                          const displayValue = isMinutes ? Math.round(hour * 60) : hour;
                          const unit = isMinutes ? "minutes" : (displayValue === 1 ? "hour" : "hours");
                          
                          return (
                            <div
                              key={hour}
                              className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium"
                            >
                              <Clock className="w-4 h-4" />
                              <span>
                                {displayValue} {unit} before
                              </span>
                              <button
                                onClick={() => removeReminderHour(hour)}
                                className="ml-1 text-blue-500 hover:text-blue-700 hover:bg-blue-200 rounded p-0.5"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 mt-4 items-end">
                        <div className="w-32">
                          <Input
                            type="number"
                            placeholder="Value"
                            value={newReminderHour}
                            onChange={(e) => setNewReminderHour(e.target.value)}
                            min="0"
                            step="any"
                          />
                        </div>
                        <div className="w-32">
                           <select 
                             className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                             id="unit-selector"
                             defaultValue="hours"
                           >
                              <option value="hours">Hours</option>
                              <option value="minutes">Minutes</option>
                           </select>
                        </div>
                        <Button variant="outline" onClick={() => {
                           const unit = document.getElementById('unit-selector').value;
                           const val = parseFloat(newReminderHour);
                           if (isNaN(val) || val <= 0) {
                             toast.error("Invalid number");
                             return;
                           }
                           
                           // Convert to hours
                           let hourValue = val;
                           if (unit === 'minutes') {
                             hourValue = val / 60;
                           }
                           
                           // Round to reasonable precision to avoid 0.25000001
                           hourValue = parseFloat(hourValue.toFixed(4));

                           const currentHours = settings.reminder_hours || [];
                           if (currentHours.includes(hourValue)) {
                             toast.error("Reminder already exists");
                             return;
                           }
                           
                           setSettings({
                             ...settings,
                             reminder_hours: [...currentHours, hourValue].sort((a, b) => b - a),
                           });
                           setNewReminderHour("");
                        }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Email Content */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-green-100 rounded-lg">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Email Content</h2>
                    <p className="text-sm text-slate-500">
                      Customize email subjects and sender info
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.send_confirmation}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          send_confirmation: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Send confirmation email on registration
                    </span>
                  </label>

                  <div>
                    <Label htmlFor="confirmation_subject" className="text-slate-700">
                      Confirmation Email Subject
                    </Label>
                    <Input
                      id="confirmation_subject"
                      value={settings.confirmation_subject}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          confirmation_subject: e.target.value,
                        })
                      }
                      placeholder="Workshop Registration Confirmed! 🎉"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reminder_subject_template" className="text-slate-700">
                      Reminder Email Subject Template
                    </Label>
                    <Input
                      id="reminder_subject_template"
                      value={settings.reminder_subject_template}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          reminder_subject_template: e.target.value,
                        })
                      }
                      placeholder="Reminder: Workshop in {hours} hours!"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-slate-500 mt-1.5">
                      Use <code className="bg-slate-200 px-1 py-0.5 rounded">{"{hours}"}</code> as placeholder for hours remaining
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sender_name" className="text-slate-700">Sender Name (optional)</Label>
                      <Input
                        id="sender_name"
                        value={settings.sender_name || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, sender_name: e.target.value })
                        }
                        placeholder="WorkshopFlow"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sender_email" className="text-slate-700">Sender Email (optional)</Label>
                      <Input
                        id="sender_email"
                        type="email"
                        value={settings.sender_email || ""}
                        onChange={(e) =>
                          setSettings({ ...settings, sender_email: e.target.value })
                        }
                        placeholder="noreply@example.com"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Email */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-purple-100 rounded-lg">
                    <Send className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Test Email</h2>
                    <p className="text-sm text-slate-500">
                      Send a test email to verify your configuration
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSendTestEmail}
                  disabled={sendingTest}
                  variant="outline"
                  className="bg-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingTest ? "Sending..." : "Send Test Email to Me"}
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Tab (Placeholder) */}
          {activeTab === "notifications" && (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700">Notification Settings</h3>
              <p className="text-slate-500 mt-1">Coming soon...</p>
            </div>
          )}

          {/* Appearance Tab (Placeholder) */}
          {activeTab === "appearance" && (
            <div className="text-center py-16">
              <Palette className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700">Appearance Settings</h3>
              <p className="text-slate-500 mt-1">Coming soon...</p>
            </div>
          )}

          {/* Security Tab (Placeholder) */}
          {activeTab === "security" && (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700">Security Settings</h3>
              <p className="text-slate-500 mt-1">Coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Button - Only show for email tab */}
      {activeTab === "email" && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg shadow-blue-200">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
