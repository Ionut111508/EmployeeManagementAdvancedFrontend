import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { loadVisibleAllocations } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import type { AllocationAvailability } from '../types/domain';
import { addDays, dateInputValue, formatDate, formatNumber, parseLocalDate } from '../utils/format';

function CapacityTable({ items, startDate, endDate, emptyText }: { items: AllocationAvailability[]; startDate: string; endDate: string; emptyText: string }) {
  if (items.length === 0) return <Status empty emptyText={emptyText} />;
  return <table className="data-table capacity-table"><thead><tr><th>Employee</th><th>Available interval</th><th>Free per day</th><th>Current load</th></tr></thead><tbody>{items.map(item => {
    const averageAllocated = item.workingDays > 0 ? item.existingAllocatedHours / item.workingDays : 0;
    return <tr key={item.employeeId}><td><strong>{item.fullName}</strong></td><td>{formatDate(startDate)} - {formatDate(endDate)}</td><td><span className="capacity-hours">{formatNumber(item.minimumDailyAvailableHours)}h/day</span><small>of {formatNumber(item.workNormHoursPerDay)}h/day</small></td><td>{averageAllocated > 0 ? `${formatNumber(averageAllocated)}h/day allocated` : 'Completely free'}</td></tr>;
  })}</tbody></table>;
}

export function AllocationsPage() {
  const { session, access, hasPermission } = useAuth();
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('active');
  const [capacityProjectId, setCapacityProjectId] = useState('');
  const [availabilityDates, setAvailabilityDates] = useState({
    startDate: dateInputValue(),
    endDate: dateInputValue(addDays(new Date(), 13))
  });
  const { data, loading, error } = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return loadVisibleAllocations(session, access);
  }, [session?.employeeId, access?.managedProjectIds.join('|')]);
  const visibleProjects = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.projectsVisibleTo(session.employeeId);
  }, [session?.employeeId]);

  useEffect(() => {
    if (session?.role === 'Manager' && !capacityProjectId && access?.managedProjectIds[0]) {
      setCapacityProjectId(access.managedProjectIds[0]);
    }
  }, [session?.role, access?.managedProjectIds.join('|'), capacityProjectId]);

  const employees = useMemo(() => Array.from(new Map((data ?? []).map(allocation => [allocation.employeeId, allocation.employeeName ?? 'Unknown employee'])).entries()).sort((a, b) => a[1].localeCompare(b[1])), [data]);
  const projects = useMemo(() => (visibleProjects.data ?? []).map(project => [project.projectId, project.projectName] as const), [visibleProjects.data]);
  const today = dateInputValue();
  const filtered = useMemo(() => (data ?? []).filter(allocation => {
    const start = allocation.allocationStartDate.slice(0, 10);
    const end = (allocation.allocationEndDate ?? allocation.allocationStartDate).slice(0, 10);
    const matchesStatus = periodFilter === 'all' ||
      (periodFilter === 'active' && start <= today && end >= today) ||
      (periodFilter === 'upcoming' && start > today) ||
      (periodFilter === 'past' && end < today);
    return (employeeFilter === 'all' || allocation.employeeId === employeeFilter) &&
      (projectFilter === 'all' || allocation.projectId === projectFilter) && matchesStatus;
  }), [data, employeeFilter, projectFilter, periodFilter, today]);
  const windowDays = Math.max(1, Math.round((parseLocalDate(availabilityDates.endDate).getTime() - parseLocalDate(availabilityDates.startDate).getTime()) / 86400000) + 1);
  const overview = useAsync(() => {
    if (!session || !hasPermission('availability.view')) return Promise.resolve(null);
    if (session.role === 'Manager' && !capacityProjectId) return Promise.resolve(null);
    return api.resourcePlanningOverview({ startDate: availabilityDates.startDate, windowDays, projectId: capacityProjectId || null });
  }, [session?.employeeId, session?.role, capacityProjectId, availabilityDates.startDate, availabilityDates.endDate]);
  const availableEmployees = useMemo(() => [...(overview.data?.idleEmployees ?? []), ...(overview.data?.underutilizedEmployees ?? [])]
    .sort((a, b) => b.minimumDailyAvailableHours - a.minimumDailyAvailableHours || b.availableHours - a.availableHours || a.fullName.localeCompare(b.fullName)), [overview.data]);

  function clearRecordFilters() {
    setEmployeeFilter('all');
    setProjectFilter('all');
    setPeriodFilter('active');
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Resource planning" title="Allocations" description="See current assignments, unused capacity and employees becoming available soon." actions={hasPermission('allocations.manage') || hasPermission('allocations.manage.managed') ? <Link className="btn" to="/allocations/create">Allocate employee</Link> : undefined} />
    <div className="card filter-panel"><strong>Allocation records</strong><div className="filter-bar">{session?.role !== 'Employee' && <label>Employee<select className="field" value={employeeFilter} onChange={event => setEmployeeFilter(event.target.value)}><option value="all">All employees</option>{employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>}<label>Project<select className="field" value={projectFilter} onChange={event => setProjectFilter(event.target.value)}><option value="all">All projects</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><label>Period<select className="field" value={periodFilter} onChange={event => setPeriodFilter(event.target.value)}><option value="active">Active now</option><option value="upcoming">Upcoming</option><option value="past">Past</option><option value="all">All periods</option></select></label><button className="btn secondary" type="button" onClick={clearRecordFilters}>Reset</button><span className="badge">{filtered.length} records</span></div></div>

    {hasPermission('availability.view') && <div className="table-card">
      <div className="gantt-header"><div><h2>Available employees</h2><p className="muted">Employees are ordered by the safe number of free hours per day.</p></div><span className="badge">{availableEmployees.length} available</span></div>
      <div className="filter-bar">
        <label>Project<select className="field" value={capacityProjectId} onChange={event => setCapacityProjectId(event.target.value)}>{session?.role === 'Admin' && <option value="">All company</option>}{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label>From<input className="field" type="date" min={today} value={availabilityDates.startDate} onChange={event => setAvailabilityDates({ ...availabilityDates, startDate: event.target.value, endDate: availabilityDates.endDate < event.target.value ? event.target.value : availabilityDates.endDate })} /></label>
        <label>To<input className="field" type="date" min={availabilityDates.startDate} value={availabilityDates.endDate} onChange={event => setAvailabilityDates({ ...availabilityDates, endDate: event.target.value })} /></label>
      </div>
      <Status loading={overview.loading} error={overview.error} />
      {overview.data && <div className="capacity-sections">
        <section><CapacityTable items={availableEmployees} startDate={overview.data.currentStartDate} endDate={overview.data.currentEndDate} emptyText="No employee has free capacity in this interval." /></section>
        {overview.data.becomingAvailableEmployees.length > 0 && <section><div className="section-heading"><div><h3>More capacity in the next interval</h3><p className="muted">These employees become more available between {formatDate(overview.data.futureStartDate)} and {formatDate(overview.data.futureEndDate)}.</p></div><span className="badge">{overview.data.becomingAvailableEmployees.length}</span></div><CapacityTable items={overview.data.becomingAvailableEmployees} startDate={overview.data.futureStartDate} endDate={overview.data.futureEndDate} emptyText="No additional availability detected." /></section>}
      </div>}
    </div>}

    <Status loading={loading} error={error} empty={filtered.length === 0} />
    {data && filtered.length > 0 && <div className="table-card"><div className="gantt-header"><h2>Allocation records</h2><span className="badge">{filtered.length}</span></div><table className="data-table"><thead><tr><th>Employee</th><th>Project</th><th>Task</th><th>Period</th><th>Hours/day</th></tr></thead><tbody>{filtered.map(allocation => <tr key={`${allocation.employeeId}-${allocation.projectId}-${allocation.taskId}`}><td>{allocation.employeeName ?? 'Unknown employee'}</td><td>{allocation.projectName ?? 'Unknown project'}</td><td>{allocation.taskName ?? 'Unknown task'}</td><td>{formatDate(allocation.allocationStartDate)} - {formatDate(allocation.allocationEndDate)}</td><td><span className="badge">{formatNumber(allocation.allocatedHours)}h</span></td></tr>)}</tbody></table></div>}
  </section>;
}
