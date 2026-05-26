import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../utils/format';

export function DepartmentsPage() {
  const departments = useAsync(api.departments, []);
  const relations = useAsync(api.employeeDepartments, []);
  return <section className="page-stack">
    <PageHeader eyebrow="Configuration" title="Departments" description="Departments and employees assigned to each department." />
    <Status loading={departments.loading} error={departments.error} empty={departments.data?.length === 0} />
    {departments.data && <div className="grid grid-3">{departments.data.map(d => { const people = (relations.data ?? []).filter(x => x.departmentId === d.departmentId); return <article className="card" key={d.departmentId}><h2>{d.departmentName}</h2><p className="muted">{people.length} employees</p><div className="role-list">{people.map(item => <div className="role-list-item" key={item.employeeId}><strong>{item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'Unknown employee'}</strong><span className="muted">from {formatDate(item.startDate)}</span></div>)}{people.length === 0 && <p className="muted">No employees assigned.</p>}</div></article>; })}</div>}
  </section>;
}
