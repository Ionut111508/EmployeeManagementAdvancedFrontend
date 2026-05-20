import { ShieldCheck } from 'lucide-react';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import type { EmployeeRole, UserRole } from '../types/domain';

const roleLabels: Record<UserRole, string> = {
  Admin: 'Administrators',
  Manager: 'Managers',
  Employee: 'Employees'
};

function RoleColumn({ role, people }: { role: UserRole; people: EmployeeRole[] }) {
  return <article className="card">
    <div className="role-card-head">
      <div className="kpi-icon"><ShieldCheck size={20} /></div>
      <span className={`badge role-${role.toLowerCase()}`}>{people.length}</span>
    </div>
    <h2>{roleLabels[role]}</h2>
    <p className="muted">{role === 'Admin' ? 'Configurare si administrare.' : role === 'Manager' ? 'Coordonare proiecte si echipe.' : 'Executie task-uri si pontaj.'}</p>
    <div className="role-list">
      {people.map(person => <div className="role-list-item" key={person.employeeId}><strong>{person.fullName}</strong><span>{person.username}</span></div>)}
      {people.length === 0 && <p className="muted">Nu exista persoane in aceasta categorie.</p>}
    </div>
  </article>;
}

export function RolesPage() {
  const { data, loading, error } = useAsync(api.employeeRoles, []);
  const admins = (data ?? []).filter(item => item.role === 'Admin');
  const managers = (data ?? []).filter(item => item.role === 'Manager');
  const employees = (data ?? []).filter(item => item.role === 'Employee');

  return <section className="page-stack">
    <PageHeader eyebrow="Access control" title="Roles" description="Rolurile sunt grupate clar pe categorii: administrator, manager si angajat." />
    <Status loading={loading} error={error} empty={data?.length === 0} />
    {data && <div className="grid grid-3"><RoleColumn role="Admin" people={admins} /><RoleColumn role="Manager" people={managers} /><RoleColumn role="Employee" people={employees} /></div>}
  </section>;
}
