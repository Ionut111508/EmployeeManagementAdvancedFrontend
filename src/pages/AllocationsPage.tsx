import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { loadVisibleAllocations } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import type { AllocationAvailability } from '../types/domain';
import { addDays, dateInputValue, formatDate, formatNumber } from '../utils/format';

function CapacityTable({ items, emptyText }: { items: AllocationAvailability[]; emptyText: string }) {
  if (items.length === 0) return <Status empty emptyText={emptyText} />;
  return <table className="data-table"><thead><tr><th>Employee</th><th>Project relation</th><th>Capacity</th><th>Allocated</th><th>Free</th><th>Daily free</th></tr></thead><tbody>{items.map(item => <tr key={item.employeeId}><td><strong>{item.fullName}</strong><br/><span className="muted">{item.status}</span></td><td>{item.isAssignedToProject ? 'Already on project' : 'Available company-wide'}</td><td>{formatNumber(item.capacityHours)}h</td><td>{formatNumber(item.existingAllocatedHours)}h</td><td>{formatNumber(item.availableHours)}h</td><td><span className="badge">{formatNumber(item.minimumDailyAvailableHours)}h/day</span></td></tr>)}</tbody></table>;
}

export function AllocationsPage() {
  const { session, access, hasPermission } = useAuth();
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [availabilityDates, setAvailabilityDates] = useState({
    startDate: dateInputValue(),
    endDate: dateInputValue(addDays(new Date(), 13))
  });
  const { data, loading, error } = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return loadVisibleAllocations(session, access);
  }, [session?.employeeId, access?.managedProjectIds.join('|')]);

  const employees = useMemo(() => Array.from(new Map((data ?? []).map(allocation => [allocation.employeeId, allocation.employeeName ?? 'Unknown employee'])).entries()), [data]);
  const projects = useMemo(() => Array.from(new Map((data ?? []).map(allocation => [allocation.projectId, allocation.projectName ?? 'Unknown project'])).entries()), [data]);
  const today = dateInputValue();
  const filtered = useMemo(() => (data ?? []).filter(allocation => {
    const start = allocation.allocationStartDate.slice(0, 10);
    const end = (allocation.allocationEndDate ?? allocation.allocationStartDate).slice(0, 10);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && start <= today && end >= today) ||
      (statusFilter === 'upcoming' && start > today) ||
      (statusFilter === 'past' && end < today);
    return (employeeFilter === 'all' || allocation.employeeId === employeeFilter) &&
      (projectFilter === 'all' || allocation.projectId === projectFilter) && matchesStatus;
  }), [data, employeeFilter, projectFilter, statusFilter, today]);
  const currentHoursPerDay = filtered
    .filter(item => item.allocationStartDate.slice(0, 10) <= today && (item.allocationEndDate ?? item.allocationStartDate).slice(0, 10) >= today)
    .reduce((sum, item) => sum + item.allocatedHours, 0);
  const availabilityProjectId = projectFilter !== 'all' ? projectFilter : session?.role === 'Manager' ? access?.managedProjectIds[0] : null;
  const windowDays = Math.max(1, Math.round((new Date(availabilityDates.endDate).getTime() - new Date(availabilityDates.startDate).getTime()) / 86400000) + 1);
  const overview = useAsync(() => {
    if (!session || !hasPermission('availability.view')) return Promise.resolve(null);
    return api.resourcePlanningOverview({ startDate: availabilityDates.startDate, windowDays, projectId: availabilityProjectId });
  }, [session?.employeeId, availabilityProjectId, availabilityDates.startDate, availabilityDates.endDate]);

  return <section className="page-stack">
    <PageHeader eyebrow="Resource planning" title="Allocations" description="See current assignments, unused capacity and employees becoming available soon." actions={hasPermission('allocations.manage') || hasPermission('allocations.manage.managed') ? <Link className="btn" to="/allocations/create">Allocate employee</Link> : undefined} />
    <div className="card filter-bar"><strong>Allocation filters</strong>{session?.role !== 'Employee' && <select className="field" value={employeeFilter} onChange={event => setEmployeeFilter(event.target.value)}><option value="all">All employees</option>{employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>}<select className="field" value={projectFilter} onChange={event => setProjectFilter(event.target.value)}><option value="all">All projects</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><select className="field" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="active">Active now</option><option value="upcoming">Upcoming</option><option value="past">Past</option><option value="all">All periods</option></select><span className="badge">Planned today: {formatNumber(currentHoursPerDay)}h/day</span></div>

    {hasPermission('availability.view') && <div className="table-card">
      <div className="gantt-header"><div><h2>Capacity outlook</h2><p className="muted">The next window is compared automatically with the selected current window.</p></div><span className="badge">Project: {availabilityProjectId ?? 'company'}</span></div>
      <div className="filter-bar">
        <label className="muted">From <input className="field" type="date" value={availabilityDates.startDate} onChange={event => setAvailabilityDates({ ...availabilityDates, startDate: event.target.value })} /></label>
        <label className="muted">To <input className="field" type="date" value={availabilityDates.endDate} onChange={event => setAvailabilityDates({ ...availabilityDates, endDate: event.target.value })} /></label>
      </div>
      <Status loading={overview.loading} error={overview.error} />
      {overview.data && <div className="capacity-sections">
        <section><div className="section-heading"><div><h3>Idle employees</h3><p className="muted">No allocated hours between {formatDate(overview.data.currentStartDate)} and {formatDate(overview.data.currentEndDate)}.</p></div><span className="badge">{overview.data.idleEmployees.length}</span></div><CapacityTable items={overview.data.idleEmployees} emptyText="Nobody is fully idle in this window." /></section>
        <section><div className="section-heading"><div><h3>Partially loaded</h3><p className="muted">Employees who still have safe daily capacity for another task.</p></div><span className="badge">{overview.data.underutilizedEmployees.length}</span></div><CapacityTable items={overview.data.underutilizedEmployees} emptyText="Nobody has partial capacity in this window." /></section>
        <section><div className="section-heading"><div><h3>Becoming available</h3><p className="muted">Capacity increases between {formatDate(overview.data.futureStartDate)} and {formatDate(overview.data.futureEndDate)}.</p></div><span className="badge">{overview.data.becomingAvailableEmployees.length}</span></div><CapacityTable items={overview.data.becomingAvailableEmployees} emptyText="No additional availability detected in the next window." /></section>
      </div>}
    </div>}

    <Status loading={loading} error={error} empty={filtered.length === 0} />
    {data && filtered.length > 0 && <div className="table-card"><div className="gantt-header"><h2>Allocation records</h2><span className="badge">{filtered.length}</span></div><table className="data-table"><thead><tr><th>Employee</th><th>Project</th><th>Task</th><th>Period</th><th>Hours/day</th></tr></thead><tbody>{filtered.map(allocation => <tr key={`${allocation.employeeId}-${allocation.projectId}-${allocation.taskId}`}><td>{allocation.employeeName ?? 'Unknown employee'}</td><td>{allocation.projectName ?? 'Unknown project'}</td><td>{allocation.taskName ?? 'Unknown task'}</td><td>{formatDate(allocation.allocationStartDate)} - {formatDate(allocation.allocationEndDate)}</td><td><span className="badge">{formatNumber(allocation.allocatedHours)}h</span></td></tr>)}</tbody></table></div>}
  </section>;
}
