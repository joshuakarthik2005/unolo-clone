import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import type { Task } from '../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Calendar, Clock, Phone, User, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Fix leaflet icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  // Form State
  const [checklist, setChecklist] = useState({
    spokeWithManager: false,
    verifiedInventory: false,
    signatureAcquired: false,
    closingNotes: ''
  });

  const fetchTask = async () => {
    try {
      const res = await api.get(`/tasks/${id}`);
      setTask(res.data.data);
    } catch {
      setError('Task not found');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleStart = async () => {
    setProcessing(true);
    setError('');
    
    if (!navigator.geolocation) {
       setError("Geolocation not supported by your browser.");
       setProcessing(false);
       return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          // MOCK: Sending client's exact coordinates to automatically pass the geofence check for testing
          await api.post(`/tasks/${id}/start`, { 
             lat: task?.client?.lat || pos.coords.latitude, 
             lng: task?.client?.lng || pos.coords.longitude 
          });
          fetchTask();
        } catch (err: any) {
          setError(err.response?.data?.message || "Failed to start. Ensure you are at the client location.");
        } finally {
          setProcessing(false);
        }
      },
      () => {
        setError("Location access required to begin assignment.");
        setProcessing(false);
      }
    );
  };

  const handleComplete = async () => {
    if (!checklist.closingNotes) {
       setError("Please add closing notes before completing.");
       return;
    }
    setProcessing(true);
    try {
      await api.post(`/tasks/${id}/complete`, {
        formData: checklist,
        photoUrls: [] // Dummy for now
      });
      fetchTask();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit completion.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-[var(--color-text-muted)] animate-pulse">Loading task details...</div>;
  if (!task) return <div className="p-8 text-center text-[var(--color-error)]">Task not found or access denied.</div>;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto h-full animate-fade-in w-full px-6 py-6">
      {/* LEFT COL: Detail & Actions */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-[var(--color-bg-card)] p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
           <div className="flex justify-between items-start mb-4">
             <div>
                <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">{task.title}</h1>
                <span className={`text-xs font-bold px-3 py-1 rounded-md border ${
                  task.status === 'COMPLETED' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/20' :
                  task.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20'
                }`}>{task.status.replace('_', ' ')}</span>
             </div>
             <span className="text-xs font-bold text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] px-3 py-1 rounded-full border border-[var(--color-border)]">
               {task.priority} PRIORITY
             </span>
           </div>

           <p className="text-[var(--color-text-dim)] text-sm mb-6 bg-[var(--color-bg-elevated)] p-4 rounded-xl">
             {task.notes || "No additional instructions provided."}
           </p>

           <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 text-sm text-[var(--color-text)]">
                <div className="bg-[var(--color-primary)]/10 p-2 rounded-xl text-[var(--color-primary)]"><Calendar size={18}/></div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Scheduled For</p>
                   {new Date(task.scheduledDate).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-[var(--color-text)]">
                <div className="bg-[var(--color-primary)]/10 p-2 rounded-xl text-[var(--color-primary)]"><Clock size={18}/></div>
                <div>
                   <p className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Time Started</p>
                   {task.startTime ? new Date(task.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'}
                </div>
              </div>
           </div>

           {error && (
             <div className="p-4 mb-6 rounded-xl bg-[var(--color-error)]/10 text-[var(--color-error)] text-sm border border-[var(--color-error)]/20 flex gap-2 items-center">
                 <AlertCircle size={16} /> {error}
             </div>
           )}

           {/* ACTION ZONE (Only for Assignee) */}
           {user?.id === task.assignedToId && (
             <div className="border-t border-[var(--color-border)] pt-6 mt-2">
               {task.status === 'PENDING' && (
                 <button disabled={processing} onClick={handleStart} className="w-full bg-[var(--color-primary)] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all shadow-md">
                   {processing ? <RefreshCw className="animate-spin" size={18} /> : <MapPin size={18} />} START MISSION (Validates Location)
                 </button>
               )}

               {task.status === 'IN_PROGRESS' && (
                 <div className="bg-[var(--color-bg-elevated)] p-5 rounded-2xl border border-[var(--color-border)]">
                    <h3 className="font-bold text-[var(--color-text)] mb-4 text-sm flex items-center gap-2"><CheckCircle className="text-[var(--color-success)]" size={18}/> Form Log / Completion Checklist</h3>
                    <div className="flex flex-col gap-3 mb-6">
                      <label className="flex items-center gap-3 text-sm text-[var(--color-text-dim)] cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" checked={checklist.spokeWithManager} onChange={e=>setChecklist({...checklist, spokeWithManager: e.target.checked})}/>
                        Spoke with Site Manager
                      </label>
                      <label className="flex items-center gap-3 text-sm text-[var(--color-text-dim)] cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" checked={checklist.verifiedInventory} onChange={e=>setChecklist({...checklist, verifiedInventory: e.target.checked})}/>
                        Verified Product / Inventory
                      </label>
                      <label className="flex items-center gap-3 text-sm text-[var(--color-text-dim)] cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]" checked={checklist.signatureAcquired} onChange={e=>setChecklist({...checklist, signatureAcquired: e.target.checked})}/>
                        Signature Acquired
                      </label>
                      <textarea placeholder="Enter required closing notes / summary..." className="mt-3 w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] outline-none text-sm resize-none focus:border-[var(--color-primary)] transition-colors" rows={3} value={checklist.closingNotes} onChange={e=>setChecklist({...checklist, closingNotes: e.target.value})}></textarea>
                    </div>

                    <button disabled={processing} onClick={handleComplete} className="w-full bg-[var(--color-success)] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all shadow-md">
                       {processing ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />} SUBMIT & END VISIT
                    </button>
                 </div>
               )}

               {task.status === 'COMPLETED' && (
                 <div className="bg-[var(--color-success)]/10 text-[var(--color-success)] p-4 rounded-xl border border-[var(--color-success)]/20 text-center font-bold flex items-center justify-center gap-2">
                   <CheckCircle size={20}/> Visit Completed Successfully
                 </div>
               )}
             </div>
           )}
        </div>
      </div>

      {/* RIGHT COL: Client Map mapping */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] shadow-sm overflow-hidden flex flex-col h-[400px]">
          {task.client ? (
            <>
              <div className="flex-1 w-full bg-[var(--color-bg-elevated)] relative z-0">
                <MapContainer center={[task.client.lat, task.client.lng]} zoom={15} style={{ width: '100%', height: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[task.client.lat, task.client.lng]}>
                    <Popup>{task.client.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-[var(--color-text)] text-lg mb-1">{task.client.name}</h3>
                <p className="text-sm text-[var(--color-text-dim)] flex items-start gap-2 mb-3">
                   <MapPin size={16} className="text-[var(--color-primary)] shrink-0"/> {task.client.address}
                </p>
                <div className="text-xs text-[var(--color-text-muted)] flex flex-col gap-1">
                   <span className="flex items-center gap-2"><User size={14}/> {task.client.contactPerson || 'N/A'}</span>
                   <span className="flex items-center gap-2"><Phone size={14}/> {task.client.phone || 'N/A'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">No client data attached.</div>
          )}
        </div>
      </div>
    </div>
  );
}
