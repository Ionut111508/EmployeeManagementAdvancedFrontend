import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatNumber } from '../utils/format';

export function EmployeesPage() {
  const { session, hasPermission } = useAuth();
  const { data, loading, error } = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.employeesVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const canViewAccount = hasPermission('employees.view.all');
  return <section className="page-stack">
    <PageHeader eyebrow="Human resources" title="Employees" description="Employees visible for your current role." />
    <Status loading={loading} error={error} empty={data?.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Email</th><th>Phone</th>{canViewAccount && <th>Account</th>}<th>Work norm</th><th>Action</th></tr></thead><tbody>{data.map(e => <tr key={e.employeeId}><td><strong>{e.firstName} {e.lastName}</strong></td><td>{e.email}</td><td>{e.phoneNumber}</td>{canViewAccount && <td>{e.account?.username ?? '-'}</td>}<td>{e.workNorm?.workNormName ?? '-'} <span className="badge">{formatNumber(e.workNorm?.workHours)}h</span></td><td><Link className="btn-link" to={'/people/' + e.employeeId}>Details</Link></td></tr>)}</tbody></table></div>}
  </section>;
}
