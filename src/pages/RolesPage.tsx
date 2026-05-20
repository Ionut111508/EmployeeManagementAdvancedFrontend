import { ShieldCheck } from 'lucide-react';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';

export function RolesPage() {
  const { data, loading, error } = useAsync(api.employeeRoles, []);

  return <section className="page-stack">
    <PageHeader eyebrow="Access control" title="Roles" description="Rolurile sunt calculate din datele existente: Admin pentru contul de administrare, Manager pentru angajații care gestionează proiecte, Employee pentru restul." />
    <Status loading={loading} error={error} empty={data?.length === 0} />
    {data && <div className="grid grid-3">
      {data.map(role => <article className="card" key={role.employeeId}>
        <div className="role-card-head">
          <div className="kpi-icon"><ShieldCheck size={20} /></div>
          <span className={`badge role-${role.role.toLowerCase()}`}>{role.role}</span>
        </div>
        <h2>{role.fullName}</h2>
        <p className="muted">Username: {role.username || '-'}</p>
        <p className="muted">Proiecte gestionate: <strong>{role.projectsManaged}</strong></p>
        <p>{role.description}</p>
      </article>)}
    </div>}
  </section>;
}
