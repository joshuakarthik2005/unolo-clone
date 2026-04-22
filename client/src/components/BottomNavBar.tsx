import { NavLink } from 'react-router-dom';
import { MapPin, Clock, Briefcase, User } from 'lucide-react';

export default function BottomNavBar() {
  const navItems = [
    { to: '/dashboard/tasks', icon: Briefcase, label: 'Tasks' },
    { to: '/dashboard/attendance', icon: Clock, label: 'Attendance' },
    { to: '/dashboard/tracking', icon: MapPin, label: 'Map' },
    { to: '/dashboard/settings', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] px-6 py-2 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all
            ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)] hover:bg-[var(--color-bg-elevated)]'}
          `}
        >
          {({ isActive }) => (
            <>
              <div className={`p-1.5 rounded-xl ${isActive ? 'bg-[var(--color-primary-bg)]' : ''}`}>
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-bold">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
