import { FormEvent, useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import { loadVisibleAllocations, loadVisibleTimesheets } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { dateInputValue, formatDate, formatNumber } from '../utils/format';
import type { Timesheet, TimesheetStatus } from '../types/domain';

export function TimesheetsPage() {
  const { session, access, hasPermission } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState({ employeeId: 'all', projectId: 'all', taskKey: 'all', status: 'all', startDate: '', endDate: '' });
  const [entry, setEntry] = useState({ taskKey: '', workDate: dateInputValue(), workedHours: '1' });
  const timesheets = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return loadVisibleTimesheets(session, access);
  }, [session?.employeeId, access?.managedProjectIds.join('|'), refreshKey]);
  const allocations = useAsync(() => {
    if (!session || session.role !== 'Employee') return Promise.resolve([]);
    return loadVisibleAllocations(session, access);
  }, [session?.employeeId, session?.role, refreshKey]);
  const employees = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.employeesVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const tasks = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.tasksVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const employeeOptions = useMemo(() => Array.from(new Map((timesheets.data ?? []).map(item => {
    const employee = (employees.data ?? []).find(e => e.employeeId === item.employeeId);
    return [item.employeeId, employee ? `${employee.firstName} ${employee.lastName}` : item.employeeId];
  })).entries()), [timesheets.data, employees.data]);
  const projectOptions = useMemo(() => Array.from(new Map((timesheets.data ?? []).map(item => {
    const task = (tasks.data ?? []).find(t => t.projectId === item.projectId && t.taskId === item.taskId);
    return [item.projectId, task?.project?.projectName ?? item.projectId];
  })).entries()), [timesheets.data, tasks.data]);
  const taskOptions = useMemo(() => Array.from(new Map((timesheets.data ?? []).map(item => {
    const task = (tasks.data ?? []).find(t => t.projectId === item.projectId && t.taskId === item.taskId);
    return [`${item.projectId}|${item.taskId}`, task?.taskName ?? item.taskId];
  })).entries()), [timesheets.data, tasks.data]);
  const filteredTimesheets = useMemo(() => (timesheets.data ?? []).filter(item => {
    const workDate = item.workDate.slice(0, 10);
    return (filters.employeeId === 'all' || item.employeeId === filters.employeeId) &&
      (filters.projectId === 'all' || item.projectId === filters.projectId) &&
      (filters.taskKey === 'all' || `${item.projectId}|${item.taskId}` === filters.taskKey) &&
      (filters.status === 'all' || item.status === filters.status) &&
      (!filters.startDate || workDate >= filters.startDate) &&
      (!filters.endDate || workDate <= filters.endDate);
  }), [timesheets.data, filters]);
  const totalHours = filteredTimesheets.reduce((sum, item) => sum + item.workedHours, 0);
  const ownAllocationOptions = useMemo(() => (allocations.data ?? []).map(allocation => {
    const task = (tasks.data ?? []).find(item => item.projectId === allocation.projectId && item.taskId === allocation.taskId);
    return { key: `${allocation.projectId}|${allocation.taskId}`, label: `${task?.project?.projectName ?? allocation.projectId} - ${task?.taskName ?? allocation.taskId}` };
  }), [allocations.data, tasks.data]);

  async function submitTimesheet(event: FormEvent) {
    event.preventDefault();
    if (!session || !entry.taskKey) return;
    const [projectId, taskId] = entry.taskKey.split('|');
    try {
      await api.createTimesheet({ projectId, taskId, employeeId: session.employeeId, workDate: entry.workDate, workedHours: Number(entry.workedHours) });
      setMessage('Timesheet submitted and waiting for approval.');
      setRefreshKey(value => value + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit timesheet.');
    }
  }

  async function review(item: Timesheet, status: 'Approved' | 'Rejected') {
    const key = timesheetKey(item);
    try {
      await api.reviewTimesheet(item, { status, comment: reviewComments[key] || null });
      setMessage(`Timesheet ${status.toLowerCase()}.`);
      setRefreshKey(value => value + 1);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not review timesheet.');
    }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Timesheets" title="Timesheets" description="Submit, review and track worked hours on project tasks." />
    {session?.role === 'Employee' && <form className="card form-grid" onSubmit={submitTimesheet}>
      <h2>Submit worked hours</h2>
      <label>Task<select className="field" value={entry.taskKey} onChange={event => setEntry({ ...entry, taskKey: event.target.value })} required><option value="">Select an allocated task</option>{ownAllocationOptions.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>
      <label>Work date<input className="field" type="date" value={entry.workDate} max={dateInputValue()} onChange={event => setEntry({ ...entry, workDate: event.target.value })} required /></label>
      <label>Worked hours<input className="field" type="number" min="0.25" max="12" step="0.25" value={entry.workedHours} onChange={event => setEntry({ ...entry, workedHours: event.target.value })} required /></label>
      <button className="btn" type="submit">Submit for approval</button>
    </form>}
    {message && <div className="status-card">{message}</div>}
    <div className="card filter-bar">
      <strong>Filters</strong>
      {session?.role !== 'Employee' && <select className="field" value={filters.employeeId} onChange={e => setFilters({ ...filters, employeeId: e.target.value })}><option value="all">All employees</option>{employeeOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>}
      <select className="field" value={filters.projectId} onChange={e => setFilters({ ...filters, projectId: e.target.value })}><option value="all">All projects</option>{projectOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <select className="field" value={filters.taskKey} onChange={e => setFilters({ ...filters, taskKey: e.target.value })}><option value="all">All tasks</option>{taskOptions.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select>
      <select className="field" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="all">All statuses</option>{(['Pending', 'Approved', 'Rejected'] as TimesheetStatus[]).map(status => <option key={status}>{status}</option>)}</select>
      <input className="field" type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
      <input className="field" type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
      <button className="btn secondary" type="button" onClick={() => setFilters({ employeeId: 'all', projectId: 'all', taskKey: 'all', status: 'all', startDate: '', endDate: '' })}>Clear</button>
      <span className="badge">{formatNumber(totalHours)}h</span>
    </div>
    <Status loading={timesheets.loading} error={timesheets.error} empty={filteredTimesheets.length === 0} />
    {timesheets.data && <div className="table-card"><table className="data-table"><thead><tr><th>Date</th><th>Employee</th><th>Project</th><th>Task</th><th>Hours</th><th>Status</th>{hasPermission('timesheets.approve') && <th>Review</th>}</tr></thead><tbody>{filteredTimesheets.map(t => {
      const employee = (employees.data ?? []).find(e => e.employeeId === t.employeeId);
      const task = (tasks.data ?? []).find(x => x.projectId === t.projectId && x.taskId === t.taskId);
      const key = timesheetKey(t);
      return <tr key={key}><td>{formatDate(t.workDate)}</td><td>{employee ? `${employee.firstName} ${employee.lastName}` : t.employeeId}</td><td>{task?.project?.projectName ?? t.projectId}</td><td>{task?.taskName ?? t.taskId}</td><td><span className="badge">{formatNumber(t.workedHours)}h</span></td><td><span className={`badge timesheet-${t.status.toLowerCase()}`}>{t.status}</span>{t.reviewComment && <small className="review-note">{t.reviewComment}</small>}</td>{hasPermission('timesheets.approve') && <td>{t.status === 'Pending' ? <div className="review-controls"><input className="field" placeholder="Optional review note" value={reviewComments[key] ?? ''} onChange={event => setReviewComments(current => ({ ...current, [key]: event.target.value }))} /><div className="table-actions"><button className="btn" type="button" onClick={() => review(t, 'Approved')}>Approve</button><button className="btn danger" type="button" onClick={() => review(t, 'Rejected')}>Reject</button></div></div> : <span className="muted">Reviewed</span>}</td>}</tr>;
    })}</tbody></table></div>}
  </section>;
}

function timesheetKey(item: Timesheet) {
  return `${item.employeeId}-${item.projectId}-${item.taskId}-${item.workDate.slice(0, 10)}`;
}
