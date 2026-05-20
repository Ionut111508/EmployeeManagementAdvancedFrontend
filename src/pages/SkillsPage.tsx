import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';

export function SkillsPage() {
  const { data, loading, error } = useAsync(api.skills, []);
  return <section className="page-stack"><PageHeader eyebrow="Configuration" title="Skills" description="Competențe tehnice folosite pentru profilul angajaților." /><Status loading={loading} error={error} empty={data?.length === 0} />{data && <div className="grid grid-3">{data.map(s => <div className="card" key={s.skillId}><span className="badge">{s.skillId}</span><h2>{s.skillName}</h2><p className="muted">Nivel: {s.skillLevel ?? '-'}</p></div>)}</div>}</section>;
}
