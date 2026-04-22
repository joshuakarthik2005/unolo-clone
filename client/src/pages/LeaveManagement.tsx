import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { LeaveRequest } from '../types';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

export default function LeaveManagement() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [balRes, reqsRes] = await Promise.all([
        api.get('/leaves/balances'),
        api.get('/leaves/requests')
      ]);
      setBalances(balRes.data.data);
      setRequests(reqsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/leaves/request', formData);
      setShowModal(false);
      fetchData();
      alert("Leave requested successfully.");
    } catch (err) {
      console.error("Failed", err);
      alert("Failed to submit request.");
    }
  };

  const handleRespond = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.put(`/leaves/request/${id}/respond`, { status });
      fetchData();
    } catch(err) {
      alert("Failed to process action.");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto h-full px-6 py-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Leave Management</h1>
        </div>
        {user?.role === 'FIELD_EMPLOYEE' && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl font-medium transition-transform hover:-translate-y-0.5 active:scale-95 text-sm"
          >
            Apply for Leave
          </button>
        )}
      </div>

      {user?.role === 'FIELD_EMPLOYEE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {balances.map(b => (
            <div key={b.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-3 text-[var(--color-text-dim)] font-medium mb-4">
                <Calendar size={18} /> {b.name}
              </div>
              <div className="text-3xl font-bold text-[var(--color-text)]">{b.remaining}</div>
              <div className="text-sm mt-1 text-[var(--color-text-muted)]">Remaining out of {b.total} days</div>
              
              {/* Progress bar */}
              <div className="mt-4 h-2 w-full bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-primary)]" 
                  style={{ width: `${(b.taken / b.total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm flex-1 mb-10">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] text-lg">Leave Requests</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-[var(--color-text-muted)]">Loading requests...</div>
        ) : (
          <div className="w-full overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-[var(--color-bg-elevated)] text-[var(--color-text-dim)] uppercase text-xs tracking-wider border-b border-[var(--color-border)]">
                  {['ADMIN', 'MANAGER'].includes(user?.role || '') && <th className="px-6 py-4 font-medium">Employee</th>}
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Dates</th>
                  <th className="px-6 py-4 font-medium">Reason</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  {['ADMIN', 'MANAGER'].includes(user?.role || '') && <th className="px-6 py-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {requests.length > 0 ? requests.map(req => (
                  <tr key={req.id} className="border-b border-[var(--color-border)] hover:bg-white/5 transition-colors">
                    {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
                      <td className="px-6 py-4 font-medium text-[var(--color-text)]">{req.user?.name}</td>
                    )}
                    <td className="px-6 py-4 text-[var(--color-text-dim)]">{req.leaveType.name}</td>
                    <td className="px-6 py-4 text-[var(--color-text-dim)] whitespace-nowrap">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-dim)] max-w-[200px] truncate">{req.reason}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold border
                        ${req.status === 'APPROVED' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20' : ''}
                        ${req.status === 'PENDING' ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20' : ''}
                        ${req.status === 'REJECTED' ? 'bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20' : ''}
                      `}>
                        {req.status}
                      </span>
                    </td>
                    {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
                      <td className="px-6 py-4 text-right">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={() => handleRespond(req.id, 'APPROVED')} className="text-[var(--color-success)] hover:bg-[var(--color-success)]/10 p-1.5 rounded-lg transition-colors">
                               <CheckCircle size={18} />
                             </button>
                             <button onClick={() => handleRespond(req.id, 'REJECTED')} className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10 p-1.5 rounded-lg transition-colors">
                               <XCircle size={18} />
                             </button>
                          </div>
                        ) : '--'}
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No leave requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="absolute inset-0" onClick={() => setShowModal(false)} />
           <div className="w-full max-w-lg bg-[var(--color-bg-card)] rounded-2xl p-6 relative z-10 animate-fade-in border border-[var(--color-border)] shadow-xl overflow-visible">
              <h2 className="text-xl font-bold text-[var(--color-text)] mb-4">Apply for Leave</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-dim)] mb-1">Leave Type</label>
                  <select 
                    required
                    value={formData.leaveTypeId}
                    onChange={e => setFormData({...formData, leaveTypeId: e.target.value})}
                    className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors"
                  >
                    <option value="">Select Type</option>
                    {balances.map(b => (
                      <option key={b.id} value={b.id}>{b.name} (Bal: {b.remaining})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-sm font-medium text-[var(--color-text-dim)] mb-1">Start Date</label>
                      <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                         className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-[var(--color-text-dim)] mb-1">End Date</label>
                      <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                         className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none" />
                   </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-dim)] mb-1">Reason</label>
                  <textarea 
                    required
                    rows={3}
                    value={formData.reason}
                    onChange={e => setFormData({...formData, reason: e.target.value})}
                    className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-4 w-full">
                   <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-[var(--color-text-dim)] hover:bg-white/5 font-medium transition-colors">Cancel</button>
                   <button type="submit" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-xl font-bold hover:-translate-y-0.5 active:scale-95 transition-all shadow-md shadow-[var(--color-primary)]/20">Submit Request</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
