import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import type { Task, Client, Project } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, List, Grip, Calendar as CalIcon, MapPin } from 'lucide-react';

export default function TasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '', assignedToId: '', clientId: '', projectId: '', priority: 'MEDIUM', scheduledDate: '', notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tasks');
      setTasks(res.data.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (['ADMIN', 'MANAGER'].includes(user?.role || '')) {
      Promise.all([api.get('/clients'), api.get('/employees'), api.get('/projects')]).then(([c, e, p]) => {
         setClients(c.data?.data || []);
         setEmployees(e.data?.data?.employees || []);
         setProjects(p.data?.data || []);
      }).catch(() => {
         setClients([]);
         setEmployees([]);
         setProjects([]);
      });
    } else {
      setView('list'); // Default to list for field employees
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tasks', formData);
      setShowModal(false);
      fetchData();
      setFormData({ title: '', assignedToId: '', clientId: '', projectId: '', priority: 'MEDIUM', scheduledDate: '', notes: '' });
    } catch {
      alert("Failed to create task");
    }
  };

  // ----- HTML5 Drag & Drop Logic -----
  const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED'];
  const statusColors: any = {
    'PENDING': 'border-blue-500 bg-blue-500/10 text-blue-500',
    'IN_PROGRESS': 'border-amber-500 bg-amber-500/10 text-amber-500',
    'COMPLETED': 'border-green-500 bg-green-500/10 text-green-500',
    'DELAYED': 'border-orange-500 bg-orange-500/10 text-orange-500',
    'CANCELLED': 'border-red-500 bg-red-500/10 text-red-500'
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch {
      fetchData(); // Rollback on fail
    }
  };

  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Render Card
  const TaskCard = ({ t }: { t: Task }) => (
    <div 
      draggable={['ADMIN', 'MANAGER'].includes(user?.role || '')}
      onDragStart={(e) => handleDragStart(e, t.id)}
      onClick={() => navigate(`/dashboard/tasks/${t.id}`)}
      className="bg-[var(--color-bg-elevated)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm cursor-pointer hover:border-[var(--color-primary)] hover:shadow-md transition-all active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-[var(--color-text)] line-clamp-1">{t.title}</h4>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
          t.priority === 'URGENT' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 
          t.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' : 
          'bg-gray-500/20 text-gray-400 border-gray-500/30'
        }`}>{t.priority}</span>
      </div>
      <div className="text-xs text-[var(--color-text-dim)] flex items-center gap-1 mb-1">
        <MapPin size={12} className="text-[var(--color-primary)]" /> {t.client?.name || 'Unknown Client'}
      </div>
      {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
        <div className="text-xs text-[var(--color-text-dim)] flex items-center gap-1 mb-2">
           <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">{t.assignedTo?.name?.charAt(0)}</div>
           {t.assignedTo?.name || 'Unassigned'}
        </div>
      )}
      <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-3 pt-2 border-t border-[var(--color-border)]">
        <CalIcon size={12} /> {new Date(t.scheduledDate).toLocaleDateString()}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto h-full px-6 py-6 w-full">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-[var(--color-text)]">Visit / Task Management</h1>
         <div className="flex items-center gap-3">
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-1 rounded-xl flex items-center">
              <button onClick={() => setView('kanban')} className={`p-1.5 rounded-lg transition-colors ${view==='kanban' ? 'bg-[var(--color-bg-elevated)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}><Grip size={18}/></button>
               <button onClick={() => setView('list')} className={`p-1.5 rounded-lg transition-colors ${view==='list' ? 'bg-[var(--color-bg-elevated)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}><List size={18}/></button>
            </div>
            {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
              <button onClick={() => setShowModal(true)} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-all">
                <Plus size={16}/> Assign Task
              </button>
            )}
         </div>
      </div>

      {loading ? <div className="text-[var(--color-text-muted)] p-8 text-center">Loading tasks...</div> : (
        <div className="flex-1 overflow-hidden min-h-0">
          {view === 'kanban' ? (
            <div className="flex gap-4 w-full overflow-x-auto px-6 pb-4 h-full">
              {statuses.map(status => (
                <div 
                  key={status} 
                  className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl flex-shrink-0 w-72 flex flex-col h-full overflow-hidden"
                  onDrop={(e) => handleDrop(e, status)}
                  onDragOver={allowDrop}
                >
                  <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-[var(--color-border)]">
                    <h3 className="font-bold text-[var(--color-text)] text-sm">{status.replace('_', ' ')}</h3>
                    <span className="text-xs bg-[var(--color-bg-elevated)] text-[var(--color-text-dim)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                      {tasks.filter(t => t.status === status).length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                    {tasks.filter(t => t.status === status).map(t => <TaskCard key={t.id} t={t} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-sm h-full flex flex-col">
              <div className="overflow-y-auto w-full p-4 grid gap-3">
                 {tasks.map(t => (
                    <div key={t.id} onClick={() => navigate(`/dashboard/tasks/${t.id}`)} className="flex items-center justify-between bg-[var(--color-bg-elevated)] p-4 rounded-xl border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)] group transition-all">
                      <div className="flex items-center gap-4">
                         <div className={`text-[10px] font-bold px-2 py-1 rounded border ${statusColors[t.status]}`}>
                           {t.status}
                         </div>
                         <div>
                            <h4 className="font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{t.title}</h4>
                            <div className="text-sm text-[var(--color-text-dim)] mt-0.5 flex gap-4">
                               <span>{t.client?.name}</span>
                               <span className="flex items-center gap-1"><CalIcon size={14}/> {new Date(t.scheduledDate).toLocaleDateString()}</span>
                            </div>
                         </div>
                      </div>
                      <span className="text-xs font-bold text-[var(--color-text-muted)]">{t.priority} PRIORITY</span>
                    </div>
                 ))}
                 {tasks.length === 0 && <div className="p-8 text-center text-gray-500">No tasks found.</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="absolute inset-0" onClick={()=>setShowModal(false)}></div>
           <div className="bg-[var(--color-bg-card)] rounded-2xl w-full max-w-lg p-6 relative z-10 animate-fade-in border border-[var(--color-border)] shadow-xl overflow-visible">
             <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">Assign New Task</h2>
             <form onSubmit={handleCreate} className="flex flex-col gap-4">
               <div>
                  <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Title / Objective</label>
                  <input required className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" 
                         value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Assign To</label>
                    <select required className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" value={formData.assignedToId} onChange={e=>setFormData({...formData, assignedToId: e.target.value})}>
                       <option value="">Select Employee</option>
                       {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>
                  <div>
                      <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Project (Optional)</label>
                      <select className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" value={formData.projectId} onChange={e=>setFormData({...formData, projectId: e.target.value})}>
                         <option value="">No Project</option>
                         {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Location / Client (Optional)</label>
                      <select className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" value={formData.clientId} onChange={e=>setFormData({...formData, clientId: e.target.value})}>
                         <option value="">Internal / No Client</option>
                         {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Scheduled Date</label>
                    <input type="date" required className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" 
                           value={formData.scheduledDate} onChange={e=>setFormData({...formData, scheduledDate:e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Priority</label>
                    <select required className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" value={formData.priority} onChange={e=>setFormData({...formData, priority: e.target.value})}>
                       <option value="LOW">Low</option>
                       <option value="MEDIUM">Medium</option>
                       <option value="HIGH">High</option>
                       <option value="URGENT">Urgent!</option>
                    </select>
                  </div>
               </div>
               <div>
                  <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Notes / Instructions</label>
                  <textarea rows={3} className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)] resize-none" 
                            value={formData.notes} onChange={e=>setFormData({...formData, notes:e.target.value})}></textarea>
               </div>
                <div className="flex justify-end gap-3 mt-4 w-full">
                 <button type="button" onClick={()=>setShowModal(false)} className="px-4 py-2 text-[var(--color-text-dim)] hover:bg-white/5 rounded-xl font-medium">Cancel</button>
                 <button type="submit" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-xl font-bold shadow-md hover:-translate-y-0.5 active:scale-95 transition-all">Assign Task</button>
               </div>
             </form>
           </div>
         </div>
      )}
    </div>
  );
}
