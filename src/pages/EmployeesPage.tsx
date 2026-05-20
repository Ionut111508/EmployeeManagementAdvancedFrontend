import { FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatNumber } from '../utils/format';

const initialForm = {
  employeeId: '',
  lastName: '',
  firstName: '',
  email: '',
  phoneNumber: '',
  accountId: '',
  username: '',
  password: 'Password123!',
  workNormId: 'WN_FULL'
};

export function EmployeesPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { data, loading, error } = useAsync(api.employees, [reloadKey]);
  const workNorms = useAsync(api.workNorms, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api.createAccount({ accountId: form.accountId, username: form.username, password: form.password });
      await api.createEmployee({
        employeeId: form.employeeId,
        lastName: form.lastName,
        firstName: form.firstName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        accountId: form.accountId,
        workNormId: form.workNormId
      });
      setForm(initialForm);
      setMessage('Angajatul a fost creat cu succes.');
      setReloadKey(key => key + 1);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Nu am putut crea angajatul.');
    } finally {
      setSubmitting(false);
    }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Human resources" title="Employees" description="Angajați, conturi, norme de lucru și date de contact." />

    <form className="card form-grid" onSubmit={handleSubmit}>
      <h2>Create employee</h2>
      <input className="field" placeholder="Employee ID ex: E011" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required />
      <input className="field" placeholder="Last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
      <input className="field" placeholder="First name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
      <input className="field" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
      <input className="field" placeholder="Phone" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} required />
      <input className="field" placeholder="Account ID ex: ACC011" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} required />
      <input className="field" placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
      <input className="field" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
      <select className="field" value={form.workNormId} onChange={e => setForm({ ...form, workNormId: e.target.value })}>
        {(workNorms.data ?? []).map(norm => <option key={norm.workNormId} value={norm.workNormId}>{norm.workNormName} - {formatNumber(norm.workHours)}h</option>)}
      </select>
      <button className="btn" disabled={submitting}>{submitting ? 'Saving...' : 'Create employee'}</button>
      {message && <p className="muted form-message">{message}</p>}
    </form>

    <Status loading={loading} error={error} empty={data?.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Email</th><th>Phone</th><th>Account</th><th>Work norm</th></tr></thead><tbody>{data.map(e => <tr key={e.employeeId}><td><strong>{e.firstName} {e.lastName}</strong><br/><span className="muted">{e.employeeId}</span></td><td>{e.email}</td><td>{e.phoneNumber}</td><td>{e.account?.username ?? e.accountId}</td><td>{e.workNorm?.workNormName ?? e.workNormId} <span className="badge">{formatNumber(e.workNorm?.workHours)}h</span></td></tr>)}</tbody></table></div>}
  </section>;
}
