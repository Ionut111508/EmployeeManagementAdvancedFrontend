import { useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import { loadVisibleTimesheets } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber } from '../utils/format';

export function TimesheetsPage() {
  const { session, access } = useAuth();
  const [filters, setFilters] = useState({ employeeId: 'all', projectId: 'all', taskKey: 'all', startDate: '', endDate: '' });
  const timesheets = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return loadVisibleTimesheets(session, access);
  }, [session?.employeeId, access?.managedProjectIds.join('|')]);
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
      (!filters.startDate || workDate >= filters.startDate) &&
      (!filters.endDate || workDate <= filters.endDate);
  }), [timesheets.data, filters]);
  const totalHours = filteredTimesheets.reduce((sum, item) => sum + item.workedHours, 0);

  return <section className="page-stack">
    <PageHeader eyebrow="Timesheets" title="Timesheets" description="Worked hours reported by employees on tasks." />
    <div className="card filter-bar">
      <strong>Filters</strong>
      <select className="field" value={filters.employeeId} onChange={e => setFilters({ ...filters, employeeId: e.target.value })}><option value="all">All employees</option>{employeeOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <select className="field" value={filters.projectId} onChange={e => setFilters({ ...filters, projectId: e.target.value })}><option value="all">All projects</option>{projectOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
      <select className="field" value={filters.taskKey} onChange={e => setFilters({ ...filters, taskKey: e.target.value })}><option value="all">All tasks</option>{taskOptions.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select>
      <input className="field" type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
      <input className="field" type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
      <button className="btn secondary" type="button" onClick={() => setFilters({ employeeId: 'all', projectId: 'all', taskKey: 'all', startDate: '', endDate: '' })}>Clear</button>
      <span className="badge">{formatNumber(totalHours)}h</span>
    </div>
    <Status loading={timesheets.loading} error={timesheets.error} empty={filteredTimesheets.length === 0} />
    {timesheets.data && <div className="table-card"><table className="data-table"><thead><tr><th>Date</th><th>Employee</th><th>Project</th><th>Task</th><th>Hours</th></tr></thead><tbody>{filteredTimesheets.map(t => { const employee = (employees.data ?? []).find(e => e.employeeId === t.employeeId); const task = (tasks.data ?? []).find(x => x.projectId === t.projectId && x.taskId === t.taskId); return <tr key={`${t.employeeId}-${t.projectId}-${t.taskId}-${t.workDate}`}><td>{formatDate(t.workDate)}</td><td>{employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown employee'}</td><td>{task?.project?.projectName ?? 'Unknown project'}</td><td>{task?.taskName ?? 'Unknown task'}</td><td><span className="badge">{formatNumber(t.workedHours)}h</span></td></tr>; })}</tbody></table></div>}
  </section>;
}
