import { FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { dateInputValue } from '../utils/format';
import { formatDate, formatNumber } from '../utils/format';

export function EmployeeLeavesPage() {
  const { session } = useAuth();
  const employees = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.employeesVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const leaves = useAsync(api.employeeLeaves, []);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedLeaveId, setSelectedLeaveId] = useState('');
  const [form, setForm] = useState({ employeeId: '', startDate: dateInputValue(), endDate: dateInputValue(), leaveType: 'Vacation', reason: '', replacementEmployeeId: '' });
  const plan = useAsync(() => selectedLeaveId ? api.employeeLeavePlan(selectedLeaveId) : Promise.resolve(null), [selectedLeaveId]);

  async function saveLeave(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      await api.createEmployeeLeave({ employeeId: form.employeeId, startDate: form.startDate, endDate: form.endDate, leaveType: form.leaveType, reason: form.reason || null, replacementEmployeeId: form.replacementEmployeeId || null });
      setMessage('Leave registered. Auto allocation will skip this employee in the selected period.');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Could not register leave.'); }
  }

  const visibleEmployeeIds = new Set((employees.data ?? []).map(e => e.employeeId));
  const visibleLeaves = (leaves.data ?? []).filter(leave => session?.role === 'Admin' || visibleEmployeeIds.has(leave.employeeId) || (leave.replacementEmployeeId ? visibleEmployeeIds.has(leave.replacementEmployeeId) : false));

  return <section className="page-stack">
    <PageHeader eyebrow="Availability" title="Employee leaves" description="Manage employee leaves. If no replacement is available, the task must be replanned or delayed." />
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
    <Status loading={leaves.loading} error={leaves.error} empty={visibleLeaves.length === 0} />
    {leaves.data && <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Type</th><th>Replacement</th><th>Status</th><th>Plan</th></tr></thead><tbody>{visibleLeaves.map(l => <tr key={l.employeeLeaveId}><td>{l.employeeName}</td><td>{formatDate(l.startDate)} - {formatDate(l.endDate)}</td><td>{l.leaveType}</td><td>{l.replacementEmployeeName ?? '-'}</td><td><span className="badge">{l.replacementEmployeeId ? 'Covered' : 'Risk of delay'}</span></td><td><button className="btn secondary" type="button" onClick={() => setSelectedLeaveId(l.employeeLeaveId)}>Analyze</button></td></tr>)}</tbody></table></div>}
    <div className="table-card">
      <div className="gantt-header"><h2>Leave impact plan</h2><select className="field" value={selectedLeaveId} onChange={e => setSelectedLeaveId(e.target.value)}><option value="">Select leave</option>{visibleLeaves.map(l => <option key={l.employeeLeaveId} value={l.employeeLeaveId}>{l.employeeName} | {formatDate(l.startDate)} - {formatDate(l.endDate)}</option>)}</select></div>
      <Status loading={Boolean(selectedLeaveId) && plan.loading} error={plan.error} empty={Boolean(selectedLeaveId) && plan.data?.impacts.length === 0} />
      {plan.data && <><p className="muted">{plan.data.recommendation}</p><table className="data-table"><thead><tr><th>Impacted task</th><th>Overlap</th><th>Hours/day</th><th>Skill</th><th>Candidates</th><th>Status</th></tr></thead><tbody>{plan.data.impacts.map(item => <tr key={`${item.projectId}-${item.taskId}-${item.overlapStartDate}`}><td><strong>{item.taskName}</strong><br/><span className="muted">{item.projectName}</span></td><td>{formatDate(item.overlapStartDate)} - {formatDate(item.overlapEndDate)}</td><td>{formatNumber(item.allocatedHours)}h</td><td>{item.requiredSkillName ? `${item.requiredSkillName} ${item.requiredSkillLevel ?? ''}` : '-'}</td><td>{item.replacementCandidates.length ? item.replacementCandidates.map(candidate => `${candidate.fullName} (${formatNumber(candidate.minimumDailyAvailableHours)}h/day)`).join(', ') : '-'}</td><td><span className="badge">{item.status}</span></td></tr>)}</tbody></table></>}
    </div>
  </section>;
}
