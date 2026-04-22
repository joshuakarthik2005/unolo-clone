import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';

// Initial coordinates (e.g. New Delhi center)
const START_LAT = 28.6139;
const START_LNG = 77.2090;

export default function LocationSimulator() {
  const { user } = useAuth();
  const currentPos = useRef({ lat: START_LAT, lng: START_LNG });

  useEffect(() => {
    // Only simulate tracking for FIELD_EMPLOYEEs
    if (!user || user.role !== 'FIELD_EMPLOYEE') return;

    // Jitter function to simulate walking/driving
    const updatePosition = () => {
      currentPos.current = {
        lat: currentPos.current.lat + (Math.random() - 0.5) * 0.001,
        lng: currentPos.current.lng + (Math.random() - 0.5) * 0.001,
      };

      const batteryLevel = Math.floor(Math.random() * 20) + 80; // random bat between 80-99

      api.post('/location/update', {
        ...currentPos.current,
        accuracy: 10,
        batteryLevel,
      }).catch(err => console.error('Simulated location ping failed:', err));
    };

    // Ping immediately
    updatePosition();

    // Ping every 30 seconds
    const interval = setInterval(updatePosition, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Hidden component, strictly background logic
  return null;
}
