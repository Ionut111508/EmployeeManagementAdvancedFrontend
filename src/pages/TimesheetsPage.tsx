import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber } from '../utils/format';

export function TimesheetsPage() {
  const timesheets = useAsync(api.timesheets, []);
  const employees = useAsync(api.employees, []);
  const tasks = useAsync(api.tasks, []);

  return <section className="page-stack">
    <PageHeader eyebrow="Pontaj" title="Timesheets" description="Ore lucrate raportate de angajati pe task-uri." />
    <Status loading={timesheets.loading} error={timesheets.error} empty={timesheets.data?.length === 0} />
    {timesheets.data && <div className="table-card"><table className="data-table"><thead><tr><th>Date</th><th>Employee</th><th>Project</th><th>Task</th><th>Hours</th></tr></thead><tbody>{timesheets.data.map(t => { const employee = (employees.data ?? []).find(e => e.employeeId === t.employeeId); const task = (tasks.data ?? []).find(x => x.projectId === t.projectId && x.taskId === t.taskId); return <tr key={`${t.employeeId}-${t.projectId}-${t.taskId}-${t.workDate}`}><td>{formatDate(t.workDate)}</td><td>{employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown employee'}</td><td>{task?.project?.projectName ?? 'Unknown project'}</td><td>{task?.taskName ?? 'Unknown task'}</td><td><span className="badge">{formatNumber(t.workedHours)}h</span></td></tr>; })}</tbody></table></div>}
  </section>;
}
