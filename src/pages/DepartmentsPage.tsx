import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';

export function DepartmentsPage() {
  const { data, loading, error } = useAsync(api.departments, []);
  return <section className="page-stack"><PageHeader eyebrow="Configuration" title="Departments" description="Departamentele organizației." /><Status loading={loading} error={error} empty={data?.length === 0} />{data && <div className="grid grid-3">{data.map(d => <div className="card" key={d.departmentId}><span className="badge">{d.departmentId}</span><h2>{d.departmentName}</h2></div>)}</div>}</section>;
}
