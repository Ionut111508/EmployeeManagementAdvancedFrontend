import { useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import { loadVisibleAllocations } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber } from '../utils/format';

export function AllocationsPage() {
  const { session, access } = useAuth();
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const { data, loading, error } = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return loadVisibleAllocations(session, access);
  }, [session?.employeeId, access?.managedProjectIds.join('|')]);

  const employees = useMemo(() => Array.from(new Map((data ?? []).map(a => [a.employeeId, a.employeeName ?? 'Unknown employee'])).entries()), [data]);
  const projects = useMemo(() => Array.from(new Map((data ?? []).map(a => [a.projectId, a.projectName ?? 'Unknown project'])).entries()), [data]);
  const filtered = useMemo(() => (data ?? []).filter(a => (employeeFilter === 'all' || a.employeeId === employeeFilter) && (projectFilter === 'all' || a.projectId === projectFilter)), [data, employeeFilter, projectFilter]);
  const totalHoursPerDay = filtered.reduce((sum, item) => sum + item.allocatedHours, 0);

  return <section className="page-stack">
    <PageHeader eyebrow="Resource planning" title="Allocations" description="Allocations visible for your current role." />
    <div className="card filter-bar"><strong>Filters</strong><select className="field" value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}><option value="all">All employees</option>{employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><select className="field" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}><option value="all">All projects</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><span className="badge">Total: {formatNumber(totalHoursPerDay)}h/day</span></div>
    <Status loading={loading} error={error} empty={filtered.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Project</th><th>Task</th><th>Period</th><th>Hours/day</th></tr></thead><tbody>{filtered.map(a => <tr key={`${a.employeeId}-${a.projectId}-${a.taskId}`}><td>{a.employeeName ?? 'Unknown employee'}</td><td>{a.projectName ?? 'Unknown project'}</td><td>{a.taskName ?? 'Unknown task'}</td><td>{formatDate(a.allocationStartDate)} - {formatDate(a.allocationEndDate)}</td><td><span className="badge">{formatNumber(a.allocatedHours)}h</span></td></tr>)}</tbody></table></div>}
  </section>;
}
