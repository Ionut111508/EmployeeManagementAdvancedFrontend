import { useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import { loadVisibleAllocations } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber } from '../utils/format';

export function AllocationsPage() {
  const { session, access, hasPermission } = useAuth();
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [availabilityDates, setAvailabilityDates] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });
  const { data, loading, error } = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return loadVisibleAllocations(session, access);
  }, [session?.employeeId, access?.managedProjectIds.join('|')]);

  const employees = useMemo(() => Array.from(new Map((data ?? []).map(a => [a.employeeId, a.employeeName ?? 'Unknown employee'])).entries()), [data]);
  const projects = useMemo(() => Array.from(new Map((data ?? []).map(a => [a.projectId, a.projectName ?? 'Unknown project'])).entries()), [data]);
  const filtered = useMemo(() => (data ?? []).filter(a => (employeeFilter === 'all' || a.employeeId === employeeFilter) && (projectFilter === 'all' || a.projectId === projectFilter)), [data, employeeFilter, projectFilter]);
  const totalHoursPerDay = filtered.reduce((sum, item) => sum + item.allocatedHours, 0);
  const availabilityProjectId = projectFilter !== 'all' ? projectFilter : session?.role === 'Manager' ? access?.managedProjectIds[0] : null;
  const underutilized = useAsync(() => {
    if (!session || !hasPermission('availability.view')) return Promise.resolve([]);
    return api.underutilizedEmployees({
      projectId: availabilityProjectId,
      startDate: availabilityDates.startDate,
      endDate: availabilityDates.endDate,
      requiredHoursPerDay: 1,
      onlyProjectEmployees: session.role === 'Manager'
    });
  }, [session?.employeeId, availabilityProjectId, availabilityDates.startDate, availabilityDates.endDate]);

  return <section className="page-stack">
    <PageHeader eyebrow="Resource planning" title="Allocations" description="Allocations visible for your current role." />
    <div className="card filter-bar"><strong>Filters</strong><select className="field" value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}><option value="all">All employees</option>{employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><select className="field" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}><option value="all">All projects</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><span className="badge">Total: {formatNumber(totalHoursPerDay)}h/day</span></div>
    {hasPermission('availability.view') && <div className="table-card">
      <div className="gantt-header"><h2>Employees with free capacity</h2><span className="badge">{underutilized.data?.length ?? 0} available</span></div>
      <div className="filter-bar">
        <input className="field" type="date" value={availabilityDates.startDate} onChange={e => setAvailabilityDates({ ...availabilityDates, startDate: e.target.value })} />
        <input className="field" type="date" value={availabilityDates.endDate} onChange={e => setAvailabilityDates({ ...availabilityDates, endDate: e.target.value })} />
        <span className="muted">Project scope: {availabilityProjectId ?? 'company'}</span>
      </div>
      <Status loading={underutilized.loading} error={underutilized.error} empty={underutilized.data?.length === 0} />
      {(underutilized.data ?? []).length > 0 && <table className="data-table"><thead><tr><th>Employee</th><th>Status</th><th>Capacity</th><th>Allocated</th><th>Free</th><th>Min daily free</th></tr></thead><tbody>{(underutilized.data ?? []).map(item => <tr key={item.employeeId}><td><strong>{item.fullName}</strong></td><td><span className="badge">{item.status}</span></td><td>{formatNumber(item.capacityHours)}h</td><td>{formatNumber(item.existingAllocatedHours)}h</td><td>{formatNumber(item.availableHours)}h</td><td>{formatNumber(item.minimumDailyAvailableHours)}h/day</td></tr>)}</tbody></table>}
    </div>}
    <Status loading={loading} error={error} empty={filtered.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Project</th><th>Task</th><th>Period</th><th>Hours/day</th></tr></thead><tbody>{filtered.map(a => <tr key={`${a.employeeId}-${a.projectId}-${a.taskId}`}><td>{a.employeeName ?? 'Unknown employee'}</td><td>{a.projectName ?? 'Unknown project'}</td><td>{a.taskName ?? 'Unknown task'}</td><td>{formatDate(a.allocationStartDate)} - {formatDate(a.allocationEndDate)}</td><td><span className="badge">{formatNumber(a.allocatedHours)}h</span></td></tr>)}</tbody></table></div>}
  </section>;
}
