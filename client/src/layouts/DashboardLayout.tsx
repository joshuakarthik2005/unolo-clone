import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import LocationSimulator from '../components/tracking/LocationSimulator';
import BottomNavBar from '../components/BottomNavBar';
import {
  LayoutDashboard,
  Users,
  Clock,
  MapPin,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  Bell,
  ChevronDown,
  Briefcase,
  Building,
  Receipt
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/tasks', icon: Briefcase, label: 'Tasks' },
  { to: '/dashboard/clients', icon: Building, label: 'Clients' },
  { to: '/dashboard/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/dashboard/employees', icon: Users, label: 'Employees' },
  { to: '/dashboard/attendance', icon: Clock, label: 'Attendance' },
  { to: '/dashboard/leaves', icon: CalendarDays, label: 'Leaves' },
  { to: '/dashboard/tracking', icon: MapPin, label: 'Tracking' },
  { to: '/dashboard/reports', icon: BarChart3, label: 'Reports' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    // Setup socket connection for real-time notifications
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, { withCredentials: true });

    socket.on('notification', (data) => {
       setNotifications(prev => [data, ...prev]);
    });

    return () => {
       socket.disconnect();
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <>
      <LocationSimulator />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-bg)', width: '100vw' }}>
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'block',
          }}
          className="lg:hidden"
        />
      )}

      {/* Sidebar — fixed width 220px */}
      <aside
        className={`
          flex-shrink-0 flex flex-col bg-[var(--color-bg-card)] border-r border-[var(--color-border)] h-screen w-[220px]
          fixed top-0 left-0 z-50 transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 64, flexShrink: 0, borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)' }}>
              <Zap size={18} color="white" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Unolo</span>
          </div>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4, borderRadius: 8 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 12,
                fontSize: 14, fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.2s',
                background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))' : 'transparent',
                color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer — Sign Out */}
        <div style={{ padding: 12, flexShrink: 0, borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={handleLogout}
            id="sidebar-logout"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12,
              fontSize: 14, fontWeight: 500,
              color: 'var(--color-text-muted)', background: 'none', border: 'none',
              cursor: 'pointer',
            }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Right side: Topbar + Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <header
          style={{
            height: 64, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px',
            background: 'var(--color-bg-card)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {/* Left — Hamburger (mobile) or spacer */}
          <div>
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 8, borderRadius: 12 }}
            >
              <Menu size={22} />
            </button>
          </div>

          {/* Right — Notifications + Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setBellOpen(!bellOpen)}
                style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 8, borderRadius: 12 }}
              >
                <Bell size={20} />
                {notifications.length > 0 && <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--color-error)' }} />}
              </button>
              {bellOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setBellOpen(false)} />
                  <div
                    className="animate-fade-in"
                    style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 8,
                      width: 300, borderRadius: 12, zIndex: 50,
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  >
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>Notifications</p>
                      <button onClick={()=>setNotifications([])} style={{ fontSize: 12, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear All</button>
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                       {notifications.length === 0 ? (
                          <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: 'var(--color-text-dim)' }}>No new notifications</div>
                       ) : (
                          notifications.map((notif, idx) => (
                             <div key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{notif.type.replace('_', ' ')}</p>
                                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{notif.message}</p>
                             </div>
                          ))
                       )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 12px 6px 8px', borderRadius: 12,
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: 'white',
                  background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)',
                  flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div className="hidden md:block" style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-dim)', whiteSpace: 'nowrap' }}>
                    {user?.role?.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} />
              </button>

              {profileOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setProfileOpen(false)} />
                  <div
                    className="animate-fade-in"
                    style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 8,
                      width: 224, padding: '8px 0', borderRadius: 12, zIndex: 50,
                      background: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-lg)',
                    }}
                  >
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border)' }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{user?.name}</p>
                      <p style={{ fontSize: 12, marginTop: 2, color: 'var(--color-text-dim)' }}>{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 16px',
                        fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
                        color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Page Content — scrollable with consistent padding */}
        <main className="flex-1 overflow-auto p-6 min-h-0 bg-[var(--color-bg)] pb-24 lg:pb-6 relative">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNavBar />
    </div>
    </>
  );
}
