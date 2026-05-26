import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatNumber } from '../utils/format';

export function TasksPage() {
  const { data, loading, error } = useAsync(api.tasks, []);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const projects = useMemo(() => Array.from(new Map((data ?? []).map(t => [t.projectId, t.project?.projectName ?? 'Unknown project'])).entries()), [data]);
  const filteredTasks = useMemo(() => (data ?? []).filter(t => selectedProjects.length === 0 || selectedProjects.includes(t.projectId)), [data, selectedProjects]);

  function toggleProject(projectId: string) {
    setSelectedProjects(current => current.includes(projectId) ? current.filter(id => id !== projectId) : [...current, projectId]);
  }

  return <section className="page-stack">
<<<<<<< HEAD
    <PageHeader eyebrow="Task management" title="Tasks" description="Tasks defined for projects, with estimated hours and descriptions." />
=======
    <PageHeader eyebrow="Task management" title="Tasks" description="Tasks defined for projects, including estimated hours and descriptions." />
>>>>>>> 0fd9f40032bec48bf6cfcca9de2800957d248042
    {data && <div className="card filter-bar"><strong>Filter by project</strong>{projects.map(([id, name]) => <label key={id} className="muted"><input type="checkbox" checked={selectedProjects.includes(id)} onChange={() => toggleProject(id)} /> {name}</label>)}{selectedProjects.length > 0 && <button className="btn-link" type="button" onClick={() => setSelectedProjects([])}>Clear filters</button>}<span className="badge">{filteredTasks.length} tasks</span></div>}
    <Status loading={loading} error={error} empty={filteredTasks.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Task</th><th>Project</th><th>Description</th><th>Estimated</th><th>Action</th></tr></thead><tbody>{filteredTasks.map(t => <tr key={`${t.projectId}-${t.taskId}`}><td><strong>{t.taskName}</strong></td><td>{t.project?.projectName ?? '-'}</td><td>{t.description?.taskDescriptionText ?? '-'}</td><td><span className="badge">{formatNumber(t.estimatedHours)}h</span></td><td><Link className="btn-link" to={'/task-view/' + t.projectId + '/' + t.taskId}>View task</Link></td></tr>)}</tbody></table></div>}
  </section>;
}
