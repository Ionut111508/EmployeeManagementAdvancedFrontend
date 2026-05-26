import { Link, useParams } from 'react-router-dom';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber } from '../utils/format';

export function TaskDetailsPage() {
  const { projectId, taskId } = useParams();
  const tasks = useAsync(api.tasks, []);
  const allocations = useAsync(api.allocations, []);
  const timesheets = useAsync(api.timesheets, []);
  const task = (tasks.data ?? []).find(t => t.projectId === projectId && t.taskId === taskId);
  const taskAllocations = (allocations.data ?? []).filter(a => a.projectId === projectId && a.taskId === taskId);
  const taskTimesheets = (timesheets.data ?? []).filter(t => t.projectId === projectId && t.taskId === taskId);
  const totalAllocated = taskAllocations.reduce((sum, item) => sum + item.allocatedHours, 0);
  const totalWorked = taskTimesheets.reduce((sum, item) => sum + item.workedHours, 0);

  return <section className="page-stack">
<<<<<<< HEAD
    <PageHeader eyebrow="Task details" title={task?.taskName ?? 'Task details'} description="Information about task, project, estimates, allocations, and timesheets." />
=======
    <PageHeader eyebrow="Task details" title={task?.taskName ?? 'Task details'} description="Task, project, estimate, allocation, and timesheet information." />
>>>>>>> 0fd9f40032bec48bf6cfcca9de2800957d248042
    <Link className="btn-link" to="/tasks">Back to tasks</Link>
    <Status loading={tasks.loading} error={tasks.error} empty={!task && !tasks.loading} />
    {task && <>
      <div className="grid grid-3">
        <article className="card"><h2>Project</h2><p>{task.project?.projectName ?? '-'}</p></article>
        <article className="card"><h2>Estimated</h2><span className="badge">{formatNumber(task.estimatedHours)}h</span></article>
        <article className="card"><h2>Progress</h2><p>Allocated: {formatNumber(totalAllocated)}h/day</p><p>Worked: {formatNumber(totalWorked)}h</p></article>
      </div>
      <article className="card"><h2>Description</h2><p>{task.description?.taskDescriptionText ?? '-'}</p></article>
      <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Hours/day</th></tr></thead><tbody>{taskAllocations.map(a => <tr key={a.employeeId}><td>{a.employeeName ?? 'Unknown employee'}</td><td>{formatDate(a.allocationStartDate)} - {formatDate(a.allocationEndDate)}</td><td><span className="badge">{formatNumber(a.allocatedHours)}h</span></td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
