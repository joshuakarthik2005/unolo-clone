import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Download, FileText, AlertTriangle } from 'lucide-react';

export default function ReportsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/reports/employee-activity');
      setEmployees(res.data.data);
    } catch (err) {
       console.error("Failed to load generic reports");
    }
    setLoading(false);
  };

  const downloadCSV = (filename: string, headers: string[], rows: any[]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportEmployeeActivity = () => {
    const headers = ['Employee ID', 'Name', 'Tasks Completed', 'Total Tasks', 'Distance Traveled (km)'];
    const rows = employees.map(e => ({
      id: e.id,
      name: e.name,
      completed: e.tasksCompleted,
      total: e.totalTasks,
      distance: e.distanceTraveled.toFixed(2)
    }));
    downloadCSV(`Employee_Activity_Report_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const exportExpenseSummary = async () => {
    try {
       const res = await api.get('/reports/expense-summary');
       const chartData = res.data.data.chartData;
       const headers = ['Expense Category', 'Total Claimed Amount (INR)'];
       const rows = chartData.map((e: any) => ({
         category: e.name,
         amount: e.value.toFixed(2)
       }));
       downloadCSV(`Expense_Summary_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    } catch {
       alert("Failed to export expense data");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-7xl mx-auto h-full px-6 py-6 w-full">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">Export Data & Reports</h1>
            <p className="text-sm text-[var(--color-text-dim)] mt-1">Download operational metrics in CSV format.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-4">
         {/* Export Action Card 1 */}
         <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col gap-4 group hover:border-[var(--color-primary)]/50 transition-all">
            <div className="flex items-start justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500"><FileText size={20}/></div>
                  <div>
                    <h2 className="font-bold text-[var(--color-text)]">Employee Activity Log</h2>
                    <p className="text-xs text-[var(--color-text-dim)] mt-0.5">Task completion rates and total GPS distance per employee.</p>
                  </div>
               </div>
            </div>
            <div className="border-t border-[var(--color-border)] pt-4 mt-2">
               <button onClick={exportEmployeeActivity} disabled={loading} className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white transition-colors py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  <Download size={16}/> Download CSV
               </button>
            </div>
         </div>

         {/* Export Action Card 2 */}
         <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm flex flex-col gap-4 group hover:border-[var(--color-primary)]/50 transition-all">
            <div className="flex items-start justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500"><FileText size={20}/></div>
                  <div>
                    <h2 className="font-bold text-[var(--color-text)]">Financial Expense Summary</h2>
                    <p className="text-xs text-[var(--color-text-dim)] mt-0.5">Aggregated approved claims across fuel, food, and miscellaneous costs.</p>
                  </div>
               </div>
            </div>
            <div className="border-t border-[var(--color-border)] pt-4 mt-2">
               <button onClick={exportExpenseSummary} className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white transition-colors py-2.5 rounded-xl font-bold flex items-center justify-center gap-2">
                  <Download size={16}/> Download CSV
               </button>
            </div>
         </div>
      </div>

      <div className="mt-6 flex-1 w-full flex flex-col bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-elevated)]">
            <h3 className="font-bold text-[var(--color-text)] text-sm">System Data Preview (Employee Overview)</h3>
        </div>
        <div className="flex-1 w-full overflow-x-auto">
           {loading ? <div className="p-8 text-center text-[var(--color-text-dim)]">Fetching generic analytics...</div> : (
              <table className="w-full min-w-[700px] text-left text-sm">
                 <thead className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                    <tr>
                      <th className="p-4 font-medium">Employee Name</th>
                      <th className="p-4 font-medium">Total Assigned Tasks</th>
                      <th className="p-4 font-medium">Tasks Completed</th>
                      <th className="p-4 font-medium">Total Distance Traveled</th>
                      <th className="p-4 font-medium">Efficiency Index</th>
                    </tr>
                 </thead>
                 <tbody>
                    {employees.map(emp => (
                       <tr key={emp.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]/50">
                         <td className="p-4 font-bold text-[var(--color-text)]">{emp.name}</td>
                         <td className="p-4 text-[var(--color-text-dim)]">{emp.totalTasks} tasks</td>
                         <td className="p-4 text-green-500 font-medium">{emp.tasksCompleted} passed</td>
                         <td className="p-4 font-mono text-[var(--color-text-muted)]">{emp.distanceTraveled.toFixed(1)} km</td>
                         <td className="p-4">
                           {emp.totalTasks > 0 ? (
                             <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded text-xs font-bold">
                               {Math.round((emp.tasksCompleted / emp.totalTasks) * 100)}%
                             </span>
                           ) : <span className="text-[var(--color-text-dim)]">N/A</span>}
                         </td>
                       </tr>
                    ))}
                    {employees.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-[var(--color-text-dim)] border-t border-[var(--color-border)]">No active employee analytics found for this Organization.</td></tr>}
                 </tbody>
              </table>
           )}
        </div>
      </div>
    </div>
  );
}
