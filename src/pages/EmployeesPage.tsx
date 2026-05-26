import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatNumber } from '../utils/format';
import type { LoginResponse } from '../types/domain';

function getCurrentRole() {
  const rawSession = localStorage.getItem('authSession');
  if (!rawSession) return null;
  try {
    return (JSON.parse(rawSession) as LoginResponse).role;
  } catch {
    return null;
  }
}

export function EmployeesPage() {
  const { data, loading, error } = useAsync(api.employees, []);
  const canViewAccount = getCurrentRole() === 'Admin';
  return <section className="page-stack">
    <PageHeader eyebrow="Human resources" title="Employees" description="Angajati, norme de lucru si date de contact." />
    <Status loading={loading} error={error} empty={data?.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Email</th><th>Phone</th>{canViewAccount && <th>Account</th>}<th>Work norm</th><th>Action</th></tr></thead><tbody>{data.map(e => <tr key={e.employeeId}><td><strong>{e.firstName} {e.lastName}</strong></td><td>{e.email}</td><td>{e.phoneNumber}</td>{canViewAccount && <td>{e.account?.username ?? '-'}</td>}<td>{e.workNorm?.workNormName ?? '-'} <span className="badge">{formatNumber(e.workNorm?.workHours)}h</span></td><td><Link className="btn-link" to={'/people/' + e.employeeId}>Details</Link></td></tr>)}</tbody></table></div>}
  </section>;
}
