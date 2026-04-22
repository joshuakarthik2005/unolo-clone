import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import type { Client } from '../types';
import { MapPin, Phone, User, Plus } from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', address: '', lat: '', lng: '', contactPerson: '', phone: ''
  });

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data.data);
    } catch (err) { }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      setShowModal(false);
      fetchClients();
      setFormData({ name: '', address: '', lat: '', lng: '', contactPerson: '', phone: '' });
    } catch (err) {
      alert("Failed to create client.");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto h-full px-6 py-6 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Client Directory</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:-translate-y-0.5 active:scale-95 transition-all text-sm whitespace-nowrap shrink-0"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        {loading ? <div className="text-[var(--color-text-muted)] p-4">Loading CRM...</div> :
         clients.map(client => (
          <div key={client.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl w-full p-6 shadow-sm flex flex-col gap-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--color-primary)]/10 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500"/>
            <h3 className="font-bold text-lg text-[var(--color-text)]">{client.name}</h3>
            <div className="flex items-start gap-2 text-sm text-[var(--color-text-dim)]">
              <MapPin size={16} className="shrink-0 mt-0.5 text-[var(--color-primary)]" />
              <span>{client.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-dim)]"><User size={16}/> {client.contactPerson || '--'}</div>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-dim)]"><Phone size={16}/> {client.phone || '--'}</div>
            
            <div className="mt-2 pt-4 border-t border-[var(--color-border)] flex items-center justify-between text-xs px-3 py-2 font-semibold text-[var(--color-text-muted)] w-full">
              <span className="truncate mr-2">LAT: {client.lat}</span>
              <span className="truncate">LNG: {client.lng}</span>
            </div>
          </div>
        ))}
        {clients.length === 0 && !loading && <div className="col-span-full text-center p-8 text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-2xl">No clients found. Add one above.</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="absolute inset-0" onClick={() => setShowModal(false)} />
           <div className="bg-[var(--color-bg-card)] rounded-2xl w-full max-w-lg p-6 relative z-10 animate-fade-in shadow-xl border border-[var(--color-border)] overflow-visible">
              <h2 className="text-xl font-bold mb-4 text-[var(--color-text)]">New Client</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input required placeholder="Company Name" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" 
                       value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <textarea required placeholder="Full Address" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" 
                       value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Latitude (e.g. 28.6139)" type="number" step="any" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" 
                         value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} />
                  <input required placeholder="Longitude (e.g. 77.2090)" type="number" step="any" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" 
                         value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <input placeholder="Contact Person" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" 
                         value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
                  <input placeholder="Phone" className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" 
                         value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 mt-4 w-full">
                   <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-[var(--color-text-dim)] font-medium hover:bg-white/5 transition-colors">Cancel</button>
                   <button type="submit" className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-xl font-bold shadow-md hover:-translate-y-0.5 active:scale-95 transition-all">Save Client</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
