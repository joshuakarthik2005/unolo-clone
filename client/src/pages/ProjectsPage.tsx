import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import type { Project, Client } from '../types';
import { Folder, Building, FileText, Plus, Share2, Lock, Globe, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createData, setCreateData] = useState({ name: '', description: '', clientId: '', visibility: 'PRIVATE' });

  // Share Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [shareUserId, setShareUserId] = useState('');
  const [shareRole, setShareRole] = useState<'VIEWER'|'EDITOR'>('VIEWER');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes, uRes] = await Promise.all([
        api.get('/projects'),
        api.get('/clients'),
        api.get('/employees')
      ]);
      setProjects(pRes.data.data);
      setClients(cRes.data.data);
      setUsers(uRes.data.data.employees || []);
    } catch (err) { 
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', createData);
      setShowCreateModal(false);
      fetchData();
      setCreateData({ name: '', description: '', clientId: '', visibility: 'PRIVATE' });
    } catch (err) {
      alert("Failed to create project.");
    }
  };

  const handleToggleVisibility = async (project: Project) => {
    try {
      const newVis = project.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
      await api.put(`/projects/${project.id}/visibility`, { visibility: newVis });
      setProjects(projects.map(p => p.id === project.id ? { ...p, visibility: newVis } : p));
      if (selectedProject?.id === project.id) {
        setSelectedProject({ ...project, visibility: newVis });
      }
    } catch (err) {
      alert("Failed to change visibility.");
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !shareUserId) return;
    try {
      await api.post(`/projects/${selectedProject.id}/members`, { userId: shareUserId, role: shareRole });
      fetchData(); // Refresh to get updated members
      
      // Update local state for immediate feedback
      const updatedUser = users.find(u => u.id === shareUserId);
      if (updatedUser) {
        const newMember: any = { projectId: selectedProject.id, userId: shareUserId, role: shareRole, user: updatedUser };
        const updatedMembers = selectedProject.members?.filter(m => m.userId !== shareUserId) || [];
        setSelectedProject({ ...selectedProject, members: [...updatedMembers, newMember] });
      }
      setShareUserId('');
    } catch (err) {
      alert("Failed to add member.");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedProject) return;
    try {
      await api.delete(`/projects/${selectedProject.id}/members/${userId}`);
      fetchData();
      setSelectedProject({ 
        ...selectedProject, 
        members: selectedProject.members?.filter(m => m.userId !== userId) 
      });
    } catch (err) {
      alert("Failed to remove member.");
    }
  };

  const isOwnerOrAdmin = (project: Project) => {
    if (user?.role === 'ADMIN') return true;
    const member = project.members?.find(m => m.userId === user?.id);
    return member?.role === 'OWNER';
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
            onClick={() => setShowCreateModal(true)}
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
            
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg text-[var(--color-text)] pr-6">{project.name}</h3>
              <div title={project.visibility === 'PUBLIC' ? "Public Project" : "Private Project"}>
                {project.visibility === 'PUBLIC' 
                  ? <Globe size={18} className="text-blue-500 opacity-70" /> 
                  : <Lock size={18} className="text-orange-500 opacity-70" />}
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-sm text-[var(--color-text-dim)]">
              <FileText size={16} className="shrink-0 mt-0.5 text-[var(--color-primary)]" />
              <span className="line-clamp-2">{project.description || 'No description provided.'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-medium mt-2 pt-4 border-t border-[var(--color-border)]">
              {project.client ? (
                <><Building size={16} className="text-purple-500"/> <span className="text-[var(--color-text)] truncate">{project.client.name}</span></>
              ) : (
                <><Folder size={16} className="text-blue-500"/> <span className="text-[var(--color-text)]">Internal Project</span></>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 pt-4 border-t border-[var(--color-border)]">
              <div className="flex -space-x-2 overflow-hidden">
                {project.members && project.members.length > 0 ? project.members.slice(0, 3).map((m, i) => (
                  <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-[var(--color-bg-card)] bg-[var(--color-primary)] text-white text-[10px] font-bold flex items-center justify-center" title={`${m.user?.name} (${m.role})`}>
                    {m.user?.name.charAt(0).toUpperCase()}
                  </div>
                )) : (
                  <span className="text-xs text-[var(--color-text-dim)]">No members</span>
                )}
                {project.members && project.members.length > 3 && (
                  <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[var(--color-bg-card)] bg-[var(--color-bg-elevated)] text-[var(--color-text-dim)] text-[10px] font-bold flex items-center justify-center">
                    +{project.members.length - 3}
                  </div>
                )}
              </div>
              
              {isOwnerOrAdmin(project) && (
                <button 
                  onClick={() => { setSelectedProject(project); setShowShareModal(true); }}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-dim)] hover:text-[var(--color-primary)] transition-colors px-2 py-1 rounded hover:bg-[var(--color-primary)]/10"
                >
                  <Share2 size={14} /> Share
                </button>
              )}
            </div>
          </div>
        ))}
        {projects.length === 0 && !loading && <div className="col-span-full text-center p-8 text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-2xl">No projects found. Create one above.</div>}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="absolute inset-0" onClick={() => setShowCreateModal(false)} />
           <div className="bg-[var(--color-bg-card)] rounded-2xl w-full max-w-md p-6 relative z-10 animate-fade-in shadow-xl border border-[var(--color-border)]">
              <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">New Project</h2>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Project Name</label>
                  <input required placeholder="e.g. Q3 Field Expansion" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" 
                       value={createData.name} onChange={e => setCreateData({...createData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Description</label>
                  <textarea placeholder="Brief overview" rows={3} className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] resize-none" 
                       value={createData.description} onChange={e => setCreateData({...createData, description: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Assign to Client (Optional)</label>
                  <select className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" 
                           value={createData.clientId} onChange={e=>setCreateData({...createData, clientId: e.target.value})}>
                     <option value="">Internal Project (No Client)</option>
                     {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-dim)] mb-1 block">Visibility</label>
                  <select className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 outline-none focus:border-[var(--color-primary)] text-[var(--color-text)]" 
                           value={createData.visibility} onChange={e=>setCreateData({...createData, visibility: e.target.value})}>
                     <option value="PRIVATE">Private (Only added members)</option>
                     <option value="PUBLIC">Public (Visible to everyone in organization)</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-3 mt-4">
                 <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-[var(--color-text-dim)] hover:bg-white/5 rounded-xl font-medium">Cancel</button>
                 <button type="submit" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-xl font-bold shadow-md hover:-translate-y-0.5 active:scale-95 transition-all">Create Project</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {showShareModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="absolute inset-0" onClick={() => setShowShareModal(false)} />
           <div className="bg-[var(--color-bg-card)] rounded-2xl w-full max-w-md p-6 relative z-10 animate-fade-in shadow-xl border border-[var(--color-border)] max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--color-text)]">Share Project</h2>
                <button 
                  onClick={() => handleToggleVisibility(selectedProject)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedProject.visibility === 'PUBLIC' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}
                >
                  {selectedProject.visibility === 'PUBLIC' ? <Globe size={16}/> : <Lock size={16}/>}
                  {selectedProject.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                </button>
              </div>

              <p className="text-sm text-[var(--color-text-dim)] mb-4">
                {selectedProject.visibility === 'PUBLIC' 
                  ? "This project is public. Anyone in your organization can view it, but only members can edit." 
                  : "This project is private. Only added members can view or edit it."}
              </p>

              <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
                <select 
                  required
                  className="flex-1 min-w-0 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] truncate"
                  value={shareUserId}
                  onChange={e => setShareUserId(e.target.value)}
                >
                  <option value="">Select Employee...</option>
                  {users.filter(u => !selectedProject.members?.some(m => m.userId === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <select 
                  className="w-28 shrink-0 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                  value={shareRole}
                  onChange={e => setShareRole(e.target.value as any)}
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="EDITOR">Editor</option>
                </select>
                <button type="submit" className="shrink-0 bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl font-medium shadow hover:-translate-y-0.5 active:scale-95 transition-all text-sm">Add</button>
              </form>

              <h3 className="text-sm font-bold text-[var(--color-text)] mb-2 uppercase tracking-wider">Current Members</h3>
              <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 min-h-[100px]">
                {selectedProject.members?.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold flex items-center justify-center text-sm">
                        {m.user?.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)] leading-tight">{m.user?.name}</p>
                        <p className="text-xs text-[var(--color-text-dim)]">{m.role}</p>
                      </div>
                    </div>
                    {m.role !== 'OWNER' && (
                      <button 
                        onClick={() => handleRemoveMember(m.userId)}
                        className="p-1.5 text-[var(--color-text-dim)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Remove member"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                {(!selectedProject.members || selectedProject.members.length === 0) && (
                   <p className="text-sm text-[var(--color-text-muted)] italic">No members yet.</p>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button onClick={() => setShowShareModal(false)} className="bg-[var(--color-bg-elevated)] text-[var(--color-text)] px-6 py-2 rounded-xl font-medium border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors">Done</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}