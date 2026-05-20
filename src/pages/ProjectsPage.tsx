import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';

export function ProjectsPage() {
  const { data, loading, error } = useAsync(api.projects, []);
  return <section className="page-stack">
    <PageHeader eyebrow="Operational" title="Projects" description="Lista proiectelor gestionate in sistem." />
    <Status loading={loading} error={error} empty={data?.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Project</th></tr></thead><tbody>{data.map(p => <tr key={p.projectId}><td><strong>{p.projectName}</strong></td></tr>)}</tbody></table></div>}
  </section>;
}
