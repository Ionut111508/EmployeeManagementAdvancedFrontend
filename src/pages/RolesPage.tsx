import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
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
<<<<<<< HEAD
    <p className="muted">{role === 'Admin' ? 'Application management.' : role === 'Manager' ? 'Project coordination.' : 'Task execution.'}</p>
=======
    <p className="muted">{role === 'Admin' ? 'Application administration.' : role === 'Manager' ? 'Project coordination.' : 'Task execution.'}</p>
>>>>>>> 0fd9f40032bec48bf6cfcca9de2800957d248042
    <div className="role-list">
      {people.map(person => <div className="role-list-item" key={person.employeeId}><div><strong>{person.fullName}</strong><p className="muted">{person.username}</p></div><Link className="btn-link" to={'/people/' + person.employeeId}>Details</Link></div>)}
      {people.length === 0 && <p className="muted">No people in this category.</p>}
    </div>
  </article>;
}

export function RolesPage() {
  const { data, loading, error } = useAsync(api.employeeRoles, []);
  const admins = (data ?? []).filter(item => item.role === 'Admin');
  const managers = (data ?? []).filter(item => item.role === 'Manager');
  const employees = (data ?? []).filter(item => item.role === 'Employee');

  return <section className="page-stack">
<<<<<<< HEAD
    <PageHeader eyebrow="Access control" title="Roles" description="Roles are clearly grouped into categories: administrator, manager, and employee." />
=======
    <PageHeader eyebrow="Access control" title="Roles" description="Roles are grouped clearly by category: administrator, manager, and employee." />
>>>>>>> 0fd9f40032bec48bf6cfcca9de2800957d248042
    <Status loading={loading} error={error} empty={data?.length === 0} />
    {data && <div className="grid grid-3"><RoleColumn role="Admin" people={admins} /><RoleColumn role="Manager" people={managers} /><RoleColumn role="Employee" people={employees} /></div>}
  </section>;
}
