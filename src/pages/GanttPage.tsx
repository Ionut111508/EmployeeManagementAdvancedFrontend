import { useMemo, useState } from 'react';
import { loadVisibleAllocations } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { dateInputValue, formatDate, formatNumber, parseLocalDate } from '../utils/format';

const day = 1000 * 60 * 60 * 24;
const today = new Date();
today.setHours(0, 0, 0, 0);

export function GanttPage() {
  const { session, access } = useAuth();
  const [projectFilter, setProjectFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  const { data, loading, error } = useAsync(async () => {
    if (!session) throw new Error('Login is required.');
    const allocations = await loadVisibleAllocations(session, access);
    return allocations.map(a => ({ ...a, start: parseLocalDate(a.allocationStartDate), end: parseLocalDate(a.allocationEndDate ?? a.allocationStartDate) }));
  }, [session?.employeeId, access?.managedProjectIds.join('|')]);

  const projects = useMemo(() => Array.from(new Map((data ?? []).map(a => [a.projectId, a.projectName ?? a.projectId])).entries()), [data]);
  const employees = useMemo(() => Array.from(new Map((data ?? []).map(a => [a.employeeId, a.employeeName ?? a.employeeId])).entries()), [data]);

  const filtered = useMemo(() => (data ?? []).filter(item => {
    const matchesProject = projectFilter === 'all' || item.projectId === projectFilter;
    const matchesEmployee = employeeFilter === 'all' || item.employeeId === employeeFilter;
    const isClosed = item.end < today;
    const isActive = item.start <= today && item.end >= today;
    const isFuture = item.start > today;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && isActive) || (statusFilter === 'closed' && isClosed) || (statusFilter === 'future' && isFuture);
    return matchesProject && matchesEmployee && matchesStatus;
  }), [data, projectFilter, employeeFilter, statusFilter]);

  const min = filtered.length ? new Date(Math.min(...filtered.map(r => r.start.getTime()))) : new Date();
  const max = filtered.length ? new Date(Math.max(...filtered.map(r => r.end.getTime()))) : new Date();
  const totalDays = Math.max(1, Math.round((max.getTime() - min.getTime()) / day) + 1);

  return <section className="page-stack">
    <PageHeader eyebrow="Planning" title="Gantt Chart" description="A compact view of who is allocated, for how long, and at what daily workload." />
    <div className="card filter-bar"><strong>Filters</strong><label>Project<select className="field" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}><option value="all">All projects</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>{session?.role !== 'Employee' && <label>Employee<select className="field" value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}><option value="all">All employees</option>{employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>}<label>Status<select className="field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="active">Active now</option><option value="future">Future</option><option value="closed">Completed</option><option value="all">All statuses</option></select></label><span className="badge">{filtered.length} allocations</span></div>
    <Status loading={loading} error={error} empty={filtered.length === 0} />
    {data && filtered.length > 0 && <div className="table-card gantt-card">
      <div className="gantt-summary"><span>Visible interval</span><strong>{formatDate(dateInputValue(min))} - {formatDate(dateInputValue(max))}</strong></div>
      <div className="gantt-list">
        <div className="gantt-columns"><span>Task and assignment</span><span>Start</span><span>Timeline</span><span>End</span><span>Norm</span></div>
        {filtered.map(item => {
          const left = Math.max(0, ((item.start.getTime() - min.getTime()) / day) / totalDays * 100);
          const width = Math.max(3, (((item.end.getTime() - item.start.getTime()) / day) + 1) / totalDays * 100);
          const status = item.end < today ? 'Completed' : item.start > today ? 'Future' : 'Active';
          return <div className="gantt-row" key={`${item.employeeId}-${item.projectId}-${item.taskId}`}>
            <div className="gantt-label"><strong>{item.taskName ?? item.taskId}</strong><span>{session?.role === 'Employee' ? item.projectName ?? item.projectId : `${item.employeeName ?? item.employeeId} | ${item.projectName ?? item.projectId}`}</span></div>
            <time className="gantt-date">{formatDate(item.allocationStartDate)}</time>
            <div className="gantt-track"><div className={`gantt-bar gantt-${status.toLowerCase()}`} tabIndex={0} style={{ left: `${left}%`, width: `${width}%` }}><span className="gantt-bar-label">{status}</span><div className="gantt-tooltip" role="tooltip"><strong>{item.taskName ?? item.taskId}</strong><span>{item.employeeName ?? item.employeeId}</span><span>{formatDate(item.allocationStartDate)} - {formatDate(item.allocationEndDate)}</span><span>{formatNumber(item.allocatedHours)}h/day</span></div></div></div>
            <time className="gantt-date">{formatDate(item.allocationEndDate ?? item.allocationStartDate)}</time>
            <strong className="gantt-hours">{formatNumber(item.allocatedHours)}h/day</strong>
          </div>;
        })}
      </div>
    </div>}
  </section>;
}
