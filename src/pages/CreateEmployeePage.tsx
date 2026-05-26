import { FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { useAsync } from '../hooks/useAsync';
import { formatNumber } from '../utils/format';

export function CreateEmployeePage() {
  const workNorms = useAsync(api.workNorms, []);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ employeeId: '', lastName: '', firstName: '', email: '', phoneNumber: '', accountId: '', username: '', password: 'Password123!', workNormId: 'WN_FULL' });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      await api.createAccount({ accountId: form.accountId, username: form.username, password: form.password });
      await api.createEmployee({ employeeId: form.employeeId, lastName: form.lastName, firstName: form.firstName, email: form.email, phoneNumber: form.phoneNumber, accountId: form.accountId, workNormId: form.workNormId });
      setMessage('Employee created successfully.');
      setForm({ employeeId: '', lastName: '', firstName: '', email: '', phoneNumber: '', accountId: '', username: '', password: 'Password123!', workNormId: 'WN_FULL' });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create employee.');
    }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Create" title="Create employee" description="Create the account and the associated employee." />
    <form className="card form-grid" onSubmit={handleSubmit}>
      <input className="field" placeholder="Internal employee code" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required />
      <input className="field" placeholder="Last name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
      <input className="field" placeholder="First name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
      <input className="field" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
      <input className="field" placeholder="Phone" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} required />
      <input className="field" placeholder="Internal account code" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} required />
      <input className="field" placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
      <input className="field" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
      <select className="field" value={form.workNormId} onChange={e => setForm({ ...form, workNormId: e.target.value })}>{(workNorms.data ?? []).map(n => <option key={n.workNormId} value={n.workNormId}>{n.workNormName} - {formatNumber(n.workHours)}h</option>)}</select>
      <button className="btn">Create employee</button>
      {message && <p className="muted form-message">{message}</p>}
    </form>
  </section>;
}
