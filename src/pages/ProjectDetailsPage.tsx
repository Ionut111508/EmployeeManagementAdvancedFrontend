import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Clock3, Network } from 'lucide-react';
import { api } from '../api/endpoints';
import { loadVisibleAllocations, loadVisibleTimesheets } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { KpiCard } from '../components/ui/KpiCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber, percent } from '../utils/format';

export function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { session, access } = useAuth();

  const { data, loading, error } = useAsync(async () => {
    if (!projectId) throw new Error('Project id missing.');
    if (!session) throw new Error('Login is required.');
    const [project, tasks, allocations, timesheets] = await Promise.all([
      api.projectById(projectId),
      api.tasksVisibleTo(session.employeeId),
      loadVisibleAllocations(session, access),
      loadVisibleTimesheets(session, access)
    ]);
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const projectAllocations = allocations.filter(a => a.projectId === projectId);
    const projectTimesheets = timesheets.filter(t => t.projectId === projectId);
    const estimatedHours = projectTasks.reduce((sum, task) => sum + (task.estimatedHours ?? 0), 0);
    const workedHours = projectTimesheets.reduce((sum, sheet) => sum + sheet.workedHours, 0);
    const progress = estimatedHours > 0 ? Math.min(100, Math.round((workedHours / estimatedHours) * 100)) : 0;
    return { project, projectTasks, projectAllocations, estimatedHours, workedHours, progress };
  }, [projectId, session?.employeeId, access?.managedProjectIds.join('|')]);

  return <section className="page-stack">
    <PageHeader eyebrow="Project details" title={data?.project.projectName ?? 'Project'} description="Project details, tasks, allocations, and progress calculated from timesheets." actions={<Link className="btn secondary" to="/projects"><ArrowLeft size={16}/> Back</Link>} />
    <Status loading={loading} error={error} />
    {data && <>
      <div className="grid grid-4">
        <KpiCard icon={CheckSquare} label="Tasks" value={data.projectTasks.length} />
        <KpiCard icon={Network} label="Allocations" value={data.projectAllocations.length} />
        <KpiCard icon={Clock3} label="Estimated" value={`${formatNumber(data.estimatedHours)}h`} />
        <KpiCard icon={Clock3} label="Worked" value={`${formatNumber(data.workedHours)}h`} hint={percent(data.progress)} />
      </div>
      <div className="card"><h2>Progress</h2><div className="progress-track"><div className="progress-bar" style={{ width: `${data.progress}%` }} /></div><p className="muted progress-label">{percent(data.progress)} completed based on reported hours.</p></div>
      <div className="table-card"><h2>Tasks</h2><table className="data-table"><thead><tr><th>Task</th><th>Description</th><th>Estimated</th></tr></thead><tbody>{data.projectTasks.map(task => <tr key={task.taskId}><td><strong>{task.taskName}</strong><br/><span className="muted">{task.taskId}</span></td><td>{task.description?.taskDescriptionText ?? task.descriptionId}</td><td><span className="badge">{formatNumber(task.estimatedHours)}h</span></td></tr>)}</tbody></table></div>
      <div className="table-card"><h2>Allocations</h2><table className="data-table"><thead><tr><th>Employee</th><th>Task</th><th>Period</th><th>Hours/day</th></tr></thead><tbody>{data.projectAllocations.map(allocation => <tr key={`${allocation.employeeId}-${allocation.taskId}`}><td>{allocation.employeeName ?? allocation.employeeId}<br/><span className="muted">{allocation.employeeId}</span></td><td>{allocation.taskName ?? allocation.taskId}</td><td>{formatDate(allocation.allocationStartDate)} - {formatDate(allocation.allocationEndDate)}</td><td><span className="badge">{formatNumber(allocation.allocatedHours)}h</span></td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
