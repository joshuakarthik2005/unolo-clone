import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';
import api from '../lib/api';
import type { LiveEmployee } from '../types';
import { Users, Battery, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Center of New Delhi
const defaultCenter: [number, number] = [28.6139, 77.2090];

// Hook to move map center dynamically
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() > zoom ? map.getZoom() : zoom);
  }, [center, zoom, map]);
  return null;
}

export default function LiveTrackingPage() {
  const [employees, setEmployees] = useState<LiveEmployee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<LiveEmployee | null>(null);
  const [historyPath, setHistoryPath] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);

  // Init socket and fetch initial positions
  useEffect(() => {
    let socket: Socket;

    const initMapData = async () => {
      try {
        const res = await api.get('/location/live');
        setEmployees(res.data.data.liveLocations);
      } catch (err) {
        console.error('Failed to load live locations', err);
      } finally {
        setLoading(false);
      }

      // Initialize WebSocket connection
      socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        withCredentials: true,
      });

      socket.on('connect', () => {
        console.log('Socket connected for live tracking');
      });

      socket.on('locationUpdate', (update: any) => {
        setEmployees(prev => {
          const index = prev.findIndex(e => e.id === update.userId);
          if (index === -1) return prev; // Ignore if user not currently in standard list
          
          const newEmps = [...prev];
          newEmps[index] = {
            ...newEmps[index],
            location: {
              ...newEmps[index].location,
              lat: update.lat,
              lng: update.lng,
              accuracy: update.accuracy,
              batteryLevel: update.batteryLevel,
              timestamp: update.timestamp,
            }
          };
          return newEmps;
        });

        // Update selected marker info dynamically if it's the one moving
        setSelectedEmp(prev => (prev && prev.id === update.userId) ? {
          ...prev,
          location: {
            ...prev.location,
            lat: update.lat,
            lng: update.lng,
            accuracy: update.accuracy,
            batteryLevel: update.batteryLevel,
            timestamp: update.timestamp,
          }
        } : prev);
      });
    };

    initMapData();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Fetch history when setting a selected employee
  useEffect(() => {
    const loadHistory = async () => {
      if (!selectedEmp) {
        setHistoryPath([]);
        return;
      }
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await api.get(`/location/history/${selectedEmp.id}?date=${today}`);
        const path = res.data.data.history.map((log: any) => [log.lat, log.lng] as [number, number]);
        setHistoryPath(path);
      } catch (err) {
        console.error('Failed to load path history', err);
      }
    };
    loadHistory();
  }, [selectedEmp?.id]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (selectedEmp) return [selectedEmp.location.lat, selectedEmp.location.lng];
    if (employees.length > 0) return [employees[0].location.lat, employees[0].location.lng];
    return defaultCenter;
  }, [selectedEmp, employees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[var(--color-text-muted)] p-8">Loading Maps...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col lg:flex-row h-full gap-6 max-h-[calc(100vh-112px)] px-6 py-6 w-full">
      
      {/* Sidebar Active List */}
      <div className="w-full lg:w-80 flex flex-col bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden shrink-0">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-bold text-[var(--color-text)] flex items-center gap-2">
            <Users size={18} className="text-[var(--color-primary)]" />
            Active Field Team
          </h2>
          <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded-full text-xs font-bold">
            {employees.length} Online
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {employees.map(emp => (
            <div 
              key={emp.id}
              onClick={() => setSelectedEmp(emp)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                selectedEmp?.id === emp.id ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]' : 'hover:bg-white/5 border-transparent'
              } border`}
            >
               <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white"
                        style={{ background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)' }}>
                  {emp.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[var(--color-text)] truncate">{emp.name}</div>
                  <div className="text-xs text-[var(--color-text-dim)] flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Battery size={12} /> {emp.location.batteryLevel || '--'}%</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> Live</span>
                  </div>
                </div>
            </div>
          ))}
          {employees.length === 0 && (
             <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">
                No active field employees.
             </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-xl bg-[var(--color-bg-elevated)] min-h-[400px]">
        <MapContainer 
          center={mapCenter} 
          zoom={selectedEmp ? 15 : 12} 
          style={{ width: '100%', height: '100%' }}
        >
          <ChangeView center={mapCenter} zoom={selectedEmp ? 15 : 12} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Main live location markers */}
          {employees.map(emp => (
            <Marker 
                key={emp.id} 
                position={[emp.location.lat, emp.location.lng]}
                eventHandlers={{
                    click: () => {
                      setSelectedEmp(emp);
                    },
                }}
            >
                {selectedEmp?.id === emp.id && (
                     <Popup>
                        <div className="p-1 min-w-[150px]">
                            <div className="font-bold text-sm mb-1 text-gray-800">{emp.name}</div>
                            <div className="text-xs text-gray-600 mb-2">Code: {emp.employeeCode || 'N/A'}</div>
                            <div className="flex items-center justify-between text-xs font-medium pt-2 border-t border-gray-200">
                            <span className="flex items-center gap-1 text-green-600"><Battery size={14}/> {emp.location.batteryLevel}%</span>
                            <span className="text-gray-500">{new Date(emp.location.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                     </Popup>
                )}
            </Marker>
          ))}

          {/* Polyline history for selected employee */}
          {selectedEmp && historyPath.length > 0 && (
            <Polyline
              positions={historyPath}
              pathOptions={{ color: '#8b5cf6', weight: 4, opacity: 0.8 }}
            />
          )}

        </MapContainer>
      </div>
    </div>
  );
}
