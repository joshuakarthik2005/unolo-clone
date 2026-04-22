import { useState, useEffect } from 'react';
import { Plus, Search, Mail, ShieldAlert, CheckCircle2, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import type { User } from '../types';
import AddEmployeeModal from '../components/employees/AddEmployeeModal';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get('/employees', {
        params: {
          search: search || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        }
      });
      setEmployees(response.data.data.employees);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'rgba(239, 68, 68, 0.1)', // red
      MANAGER: 'rgba(59, 130, 246, 0.1)', // blue
      FIELD_EMPLOYEE: 'rgba(16, 185, 129, 0.1)', // green
    };
    const textColors: Record<string, string> = {
      ADMIN: 'var(--color-error)',
      MANAGER: 'var(--color-primary)',
      FIELD_EMPLOYEE: 'var(--color-success)',
    };
    
    return (
      <span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: colors[role], color: textColors[role] }}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', padding: '24px' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Employees
          </h1>
          <p style={{ marginTop: 4, fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>
            Manage your field team and sub-managers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className="hover:scale-105"
            style={{ padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Mail size={16} />
            Invite
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="hover:scale-105"
            style={{ padding: '8px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)', color: 'white', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Plus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 16, borderRadius: 16, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, email, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 16px 8px 36px', borderRadius: 12, fontSize: 14, outline: 'none', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 12, fontSize: 14, outline: 'none', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer' }}
          >
            <option value="">All Roles</option>
            <option value="FIELD_EMPLOYEE">Field Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 12, fontSize: 14, outline: 'none', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div style={{ borderRadius: 16, overflow: 'hidden', overflowX: 'auto', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', minWidth: 0 }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center', fontSize: 14, color: 'var(--color-text-muted)' }}>Loading...</div>
        ) : employees.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <UserX size={48} style={{ opacity: 0.5, color: 'var(--color-text-dim)', marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>No employees found</h3>
            <p style={{ fontSize: 14, marginTop: 4, color: 'var(--color-text-muted)' }}>Try adjusting your search filters or add a new employee.</p>
          </div>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-dim)' }}>Employee</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-dim)' }}>Code / Contact</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-dim)' }}>Role</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-dim)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr 
                  key={emp.id} 
                  onClick={() => navigate(`/dashboard/employees/${emp.id}`)}
                  style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14, color: 'white', background: 'linear-gradient(135deg, var(--color-primary), #8b5cf6)' }}>
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--color-text)' }}>{emp.name}</div>
                        <div style={{ fontSize: 12, marginTop: 2, color: 'var(--color-text-muted)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: 14, color: 'var(--color-text)' }}>{emp.employeeCode || '—'}</div>
                    <div style={{ fontSize: 12, marginTop: 2, color: 'var(--color-text-muted)' }}>{emp.phone || 'No phone'}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {getRoleBadge(emp.role)}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {emp.status === 'ACTIVE' ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--color-success)' }}>
                        <CheckCircle2 size={14} /> Active
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--color-text-dim)' }}>
                        <ShieldAlert size={14} /> Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddEmployeeModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchEmployees}
      />
    </div>
  );
}
