import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { addDays, dateInputValue, formatDate, formatNumber } from '../utils/format';

export function TasksPage() {
  const { session, access, hasPermission } = useAuth();
  const { data, loading, error } = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.tasksVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [staffingDates, setStaffingDates] = useState({
    startDate: dateInputValue(),
    endDate: dateInputValue(addDays(new Date(), 14))
  });
  const projects = useMemo(() => Array.from(new Map((data ?? []).map(t => [t.projectId, t.project?.projectName ?? 'Unknown project'])).entries()), [data]);
  const filteredTasks = useMemo(() => (data ?? []).filter(t => selectedProjects.length === 0 || selectedProjects.includes(t.projectId)), [data, selectedProjects]);
  const staffingProjectId = selectedProjects.length === 1 ? selectedProjects[0] : session?.role === 'Manager' ? access?.managedProjectIds[0] : null;
  const staffing = useAsync(() => {
    if (!session || !hasPermission('allocations.simulate')) return Promise.resolve([]);
    return api.taskStaffing({ startDate: staffingDates.startDate, endDate: staffingDates.endDate, projectId: staffingProjectId, hoursPerDay: 1 });
  }, [session?.employeeId, staffingProjectId, staffingDates.startDate, staffingDates.endDate]);
  const understaffed = (staffing.data ?? []).filter(item => item.remainingHours > 0);

  function toggleProject(projectId: string) {
    setSelectedProjects(current => current.includes(projectId) ? current.filter(id => id !== projectId) : [...current, projectId]);
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Task management" title="Tasks" description="Tasks visible for your current role." />
    {data && <div className="card filter-bar"><strong>Filter by project</strong>{projects.map(([id, name]) => <label key={id} className="muted"><input type="checkbox" checked={selectedProjects.includes(id)} onChange={() => toggleProject(id)} /> {name}</label>)}{selectedProjects.length > 0 && <button className="btn-link" type="button" onClick={() => setSelectedProjects([])}>Clear filters</button>}<span className="badge">{filteredTasks.length} tasks</span></div>}
    {hasPermission('allocations.simulate') && <div className="table-card">
      <div className="gantt-header"><h2>Tasks needing people</h2><span className="badge">{understaffed.length} gaps</span></div>
      <div className="filter-bar">
        <input className="field" type="date" value={staffingDates.startDate} onChange={e => setStaffingDates({ ...staffingDates, startDate: e.target.value })} />
        <input className="field" type="date" value={staffingDates.endDate} onChange={e => setStaffingDates({ ...staffingDates, endDate: e.target.value })} />
        <span className="muted">Project scope: {staffingProjectId ?? 'company'}</span>
      </div>
      <Status loading={staffing.loading} error={staffing.error} />
      {!staffing.loading && !staffing.error && understaffed.length === 0 && <div className="status-card status-success"><strong>All tasks are fully staffed.</strong><span>No allocation gaps were found in the selected scope.</span></div>}
      {understaffed.length > 0 && <table className="data-table"><thead><tr><th>Task</th><th>Planned period</th><th>Required skill</th><th>People</th><th>Estimated</th><th>Allocated</th><th>Missing</th><th>Candidates</th><th>Status</th></tr></thead><tbody>{understaffed.map(item => <tr key={`${item.projectId}-${item.taskId}`}><td><strong>{item.taskName}</strong><br/><span className="muted">{item.projectName}</span></td><td>{formatDate(item.plannedStartDate)} - {formatDate(item.plannedEndDate)}</td><td>{item.requiredSkillName ? `${item.requiredSkillName} ${item.requiredSkillLevel ?? ''}` : '-'}</td><td>{item.allocatedPeople}</td><td>{formatNumber(item.estimatedHours)}h</td><td>{formatNumber(item.allocatedHours)}h</td><td><span className="badge">{formatNumber(item.remainingHours)}h</span></td><td>{item.candidates.length ? item.candidates.map(c => `${c.fullName} (${formatNumber(c.minimumDailyAvailableHours)}h/day)`).join(', ') : '-'}</td><td><span className="badge">{item.status}</span></td></tr>)}</tbody></table>}
    </div>}
    <Status loading={loading} error={error} empty={filteredTasks.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Task</th><th>Project</th><th>Planned period</th><th>Description</th><th>Required skill</th><th>Estimated</th><th>Action</th></tr></thead><tbody>{filteredTasks.map(t => <tr key={`${t.projectId}-${t.taskId}`}><td><strong>{t.taskName}</strong></td><td>{t.project?.projectName ?? '-'}</td><td>{formatDate(t.plannedStartDate)} - {formatDate(t.plannedEndDate)}</td><td>{t.description?.taskDescriptionText ?? '-'}</td><td>{t.requiredSkill ? `${t.requiredSkill.skillName} ${t.requiredSkill.skillLevel ?? ''}` : '-'}</td><td><span className="badge">{formatNumber(t.estimatedHours)}h</span></td><td><Link className="btn-link" to={'/task-view/' + t.projectId + '/' + t.taskId}>View task</Link></td></tr>)}</tbody></table></div>}
  </section>;
}
