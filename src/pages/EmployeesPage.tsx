import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatNumber } from '../utils/format';

export function EmployeesPage() {
  const { data, loading, error } = useAsync(api.employees, []);
  return <section className="page-stack">
    <PageHeader eyebrow="Human resources" title="Employees" description="Angajați, conturi, norme de lucru și date de contact." />
    <Status loading={loading} error={error} empty={data?.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Email</th><th>Phone</th><th>Account</th><th>Work norm</th></tr></thead><tbody>{data.map(e => <tr key={e.employeeId}><td><strong>{e.firstName} {e.lastName}</strong><br/><span className="muted">{e.employeeId}</span></td><td>{e.email}</td><td>{e.phoneNumber}</td><td>{e.account?.username ?? e.accountId}</td><td>{e.workNorm?.workNormName ?? e.workNormId} <span className="badge">{formatNumber(e.workNorm?.workHours)}h</span></td></tr>)}</tbody></table></div>}
  </section>;
}
