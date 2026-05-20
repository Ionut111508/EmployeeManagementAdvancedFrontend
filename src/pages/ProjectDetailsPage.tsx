import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Clock3, Network } from 'lucide-react';
import { api } from '../api/endpoints';
import { KpiCard } from '../components/ui/KpiCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { employeeName, formatDate, formatNumber, percent } from '../utils/format';

export function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const { data, loading, error } = useAsync(async () => {
    if (!projectId) throw new Error('Project id missing.');
    const [project, tasks, allocations, timesheets] = await Promise.all([
      api.projectById(projectId),
      api.tasks(),
      api.allocations(),
      api.timesheets()
    ]);
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const projectAllocations = allocations.filter(a => a.projectId === projectId);
    const projectTimesheets = timesheets.filter(t => t.projectId === projectId);
    const estimatedHours = projectTasks.reduce((sum, task) => sum + (task.estimatedHours ?? 0), 0);
    const workedHours = projectTimesheets.reduce((sum, sheet) => sum + sheet.workedHours, 0);
    const progress = estimatedHours > 0 ? Math.min(100, Math.round((workedHours / estimatedHours) * 100)) : 0;
    return { project, projectTasks, projectAllocations, projectTimesheets, estimatedHours, workedHours, progress };
  }, [projectId]);

  return <section className="page-stack">
    <PageHeader eyebrow="Project details" title={data?.project.projectName ?? 'Project'} description="Detalii proiect, task-uri, alocări și progres calculat din pontaj." actions={<Link className="btn secondary" to="/projects"><ArrowLeft size={16}/> Back</Link>} />
    <Status loading={loading} error={error} />
    {data && <>
      <div className="grid grid-4">
        <KpiCard icon={CheckSquare} label="Tasks" value={data.projectTasks.length} />
        <KpiCard icon={Network} label="Allocations" value={data.projectAllocations.length} />
        <KpiCard icon={Clock3} label="Estimated" value={`${formatNumber(data.estimatedHours)}h`} />
        <KpiCard icon={Clock3} label="Worked" value={`${formatNumber(data.workedHours)}h`} hint={percent(data.progress)} />
      </div>
      <div className="card">
        <h2>Progress</h2>
        <div className="progress-track"><div className="progress-bar" style={{ width: `${data.progress}%` }} /></div>
        <p className="muted progress-label">{percent(data.progress)} completat pe baza orelor pontate.</p>
      </div>
      <div className="table-card"><h2>Tasks</h2><table className="data-table"><thead><tr><th>Task</th><th>Description</th><th>Estimated</th></tr></thead><tbody>{data.projectTasks.map(task => <tr key={task.taskId}><td><strong>{task.taskName}</strong><br/><span className="muted">{task.taskId}</span></td><td>{task.description?.taskDescriptionText ?? task.descriptionId}</td><td><span className="badge">{formatNumber(task.estimatedHours)}h</span></td></tr>)}</tbody></table></div>
      <div className="table-card"><h2>Allocations</h2><table className="data-table"><thead><tr><th>Employee</th><th>Task</th><th>Period</th><th>Hours/day</th></tr></thead><tbody>{data.projectAllocations.map(allocation => <tr key={`${allocation.employeeId}-${allocation.taskId}`}><td>{employeeName(allocation.employee)}<br/><span className="muted">{allocation.employeeId}</span></td><td>{allocation.taskItem?.taskName ?? allocation.taskId}</td><td>{formatDate(allocation.allocationStartDate)} - {formatDate(allocation.allocationEndDate)}</td><td><span className="badge">{formatNumber(allocation.allocatedHours)}h</span></td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
