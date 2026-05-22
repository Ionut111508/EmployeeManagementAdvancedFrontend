import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatNumber } from '../utils/format';

export function TasksPage() {
  const { data, loading, error } = useAsync(api.tasks, []);
  return <section className="page-stack">
    <PageHeader eyebrow="Task management" title="Tasks" description="Task-uri definite pe proiecte, cu ore estimate si descrieri." />
    <Status loading={loading} error={error} empty={data?.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Task</th><th>Project</th><th>Description</th><th>Estimated</th><th>Action</th></tr></thead><tbody>{data.map(t => <tr key={`${t.projectId}-${t.taskId}`}><td><strong>{t.taskName}</strong></td><td>{t.project?.projectName ?? '-'}</td><td>{t.description?.taskDescriptionText ?? '-'}</td><td><span className="badge">{formatNumber(t.estimatedHours)}h</span></td><td><Link className="btn-link" to={'/task-view/' + t.projectId + '/' + t.taskId}>View task</Link></td></tr>)}</tbody></table></div>}
  </section>;
}
