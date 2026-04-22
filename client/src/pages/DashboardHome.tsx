import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  MapPin,
  Clock,
  Briefcase,
  TrendingUp,
  Activity,
  CheckCircle,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
  CartesianGrid
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardHome() {
  const { user } = useAuth();
  
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [taskData, setTaskData] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/attendance-summary'),
      api.get('/reports/task-performance'),
      api.get('/reports/expense-summary'),
      api.get('/reports/employee-activity')
    ]).then(([attRes, taskRes, expRes, actRes]) => {
      setAttendanceData(attRes.data.data);
      setTaskData(taskRes.data.data);
      setExpenseData(expRes.data.data);
      setActivityData(actRes.data.data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const topActiveToday = attendanceData?.todayActive || 0;
  const totalEmployees = activityData?.length || 1; // avoid /0
  const attendancePercent = Math.round((topActiveToday / totalEmployees) * 100) || 0;
  const totalDistance = activityData.reduce((sum, e) => sum + e.distanceTraveled, 0) || 0;

  const stats = [
    {
      label: 'Active Employees Today',
      value: loading ? '—' : `${topActiveToday}`,
      icon: Users,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
    },
    {
      label: 'Tasks Completed / Pending',
      value: loading ? '—' : `${taskData?.completed || 0} / ${taskData?.pending || 0}`,
      icon: CheckCircle,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      label: 'Total Distance Tracked',
      value: loading ? '—' : `${totalDistance.toFixed(1)} km`,
      icon: MapPin,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      label: 'Attendance Rate',
      value: loading ? '—' : `${attendancePercent}%`,
      icon: Activity,
      color: '#0ea5e9',
      bg: 'rgba(14, 165, 233, 0.1)',
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in px-6 py-6 w-full max-w-7xl mx-auto h-full">
      {/* Welcome Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-dim)]">
            Your daily field force operational overview.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl text-sm font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] border border-[var(--color-primary)]/20 whitespace-nowrap shadow-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="relative overflow-hidden rounded-2xl p-5 bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm hover:border-[var(--color-primary)]/50 transition-colors group">
              <div style={{ position: 'absolute', top: -32, right: -32, width: 96, height: 96, borderRadius: '50%', opacity: 0.2, background: stat.color, filter: 'blur(20px)' }} />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">
                    {stat.value}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl transition-transform group-hover:scale-110" style={{ background: stat.bg }}>
                  <Icon size={20} style={{ color: stat.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full min-h-[400px]">
        {/* Attendance Trend Chart */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col min-h-[350px]">
          <h2 className="text-lg font-bold text-[var(--color-text)] mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-[var(--color-primary)]"/> Attendance Trend (30 Days)</h2>
          <div className="flex-1 w-full relative">
            {loading ? <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-dim)]">Crunching data...</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData?.trend || []} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--color-text-dim)" fontSize={12} tickFormatter={(val) => val.slice(5)} />
                  <YAxis stroke="var(--color-text-dim)" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', borderRadius: '12px', color: 'var(--color-text)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" name="Present" dataKey="PRESENT" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Absent" dataKey="ABSENT" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" name="Late" dataKey="LATE" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Tasks and Expenses Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
           {/* Task Performance */}
           <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col">
              <h2 className="text-sm font-bold text-[var(--color-text)] mb-6 flex items-center gap-2"><Briefcase size={16} className="text-blue-500"/> Task Completion Status</h2>
              <div className="flex-1 w-full relative h-[250px]">
                {loading ? <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-dim)]">Crunching data...</div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskData?.chartData || []} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--color-text-dim)" fontSize={11} />
                      <YAxis stroke="var(--color-text-dim)" fontSize={11} allowDecimals={false} />
                      <Tooltip cursor={{fill: 'var(--color-border-light)', opacity: 0.4}} contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }} />
                      <Bar dataKey="value" radius={[4,4,0,0]}>
                        {taskData?.chartData?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
           </div>

           {/* Expenses Ratio */}
           <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col">
              <h2 className="text-sm font-bold text-[var(--color-text)] mb-2 flex items-center gap-2"><FileText size={16} className="text-purple-500"/> Expense Categorization</h2>
              <div className="flex-1 w-full relative h-[220px]">
                {loading ? <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-dim)]">Crunching data...</div> : (
                  expenseData?.chartData?.length === 0 ? <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-dim)] text-xs">No expense data found</div> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expenseData?.chartData} innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                          {expenseData?.chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index+2) % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-text)' }} itemStyle={{color: 'var(--color-text)'}}/>
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  )
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
