import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/endpoints';
import { loadVisibleAllocations } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber } from '../utils/format';
import type { TaskStatus } from '../types/domain';

const transitions: Record<TaskStatus, TaskStatus[]> = {
  Backlog: ['Ready', 'Cancelled'],
  Ready: ['InProgress', 'Blocked', 'Cancelled'],
  InProgress: ['Blocked', 'Completed', 'Cancelled'],
  Blocked: ['InProgress', 'Cancelled'],
  Delayed: ['InProgress', 'Completed', 'Cancelled'],
  Completed: ['InProgress'],
  Cancelled: ['Backlog']
};

export function TaskDetailsPage() {
  const { projectId, taskId } = useParams();
  const { session, access, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const tasks = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.tasksVisibleTo(session.employeeId);
  }, [session?.employeeId, refreshKey]);
  const allocations = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return loadVisibleAllocations(session, access);
  }, [session?.employeeId, access?.managedProjectIds.join('|')]);
  const task = (tasks.data ?? []).find(t => t.projectId === projectId && t.taskId === taskId);
  const taskAllocations = (allocations.data ?? []).filter(a => a.projectId === projectId && a.taskId === taskId);
  const totalAllocated = taskAllocations.reduce((sum, item) => sum + item.allocatedHours, 0);
  const workflowStatus = task?.workflowStatus ?? task?.status ?? 'Backlog';
  const canManageStatus = hasPermission('tasks.status.manage') || hasPermission('tasks.status.manage.managed');
  const canDeleteTask = hasPermission('tasks.manage') || hasPermission('tasks.manage.managed');

  async function changeStatus(status: TaskStatus) {
    if (!projectId || !taskId) return;
    try {
      await api.updateTaskStatus(projectId, taskId, status);
      setStatusMessage(`Task moved to ${status}.`);
      setRefreshKey(value => value + 1);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Could not update task status.');
    }
  }

  async function deleteTask() {
    if (!projectId || !taskId) return;
    setDeleting(true);
    setStatusMessage(null);
    try {
      await api.deleteTask(projectId, taskId);
      navigate('/tasks');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Could not delete task.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Task details" title={task?.taskName ?? 'Task details'} description="Task, project, estimate, allocation, and timesheet information." actions={canDeleteTask && task ? <button className="btn danger" type="button" onClick={() => setConfirmDelete(true)}>Delete task</button> : undefined} />
    <Link className="btn-link" to="/tasks">Back to tasks</Link>
    <Status loading={tasks.loading} error={tasks.error} empty={!task && !tasks.loading} />
    {statusMessage && <div className="status-card">{statusMessage}</div>}
    {task?.status === 'Delayed' && <div className="status-card delayed-notice"><strong>Task delayed</strong><span>The deadline passed with {formatNumber(task.remainingHours)}h still required.</span></div>}
    {confirmDelete && task && <div className="status-card status-error delete-confirmation"><div><strong>Delete {task.taskName}?</strong><p>This removes {taskAllocations.length} allocation(s) and immediately returns those employees to the available capacity pool. Tasks with submitted timesheets are protected and cannot be deleted.</p></div><div className="table-actions"><button className="btn danger" type="button" disabled={deleting} onClick={deleteTask}>{deleting ? 'Deleting...' : 'Confirm delete'}</button><button className="btn secondary" type="button" disabled={deleting} onClick={() => setConfirmDelete(false)}>Cancel</button></div></div>}
    {task && <>
      <div className="grid grid-3">
        <article className="card"><h2>Project</h2><p>{task.project?.projectName ?? '-'}</p></article>
        <article className="card"><h2>Estimated</h2><span className="badge">{formatNumber(task.estimatedHours)}h</span></article>
        <article className="card"><h2>Workflow</h2><span className={`badge task-${task.status.toLowerCase()}`}>{task.status}</span>{canManageStatus && <select className="field workflow-select" value="" onChange={event => event.target.value && changeStatus(event.target.value as TaskStatus)}><option value="">Move task to...</option>{transitions[workflowStatus].map(status => <option key={status} value={status}>{status}</option>)}</select>}</article>
      </div>
      <article className="card"><h2>Progress</h2><p>Allocated: {formatNumber(totalAllocated)}h/day</p><p>Approved work: {formatNumber(task.approvedWorkedHours)}h</p><p>Remaining: {formatNumber(task.remainingHours)}h</p></article>
      <article className="card"><h2>Description</h2><p>{task.description?.taskDescriptionText ?? '-'}</p></article>
      <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Hours/day</th></tr></thead><tbody>{taskAllocations.map(a => <tr key={a.employeeId}><td>{a.employeeName ?? 'Unknown employee'}</td><td>{formatDate(a.allocationStartDate)} - {formatDate(a.allocationEndDate)}</td><td><span className="badge">{formatNumber(a.allocatedHours)}h</span></td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
