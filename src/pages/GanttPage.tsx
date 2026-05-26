import { useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber } from '../utils/format';

const day = 1000 * 60 * 60 * 24;
const today = new Date();

export function GanttPage() {
  const [projectFilter, setProjectFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, loading, error } = useAsync(async () => {
    const allocations = await api.allocations();
    const ranges = allocations.map(a => ({ ...a, start: new Date(a.allocationStartDate), end: new Date(a.allocationEndDate ?? a.allocationStartDate) }));
    return ranges;
  }, []);

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
    <PageHeader eyebrow="Planning" title="Gantt Chart" description="Filter the plan by project, employee, and timeline status." />
    <div className="card filter-bar"><strong>Filters</strong><select className="field" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}><option value="all">All projects</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><select className="field" value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}><option value="all">All employees</option>{employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><select className="field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="active">Active now</option><option value="future">Future</option><option value="closed">Closed / overdue</option></select><span className="badge">{filtered.length} allocations</span></div>
    <Status loading={loading} error={error} empty={filtered.length === 0} />
    {data && filtered.length > 0 && <div className="table-card gantt-card">
      <div className="gantt-header"><strong>{formatDate(min.toISOString())}</strong><span className="muted">Planning interval</span><strong>{formatDate(max.toISOString())}</strong></div>
      <div className="gantt-list">
        {filtered.map(item => {
          const left = Math.max(0, ((item.start.getTime() - min.getTime()) / day) / totalDays * 100);
          const width = Math.max(4, (((item.end.getTime() - item.start.getTime()) / day) + 1) / totalDays * 100);
          return <div className="gantt-row" key={`${item.employeeId}-${item.projectId}-${item.taskId}`}>
            <div className="gantt-label"><strong>{item.taskName ?? item.taskId}</strong><span>{item.employeeName ?? item.employeeId} · {item.projectName ?? item.projectId} · {formatNumber(item.allocatedHours)}h/day</span></div>
            <div className="gantt-track"><div className="gantt-bar" style={{ left: `${left}%`, width: `${width}%` }}>{formatDate(item.allocationStartDate)}</div></div>
          </div>;
        })}
      </div>
    </div>}
  </section>;
}
