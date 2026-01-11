import React, { useEffect, useState } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { CheckCircle, Clock, Search, AlertCircle, Check } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Verification State
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyId, setVerifyId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get("/admin/transactions");
      setTransactions(response.data);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyId) return;
    setVerifying(true);
    setVerificationResult(null);
    try {
        const res = await api.post("/admin/payments/lookup", { reference_id: verifyId });
        setVerificationResult(res.data);
    } catch (error) {
        toast.error(error.response?.data?.detail || "Verification failed");
        setVerificationResult(null);
    } finally {
        setVerifying(false);
    }
  };

  const handleEnrollFromVerification = async () => {
      if (!verificationResult || !verificationResult.email || !verificationResult.workshop_id) return;
      try {
           await api.post(`/admin/workshops/${verificationResult.workshop_id}/enroll`, {
               email: verificationResult.email
           });
           toast.success("User enrolled successfully!");
           setVerifyDialogOpen(false);
           fetchTransactions(); 
      } catch (error) {
          toast.error(error.response?.data?.detail || "Failed to enroll");
      }
  };

  const filtered = transactions.filter(
    (tx) =>
      tx.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.workshop_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) return <div className="p-8 text-center">Loading transactions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
         <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-600">Total Revenue: <span className="font-semibold text-green-600">₹{totalRevenue / 100}</span></p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* Verify Button */}
            <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 border-dashed border-slate-300 text-slate-600">
                        <Search className="w-4 h-4" />
                        Verify External Payment
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verify Stripe Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Transaction ID (cs_... or pi_...)</Label>
                            <div className="flex gaps-2">
                                <Input 
                                    value={verifyId} 
                                    onChange={(e) => setVerifyId(e.target.value)} 
                                    placeholder="e.g. cs_test_a1b2c3..."
                                    className="rounded-r-none"
                                />
                                <Button onClick={handleVerify} disabled={!verifyId || verifying} className="rounded-l-none">
                                    {verifying ? "Checking..." : "Check"}
                                </Button>
                            </div>
                        </div>

                        {verificationResult && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Status:</span>
                                    <span className={`font-medium ${(verificationResult.payment_status || verificationResult.status) === 'paid' || (verificationResult.payment_status || verificationResult.status) === 'captured' ? 'text-green-600' : 'text-amber-600'}`}>
                                        {(verificationResult.payment_status || verificationResult.status || "UNKNOWN").toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Amount:</span>
                                    <span className="font-medium">₹{verificationResult.amount / 100}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Email:</span>
                                    <span className="font-medium">{verificationResult.email || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Workshop:</span>
                                    <span className="font-medium">{verificationResult.workshop_title || "ID: " + verificationResult.workshop_id}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                                    <span className="text-slate-500">Database Record:</span>
                                    {verificationResult.recorded_in_db ? (
                                        <span className="flex items-center text-green-600 gap-1 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                                            <CheckCircle className="w-3 h-3" /> Found
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-red-500 gap-1 bg-red-50 px-2 py-1 rounded-full text-xs font-medium">
                                            <AlertCircle className="w-3 h-3" /> Missing
                                        </span>
                                    )}
                                </div>

                                {!verificationResult.recorded_in_db && verificationResult.payment_status === 'paid' && verificationResult.workshop_id && (
                                    <Button onClick={handleEnrollFromVerification} className="w-full mt-2 bg-green-600 hover:bg-green-700">
                                        <Check className="w-4 h-4 mr-2" />
                                        Fix & Enroll User Now
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="w-full sm:w-64">
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Workshop</th>
                <th className="px-6 py-4 font-semibold text-slate-700">User</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filtered.map((tx, index) => (
                  <tr key={index} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">{tx.workshop_title}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{tx.user_name}</div>
                      <div className="text-xs text-slate-500">{tx.user_email}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">₹{tx.amount / 100}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === "completed" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
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

export default AdminTransactions;
