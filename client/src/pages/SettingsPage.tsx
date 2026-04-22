import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Building, MapPin, Shield, Check, Plus, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sites');
  
  const [sites, setSites] = useState<any[]>([]);
  const [newSite, setNewSite] = useState({ name: '', lat: '', lng: '', radius: '100' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if(activeTab === 'sites') fetchSites();
  }, [activeTab]);

  const fetchSites = async () => {
    try {
       const res = await api.get('/sites');
       setSites(res.data.data);
    } catch {}
  };

  const handleAddSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if(user?.role !== 'ADMIN' && user?.role !== 'MANAGER') return alert("Unauthorized");
    setLoading(true);
    try {
       await api.post('/sites', {
           name: newSite.name,
           lat: parseFloat(newSite.lat),
           lng: parseFloat(newSite.lng),
           radius: parseInt(newSite.radius)
       });
       setNewSite({ name: '', lat: '', lng: '', radius: '100' });
       fetchSites();
    } catch {
       alert("Failed to add site");
    }
    setLoading(false);
  };

  const handleDeleteSite = async (id: string) => {
    if(user?.role !== 'ADMIN' && user?.role !== 'MANAGER') return alert("Unauthorized");
    try {
       await api.delete(`/sites/${id}`);
       fetchSites();
    } catch {
       alert("Failed to delete site");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-5xl mx-auto h-full w-full">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">System Settings</h1>
            <p className="text-sm text-[var(--color-text-dim)] mt-1">Manage organization boundaries and accesses.</p>
         </div>
      </div>

      <div className="flex gap-4 border-b border-[var(--color-border)] mb-6">
         <button onClick={()=>setActiveTab('sites')} className={`pb-3 px-2 font-bold transition-all border-b-2 ${activeTab==='sites' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text)]'}`}>Geolocation Sites</button>
         <button onClick={()=>setActiveTab('profile')} className={`pb-3 px-2 font-bold transition-all border-b-2 ${activeTab==='profile' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text)]'}`}>Organization Profile</button>
         <button onClick={()=>setActiveTab('roles')} className={`pb-3 px-2 font-bold transition-all border-b-2 ${activeTab==='roles' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-dim)] hover:text-[var(--color-text)]'}`}>Roles & Permissions</button>
      </div>

      {activeTab === 'sites' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add New Site Form */}
            <div className="lg:col-span-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm">
               <h2 className="font-bold text-lg text-[var(--color-text)] mb-4 flex items-center gap-2"><MapPin size={18}/> Add New Site</h2>
               <form onSubmit={handleAddSite} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-wider mb-1 block">Site Name</label>
                    <input type="text" required value={newSite.name} onChange={e=>setNewSite({...newSite, name: e.target.value})} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors" placeholder="e.g., Downtown Office" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                       <label className="text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-wider mb-1 block">Latitude</label>
                       <input type="number" step="any" required value={newSite.lat} onChange={e=>setNewSite({...newSite, lat: e.target.value})} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors" placeholder="34.0522" />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-wider mb-1 block">Longitude</label>
                       <input type="number" step="any" required value={newSite.lng} onChange={e=>setNewSite({...newSite, lng: e.target.value})} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors" placeholder="-118.2437" />
                     </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[var(--color-text-dim)] uppercase tracking-wider mb-1 block">Geofence Radius (meters)</label>
                    <input type="number" required value={newSite.radius} onChange={e=>setNewSite({...newSite, radius: e.target.value})} className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-colors" placeholder="100" />
                  </div>
                  <button type="submit" disabled={loading || user?.role === 'FIELD_EMPLOYEE'} className="mt-2 w-full bg-[var(--color-primary)] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform disabled:opacity-50">
                    <Plus size={18}/> Add Site
                  </button>
               </form>
            </div>

            {/* List Sites */}
            <div className="lg:col-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col">
               <h2 className="font-bold text-lg text-[var(--color-text)] mb-4">Active Geofence Zones</h2>
               <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
                  {sites.length === 0 ? <p className="text-center text-[var(--color-text-dim)] py-8">No sites found.</p> : sites.map(site => (
                     <div key={site.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
                        <div>
                           <p className="font-bold text-[var(--color-text)] flex items-center gap-2">{site.name} <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full">{site.radius}m radius</span></p>
                           <p className="text-xs text-[var(--color-text-dim)] font-mono mt-1">{site.lat}, {site.lng}</p>
                        </div>
                        <button onClick={()=>handleDeleteSite(site.id)} disabled={user?.role === 'FIELD_EMPLOYEE'} className="mt-3 sm:mt-0 p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-30">
                           <Trash2 size={16}/>
                        </button>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}

      {activeTab === 'profile' && (
         <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm max-w-xl">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Building size={28}/></div>
                <div>
                   <h2 className="text-xl font-bold text-[var(--color-text)]">My Organization</h2>
                   <p className="text-[var(--color-text-dim)] text-sm">Basic organizational profile</p>
                </div>
             </div>
             <p className="text-[var(--color-text)] border-b border-[var(--color-border)] pb-2 mb-4 font-mono text-sm">Org ID: <span className="text-[var(--color-primary)]">{user?.orgId}</span></p>
             <p className="text-[var(--color-text-dim)] text-sm">Profile updates must currently be requested via support ticket due to compliance locks.</p>
         </div>
      )}

      {activeTab === 'roles' && (
         <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm max-w-3xl">
             <h2 className="font-bold text-lg flex items-center gap-2 mb-6"><Shield size={20}/> Role Descriptions</h2>
             <div className="space-y-4">
                <div className="p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
                   <p className="font-bold text-[var(--color-text)] flex items-center gap-2">ADMIN <span className="bg-red-500/10 text-red-500 px-2 py-0.5 text-xs rounded-full">Full Access</span></p>
                   <p className="text-sm text-[var(--color-text-dim)] mt-1">Can manage all employees, organization settings, bypass geofence locks, and export raw data.</p>
                </div>
                <div className="p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
                   <p className="font-bold text-[var(--color-text)] flex items-center gap-2">MANAGER <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 text-xs rounded-full">Operational Access</span></p>
                   <p className="text-sm text-[var(--color-text-dim)] mt-1">Can approve expenses and leaves, create tasks, and view live tracking dashboards for their team.</p>
                </div>
                <div className="p-4 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)]">
                   <p className="font-bold text-[var(--color-text)] flex items-center gap-2">FIELD EMPLOYEE <span className="bg-green-500/10 text-green-500 px-2 py-0.5 text-xs rounded-full">Restricted</span></p>
                   <p className="text-sm text-[var(--color-text-dim)] mt-1">Can view their own tasks, submit expenses, log attendance, and ping location. Cannot view others' data.</p>
                </div>
             </div>
         </div>
      )}
    </div>
  );
}
