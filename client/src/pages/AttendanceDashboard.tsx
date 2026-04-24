import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { AttendanceRecord, Site } from '../types';
import { MapPin, Clock, Camera, CheckCircle } from 'lucide-react';

export default function AttendanceDashboard() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [sites, setSites] = useState<Site[]>([]);

  // We are using a dummy selfie URL for this phase as per discussion.
  const DUMMY_SELFIE = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100";

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [dailyRes, logsRes, sitesRes] = await Promise.all([
        api.get('/attendance/daily-status'),
        api.get('/attendance/logs'),
        api.get('/sites')
      ]);
      setTodayRecord(dailyRes.data.data);
      setLogs(logsRes.data.data);
      setSites(sitesRes.data.data);
    } catch (err) {
      console.error("Failed to load attendance", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handlePunch = async (type: 'in' | 'out') => {
    if (processing) return;
    setError('');
    setProcessing(true);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setProcessing(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const payload = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            ...(type === 'in' ? { selfieUrl: DUMMY_SELFIE } : {})
          };

          const endpoint = type === 'in' ? '/attendance/punch-in' : '/attendance/punch-out';
          await api.post(endpoint, payload);
          fetchAttendance(); // Refresh statuses
        } catch (err: any) {
          setError(err.response?.data?.message || `Failed to punch ${type}.`);
        } finally {
          setProcessing(false);
        }
      },
      () => {
        setError(`Location access denied. Please allow location to punch ${type}.`);
        setProcessing(false);
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto h-full overflow-y-auto w-full px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Attendance Log</h1>
          <p className="text-sm text-[var(--color-text-dim)]">Track daily presence and time entries.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 text-[var(--color-error)] text-sm flex items-center gap-2">
          {error}
        </div>
      )}

      {/* Field Employee Action Panel */}
      {user?.role === 'FIELD_EMPLOYEE' && (
        <div className="bg-[var(--color-bg-card)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Status Visuals */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {todayRecord ? (
                   <img src={todayRecord.selfieUrl || DUMMY_SELFIE} alt="Punch In Selfie" className="w-20 h-20 rounded-full object-cover border-4 border-[var(--color-success)]/30" />
                ) : (
                   <div className="w-20 h-20 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center border border-[var(--color-border)]">
                      <Camera className="text-[var(--color-text-muted)] opacity-50" size={32} />
                   </div>
                )}
                {todayRecord && !todayRecord.punchOutTime && (
                   <div className="absolute -bottom-1 -right-1 bg-[var(--color-success)] w-6 h-6 rounded-full border-2 border-[var(--color-bg-card)] flex items-center justify-center">
                      <CheckCircle size={14} color="white" />
                   </div>
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text)]">
                  {todayRecord ? 'Clocked In' : 'Not Clocked In'}
                </h3>
                <p className="text-sm text-[var(--color-text-dim)] flex items-center gap-1 mt-1">
                  <MapPin size={14} /> Assigned Base: {sites.length > 0 ? sites[0].name : "Checking..."}
                </p>
                {todayRecord && (
                  <p className="text-sm font-medium text-[var(--color-primary)] mt-1">
                    Punch In: {new Date(todayRecord.punchInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 justify-center">
              {!todayRecord ? (
                <button
                  onClick={() => handlePunch('in')}
                  disabled={processing}
                  className={`w-full relative overflow-hidden bg-[var(--color-success)] text-white py-4 px-6 rounded-xl font-bold flex flex-col items-center justify-center shadow-lg transition-all ${processing ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 active:scale-95 group'}`}
                >
                  <span className="flex items-center gap-2 text-lg"><Clock size={20} /> {processing ? 'PUNCHING IN...' : 'PUNCH IN NOW'}</span>
                  <span className="text-xs font-normal opacity-80 mt-1">Requires Geolocation & Selfie</span>
                </button>
              ) : !todayRecord.punchOutTime ? (
                <button
                  onClick={() => handlePunch('out')}
                  disabled={processing}
                  className={`w-full relative overflow-hidden bg-[var(--color-error)] text-white py-4 px-6 rounded-xl font-bold flex flex-col items-center justify-center shadow-lg transition-all ${processing ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 active:scale-95 group'}`}
                >
                  <span className="flex items-center gap-2 text-lg"><Clock size={20} /> {processing ? 'PUNCHING OUT...' : 'PUNCH OUT'}</span>
                  <span className="text-xs font-normal opacity-80 mt-1">Ends your day log</span>
                </button>
              ) : (
                 <div className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] py-4 px-6 rounded-xl font-bold flex flex-col items-center justify-center">
                    <span className="text-lg">Shift Completed</span>
                    <span className="text-sm font-medium opacity-70 mt-1">Total: {todayRecord.totalHours?.toFixed(1)} hrs</span>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historical Monthly Logs */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-sm flex-1">
        <div className="px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-text)] text-lg">Monthly Records</h2>
        </div>
        <div className="w-full overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="p-8 text-center text-[var(--color-text-muted)]">Loading log...</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-[var(--color-bg-elevated)] text-[var(--color-text-dim)] uppercase text-xs tracking-wider border-b border-[var(--color-border)]">
                  <th className="px-6 py-4 font-medium">Date</th>
                  {['ADMIN', 'MANAGER'].includes(user?.role || '') && <th className="px-6 py-4 font-medium">Employee</th>}
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Punch In</th>
                  <th className="px-6 py-4 font-medium">Punch Out</th>
                  <th className="px-6 py-4 font-medium">Total Hours</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.length > 0 ? logs.map(log => (
                  <tr key={log.id} className="border-b border-[var(--color-border)] hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-[var(--color-text)] font-medium">
                      {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric'})}
                    </td>
                    {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
                      <td className="px-6 py-4 text-[var(--color-text)] font-medium">
                        {log.user?.name || '--'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold border
                        ${log.status === 'PRESENT' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20' : ''}
                        ${log.status === 'LATE' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : ''}
                        ${log.status === 'ABSENT' ? 'bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/20' : ''}
                        ${!['PRESENT', 'LATE', 'ABSENT'].includes(log.status) ? 'bg-gray-500/10 text-gray-500 border-gray-500/20' : ''}
                      `}>
                        {log.status === 'LATE' ? "LATE" : log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-dim)]">
                       {new Date(log.punchInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-dim)]">
                       {log.punchOutTime ? new Date(log.punchOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) : '--'}
                    </td>
                    <td className="px-6 py-4 text-[var(--color-text-dim)]">
                       {log.totalHours ? `${log.totalHours.toFixed(1)} hrs` : '--'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No records found for this month.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
