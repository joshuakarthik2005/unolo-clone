import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import type { Project, Client } from '../types';
import { Folder, Building, FileText, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', clientId: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        api.get('/projects'),
        api.get('/clients')
      ]);
      setProjects(pRes.data.data);
      setClients(cRes.data.data);
    } catch (err) { 
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', formData);
      setShowModal(false);
      fetchData();
      setFormData({ name: '', description: '', clientId: '' });
    } catch (err) {
      alert("Failed to create project.");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto h-full px-6 py-6 w-full">
      <div className="flex items-center justify-between w-full">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Project Index</h1>
          <p className="text-sm text-[var(--color-text-dim)]">Manage internal and client projects</p>
        </div>
        {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all text-sm whitespace-nowrap shrink-0"
          >
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        {loading ? <div className="text-[var(--color-text-muted)] p-4">Loading projects...</div> :
         projects.map(project => (
          <div key={project.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl w-full p-6 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--color-primary)]/10 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"/>
            <h3 className="font-bold text-lg text-[var(--color-text)]">{project.name}</h3>
            
            <div className="flex items-start gap-2 text-sm text-[var(--color-text-dim)]">
              <FileText size={16} className="shrink-0 mt-0.5 text-[var(--color-primary)]" />
              <span className="line-clamp-2">{project.description || 'No description provided.'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-medium mt-2 pt-4 border-t border-[var(--color-border)]">
              {project.client ? (
                <><Building size={16} className="text-purple-500"/> <span className="text-[var(--color-text)]">{project.client.name}</span></>
              ) : (
                <><Folder size={16} className="text-blue-500"/> <span className="text-[var(--color-text)]">Internal Project</span></>
              )}
            </div>
          </div>
        ))}
        {projects.length === 0 && !loading && <div className="col-span-full text-center p-8 text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-2xl">No projects found. Create one above.</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           {/* Backdrop to close */}
           <div className="absolute inset-0" onClick={() => setShowModal(false)} />
           <div className="bg-[var(--color-bg-card)] rounded-2xl w-full max-w-md p-6 relative z-10 animate-fade-in shadow-xl border border-[var(--color-border)]">
              <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">New Project</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Project Name</label>
                  <input required placeholder="e.g. Q3 Field Expansion" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" 
                       value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Description</label>
                  <textarea placeholder="Brief overview" rows={3} className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] resize-none" 
                       value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Assign to Client (Optional)</label>
                  <select className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" 
                           value={formData.clientId} onChange={e=>setFormData({...formData, clientId: e.target.value})}>
                     <option value="">Internal Project (No Client)</option>
                     {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                 <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-[var(--color-text-dim)] hover:bg-white/5 rounded-xl font-medium">Cancel</button>
                 <button type="submit" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-xl font-bold shadow-md hover:-translate-y-0.5 active:scale-95 transition-all">Create Project</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}