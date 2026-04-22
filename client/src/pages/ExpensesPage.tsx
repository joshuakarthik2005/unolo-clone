import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { ExpenseClaim } from '../types';
import { Plus, Receipt, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function ExpensesPage() {
  const { user } = useAuth();
  const isManager = ['ADMIN', 'MANAGER'].includes(user?.role || '');

  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  
  // Submission Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'FUEL' as const,
    amount: '',
    claimedDistance: '',
    billUrl: 'dummy_bill.jpg'
  });

  // Approval Form State
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseClaim | null>(null);
  const [managerNote, setManagerNote] = useState('');

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/expenses');
      setExpenses(res.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', formData);
      setShowSubmissionModal(false);
      setFormData({ date: new Date().toISOString().split('T')[0], type: 'FUEL', amount: '', claimedDistance: '', billUrl: 'dummy_bill.jpg' });
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit expense.");
    }
  };

  const handleUpdateStatus = async (expenseId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.put(`/expenses/${expenseId}/status`, { status, managerNote });
      setShowApprovalModal(false);
      setManagerNote('');
      fetchExpenses();
    } catch {
      alert("Failed to update status.");
    }
  };

  const renderStatus = (status: string) => {
    switch(status) {
      case 'APPROVED': return <span className="bg-[var(--color-success)]/10 text-[var(--color-success)] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> Approved</span>;
      case 'REJECTED': return <span className="bg-[var(--color-error)]/10 text-[var(--color-error)] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={14}/> Rejected</span>;
      default: return <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">Pending</span>;
    }
  };

  const checkDiscrepancy = (expense: ExpenseClaim) => {
    if (expense.type !== 'FUEL' || !expense.claimedDistance) return false;
    // Discrepancy if claimed > actual by more than 10%
    const actual = expense.actualDistance || 0;
    return expense.claimedDistance > (actual * 1.1);
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto h-full px-6 py-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Expense Management</h1>
        {!isManager && (
          <button 
            onClick={() => setShowSubmissionModal(true)}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all text-sm whitespace-nowrap shrink-0"
          >
            <Plus size={16} /> New Claim
          </button>
        )}
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex-1 overflow-y-auto">
         {loading ? <div className="text-center p-8 text-[var(--color-text-muted)]">Loading expenses...</div> : (
           <div className="w-full overflow-x-auto">
             <table className="w-full text-left min-w-[800px]">
                <thead>
                  <tr className="text-sm text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                    <th className="pb-3 px-4 font-medium">Date</th>
                    {isManager && <th className="pb-3 px-4 font-medium">Employee</th>}
                    <th className="pb-3 px-4 font-medium">Type</th>
                    <th className="pb-3 px-4 font-medium">Amount</th>
                    <th className="pb-3 px-4 font-medium">Distance claimed vs actual</th>
                    <th className="pb-3 px-4 font-medium">Status</th>
                    <th className="pb-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                     <tr><td colSpan={7} className="text-center p-8 text-[var(--color-text-dim)]">No expense claims found.</td></tr>
                  ) : expenses.map(expense => (
                    <tr key={expense.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] transition-colors">
                      <td className="py-4 px-4 text-[var(--color-text)] text-sm">{expense.date}</td>
                      {isManager && <td className="py-4 px-4 text-[var(--color-text)] text-sm font-medium">{expense.user?.name}</td>}
                      <td className="py-4 px-4 text-[var(--color-text)] text-sm font-bold">{expense.type}</td>
                      <td className="py-4 px-4 text-[var(--color-text)] text-sm">₹{expense.amount.toFixed(2)}</td>
                      <td className="py-4 px-4">
                        {expense.type === 'FUEL' ? (
                           <div className="flex flex-col gap-1">
                             <div className="text-sm font-medium text-[var(--color-text)]">{expense.claimedDistance} km claimed</div>
                             <div className="text-xs text-[var(--color-text-dim)]">{expense.actualDistance || 0} km GPS tracked</div>
                             {checkDiscrepancy(expense) && (
                                <div className="text-xs text-orange-500 flex items-center gap-1 font-bold mt-1 bg-orange-500/10 px-2 py-0.5 rounded w-max">
                                  <AlertTriangle size={12}/> HIGH DISCREPANCY
                                </div>
                             )}
                           </div>
                        ) : (
                          <span className="text-[var(--color-text-dim)] text-sm">--</span>
                        )}
                      </td>
                      <td className="py-4 px-4">{renderStatus(expense.status)}</td>
                      <td className="py-4 px-4 text-right">
                         {isManager && expense.status === 'PENDING' ? (
                            <button 
                              onClick={() => { setSelectedExpense(expense); setManagerNote(''); setShowApprovalModal(true); }}
                              className="text-sm font-bold text-[var(--color-primary)] hover:underline"
                            >
                              Review
                            </button>
                         ) : (
                            <span className="text-xs text-[var(--color-text-dim)] truncate max-w-[150px] inline-block">{expense.managerNote || 'No notes'}</span>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
         )}
      </div>

      {/* NEW CLAIM MODAL */}
      {showSubmissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="absolute inset-0" onClick={() => setShowSubmissionModal(false)} />
           <div className="bg-[var(--color-bg-card)] rounded-2xl w-full max-w-lg p-6 relative z-10 animate-fade-in shadow-xl border border-[var(--color-border)] overflow-visible">
              <h2 className="text-xl font-bold mb-4 text-[var(--color-text)] flex items-center gap-2"><Receipt className="text-[var(--color-primary)]"/> New Expense Claim</h2>
              <form onSubmit={handleSubmitExpense} className="flex flex-col gap-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Date</label>
                      <input type="date" required className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" 
                             value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Expense Type</label>
                      <select required className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                         <option value="FUEL">Fuel & Travel</option>
                         <option value="FOOD">Food & Meals</option>
                         <option value="OTHER">Other Expenses</option>
                      </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Amount (₹)</label>
                      <input type="number" step="0.01" required placeholder="0.00" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" 
                             value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    </div>
                    {formData.type === 'FUEL' && (
                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Claimed Distance (km)</label>
                        <input type="number" step="0.1" required placeholder="0.0" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" 
                               value={formData.claimedDistance} onChange={e => setFormData({...formData, claimedDistance: e.target.value})} />
                      </div>
                    )}
                 </div>

                 <div>
                    <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Upload Bill / Receipt Photo</label>
                    <div className="border border-dashed border-[var(--color-border)] rounded-xl p-6 text-center text-[var(--color-text-muted)] text-sm">
                       Uploads mocked for this phase. <br/> (Mock file: <strong>{formData.billUrl}</strong> attached)
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 mt-4 w-full">
                    <button type="button" onClick={() => setShowSubmissionModal(false)} className="px-4 py-2 rounded-xl text-[var(--color-text-dim)] font-medium hover:bg-white/5 transition-colors">Cancel</button>
                    <button type="submit" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-xl font-bold shadow-md hover:-translate-y-0.5 active:scale-95 transition-all">Submit Claim</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* APPROVAL MODAL (MANAGER ONLY) */}
      {showApprovalModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="absolute inset-0" onClick={() => setShowApprovalModal(false)} />
           <div className="bg-[var(--color-bg-card)] rounded-2xl w-full max-w-lg p-6 relative z-10 animate-fade-in shadow-xl border border-[var(--color-border)] overflow-visible">
              <h2 className="text-xl font-bold mb-4 text-[var(--color-text)] flex items-center gap-2">Review Expense Claim</h2>
              
              <div className="bg-[var(--color-bg-elevated)] p-4 rounded-xl mb-4 text-sm text-[var(--color-text)] flex flex-col gap-2">
                 <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                   <span className="text-[var(--color-text-dim)]">Employee</span>
                   <span className="font-bold">{selectedExpense.user?.name}</span>
                 </div>
                 <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                   <span className="text-[var(--color-text-dim)]">Date & Type</span>
                   <span className="font-bold">{selectedExpense.date} — {selectedExpense.type}</span>
                 </div>
                 <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                   <span className="text-[var(--color-text-dim)]">Claim Amount</span>
                   <span className="font-bold text-lg text-[var(--color-primary)]">₹{selectedExpense.amount.toFixed(2)}</span>
                 </div>
                 {selectedExpense.type === 'FUEL' && (
                   <div className="flex justify-between border-b border-[var(--color-border)] pb-2">
                     <span className="text-[var(--color-text-dim)]">Distance</span>
                     <div className="text-right">
                       <div className="font-bold">{selectedExpense.claimedDistance} km claimed</div>
                       <div className="text-xs text-[var(--color-text-muted)]">{selectedExpense.actualDistance || 0} km GPS tracked</div>
                       {checkDiscrepancy(selectedExpense) && (
                         <div className="text-[10px] text-orange-500 font-bold uppercase mt-1">Discrepancy flag</div>
                       )}
                     </div>
                   </div>
                 )}
                 <div className="flex justify-between pt-1">
                   <span className="text-[var(--color-text-dim)]">Receipt</span>
                   <a href="#" className="font-bold text-[var(--color-primary)] hover:underline truncate w-32 text-right">{selectedExpense.billUrl}</a>
                 </div>
              </div>

              <div className="mb-4">
                 <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Manager Notes (optional)</label>
                 <textarea rows={2} className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)] resize-none" 
                           value={managerNote} onChange={e => setManagerNote(e.target.value)}></textarea>
              </div>

              <div className="flex justify-between gap-3 mt-4 w-full">
                 <button onClick={() => setShowApprovalModal(false)} className="px-4 py-2 rounded-xl text-[var(--color-text-dim)] font-medium hover:bg-white/5 transition-colors">Cancel</button>
                 <div className="flex gap-2">
                    <button onClick={() => handleUpdateStatus(selectedExpense.id, 'REJECTED')} className="bg-[var(--color-error)]/10 text-[var(--color-error)] px-6 py-2 rounded-xl font-bold hover:bg-[var(--color-error)]/20 transition-all">Reject</button>
                    <button onClick={() => handleUpdateStatus(selectedExpense.id, 'APPROVED')} className="bg-[var(--color-success)] text-white px-6 py-2 rounded-xl font-bold shadow-md hover:-translate-y-0.5 active:scale-95 transition-all">Approve</button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
