import { FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../utils/format';

export function EmployeeLeavesPage() {
  const employees = useAsync(api.employees, []);
  const leaves = useAsync(api.employeeLeaves, []);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ employeeId: '', startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), leaveType: 'Vacation', reason: '', replacementEmployeeId: '' });

  async function saveLeave(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      await api.createEmployeeLeave({ employeeId: form.employeeId, startDate: form.startDate, endDate: form.endDate, leaveType: form.leaveType, reason: form.reason || null, replacementEmployeeId: form.replacementEmployeeId || null });
      setMessage('Leave registered. Auto allocation will skip this employee in the selected period.');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Could not register leave.'); }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Availability" title="Employee leaves" description="Gestioneaza concediile. Daca nu exista inlocuitor disponibil, taskul trebuie replanificat sau intarziat." />
    <form className="card form-grid" onSubmit={saveLeave}>
      <select className="field" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required><option value="">Employee on leave</option>{(employees.data ?? []).map(e => <option key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName}</option>)}</select>
      <input className="field" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
      <input className="field" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
      <select className="field" value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })}><option>Vacation</option><option>Medical</option><option>Personal</option></select>
      <input className="field" placeholder="Reason" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
      <select className="field" value={form.replacementEmployeeId} onChange={e => setForm({ ...form, replacementEmployeeId: e.target.value })}><option value="">No replacement selected</option>{(employees.data ?? []).filter(e => e.employeeId !== form.employeeId).map(e => <option key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName}</option>)}</select>
      <button className="btn">Register leave</button>
      {message && <p className="muted form-message">{message}</p>}
    </form>
    <Status loading={leaves.loading} error={leaves.error} empty={leaves.data?.length === 0} />
    {leaves.data && <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Type</th><th>Replacement</th><th>Status</th></tr></thead><tbody>{leaves.data.map(l => <tr key={l.employeeLeaveId}><td>{l.employeeName}</td><td>{formatDate(l.startDate)} - {formatDate(l.endDate)}</td><td>{l.leaveType}</td><td>{l.replacementEmployeeName ?? '-'}</td><td><span className="badge">{l.replacementEmployeeId ? 'Covered' : 'Risk of delay'}</span></td></tr>)}</tbody></table></div>}
  </section>;
}
