import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, CheckCircle2, ShieldAlert, BadgeInfo, Clock } from 'lucide-react';
import api from '../lib/api';
import type { User as UserType } from '../types';

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await api.get(`/employees/${id}`);
        setEmployee(response.data.data.employee);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchEmployee();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-[var(--color-text-muted)] animate-pulse">Loading profile...</div>;
  }

  if (error || !employee) {
    return (
      <div className="p-8">
        <div className="text-[var(--color-error)] mb-4">{error || 'Employee not found'}</div>
        <button onClick={() => navigate('/dashboard/employees')} className="text-sm underline text-[var(--color-primary)]">
          Back to Employees
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/dashboard/employees')}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Employee Profile</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl text-white mb-4 shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)' }}>
                {employee.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{employee.name}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>{employee.role.replace('_', ' ')}</p>
              
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ 
                  background: employee.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                  color: employee.status === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-muted)'
                }}
              >
                {employee.status === 'ACTIVE' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
                {employee.status}
              </div>
            </div>

            <hr className="my-6" style={{ borderColor: 'var(--color-border)' }} />

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} style={{ color: 'var(--color-text-dim)' }} />
                <span style={{ color: 'var(--color-text)' }}>{employee.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} style={{ color: 'var(--color-text-dim)' }} />
                <span style={{ color: 'var(--color-text)' }}>{employee.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <BadgeInfo size={16} style={{ color: 'var(--color-text-dim)' }} />
                <span style={{ color: 'var(--color-text)' }}>{employee.employeeCode || 'No Code'}</span>
              </div>
              {employee.manager && (
                <div className="flex items-center gap-3 text-sm pt-2">
                  <User size={16} style={{ color: 'var(--color-text-dim)' }} />
                  <div>
                    <div style={{ color: 'var(--color-text-dim)', fontSize: 11 }}>Reports To</div>
                    <div style={{ color: 'var(--color-text)' }}>{employee.manager.name}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Details & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats Placeholder */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Attendance', val: '98%', comp: '+2%' },
              { label: 'Tasks Done', val: '142', comp: '+12' },
              { label: 'Late Marks', val: '1', comp: '-1' },
              { label: 'Leaves', val: '2 / 12', comp: '' },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
                <div className="text-xs font-medium uppercase mb-2" style={{ color: 'var(--color-text-dim)' }}>{stat.label}</div>
                <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{stat.val}</div>
                {stat.comp && <div className="text-xs mt-1" style={{ color: 'var(--color-success)' }}>{stat.comp}</div>}
              </div>
            ))}
          </div>

          {/* Activity Placeholder */}
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>Recent Activity</h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--color-border)] before:to-transparent">
              {/* Dummy Timeline Items */}
              {[
                { time: 'Today, 09:00 AM', title: 'Checked In', desc: 'At Client Location A', icon: MapPin },
                { time: 'Yesterday, 06:15 PM', title: 'Checked Out', desc: 'At Home Office', icon: Clock },
                { time: 'Monday', title: 'Completed Task', desc: 'Monthly audit report submitted', icon: CheckCircle2 },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[var(--color-bg-card)] bg-[var(--color-primary)] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Icon size={14} />
                    </div>
                    <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-1.75rem)] p-4 rounded-xl" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{item.title}</div>
                        <time className="text-xs" style={{ color: 'var(--color-text-dim)' }}>{item.time}</time>
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{item.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
