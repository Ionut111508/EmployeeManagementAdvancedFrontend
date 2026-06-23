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
  const [refreshKey, setRefreshKey] = useState(0);
  const leaves = useAsync(api.employeeLeaves, [refreshKey]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedLeaveId, setSelectedLeaveId] = useState('');
  const [form, setForm] = useState({ employeeId: '', startDate: dateInputValue(), endDate: dateInputValue(), leaveType: 'Vacation', reason: '', replacementEmployeeId: '' });
  const plan = useAsync(() => selectedLeaveId ? api.employeeLeavePlan(selectedLeaveId) : Promise.resolve(null), [selectedLeaveId]);
  const isEmployee = session?.role === 'Employee';
  const selectableEmployees = isEmployee ? (employees.data ?? []).filter(employee => employee.employeeId === session.employeeId) : (employees.data ?? []);

  async function saveLeave(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      const created = await api.createEmployeeLeave({ employeeId: isEmployee ? session!.employeeId : form.employeeId, startDate: form.startDate, endDate: form.endDate, leaveType: form.leaveType, reason: form.reason || null, replacementEmployeeId: isEmployee ? null : form.replacementEmployeeId || null });
      setMessage(created.impactedAllocations === 0
        ? 'Leave registered. No active task allocation overlaps this period.'
        : created.coveredAllocations > 0
          ? `Leave registered. ${created.coveredAllocations} task allocation(s) will be covered by the selected replacement.`
          : `Leave registered. ${created.impactedAllocations} task allocation(s) now require replanning or a replacement.`);
      setRefreshKey(current => current + 1);
      if (!isEmployee) setSelectedLeaveId(created.employeeLeaveId);
      setForm(current => ({ ...current, employeeId: isEmployee ? current.employeeId : '', reason: '', replacementEmployeeId: '' }));
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Could not register leave.'); }
  }

  const visibleEmployeeIds = new Set((employees.data ?? []).map(e => e.employeeId));
  const visibleLeaves = (leaves.data ?? []).filter(leave => session?.role === 'Admin' || visibleEmployeeIds.has(leave.employeeId) || (leave.replacementEmployeeId ? visibleEmployeeIds.has(leave.replacementEmployeeId) : false));

  return <section className="page-stack">
    <PageHeader eyebrow="Availability" title="Employee leaves" description="Manage employee leaves. If no replacement is available, the task must be replanned or delayed." />
    <form className="card form-grid" onSubmit={saveLeave}>
      {!isEmployee && <label>Employee on leave<select className="field" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} required><option value="">Select employee</option>{selectableEmployees.map(e => <option key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName}</option>)}</select></label>}
      {isEmployee && <div className="field field-static">Leave request for {session?.fullName}</div>}
      <label>Start date<input className="field" type="date" min={dateInputValue()} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value, endDate: form.endDate < e.target.value ? e.target.value : form.endDate })} required /></label>
      <label>End date<input className="field" type="date" min={form.startDate || dateInputValue()} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required /></label>
      <label>Leave type<select className="field" value={form.leaveType} onChange={e => setForm({ ...form, leaveType: e.target.value })}><option>Vacation</option><option>Medical</option><option>Personal</option></select></label>
      <label>Reason (optional)<input className="field" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></label>
      {!isEmployee && <label>Replacement (optional)<select className="field" value={form.replacementEmployeeId} onChange={e => setForm({ ...form, replacementEmployeeId: e.target.value })}><option value="">No replacement selected</option>{(employees.data ?? []).filter(e => e.employeeId !== form.employeeId).map(e => <option key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName}</option>)}</select></label>}
      <button className="btn">Register leave</button>
      {message && <p className="muted form-message">{message}</p>}
    </form>
    <Status loading={leaves.loading} error={leaves.error} empty={visibleLeaves.length === 0} />
    {leaves.data && <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Period</th><th>Type</th><th>Replacement</th><th>Status</th>{!isEmployee && <th>Plan</th>}</tr></thead><tbody>{visibleLeaves.map(l => <tr key={l.employeeLeaveId}><td>{l.employeeName}</td><td>{formatDate(l.startDate)} - {formatDate(l.endDate)}</td><td>{l.leaveType}</td><td>{l.replacementEmployeeName ?? '-'}</td><td><span className="badge">{l.replacementEmployeeId ? 'Covered' : 'Awaiting planning'}</span></td>{!isEmployee && <td><button className="btn secondary" type="button" onClick={() => setSelectedLeaveId(l.employeeLeaveId)}>Analyze</button></td>}</tr>)}</tbody></table></div>}
    {!isEmployee && <div className="table-card">
      <div className="gantt-header"><h2>Leave impact plan</h2><select className="field" value={selectedLeaveId} onChange={e => setSelectedLeaveId(e.target.value)}><option value="">Select leave</option>{visibleLeaves.map(l => <option key={l.employeeLeaveId} value={l.employeeLeaveId}>{l.employeeName} | {formatDate(l.startDate)} - {formatDate(l.endDate)}</option>)}</select></div>
      <Status loading={Boolean(selectedLeaveId) && plan.loading} error={plan.error} empty={Boolean(selectedLeaveId) && plan.data?.impacts.length === 0} />
      {plan.data && <><p className="muted">{plan.data.recommendation}</p><table className="data-table"><thead><tr><th>Impacted task</th><th>Overlap</th><th>Hours/day</th><th>Skill</th><th>Candidates</th><th>Status</th></tr></thead><tbody>{plan.data.impacts.map(item => <tr key={`${item.projectId}-${item.taskId}-${item.overlapStartDate}`}><td><strong>{item.taskName}</strong><br/><span className="muted">{item.projectName}</span></td><td>{formatDate(item.overlapStartDate)} - {formatDate(item.overlapEndDate)}</td><td>{formatNumber(item.allocatedHours)}h</td><td>{item.requiredSkillName ? `${item.requiredSkillName} ${item.requiredSkillLevel ?? ''}` : '-'}</td><td>{item.replacementCandidates.length ? item.replacementCandidates.map(candidate => `${candidate.fullName} (${formatNumber(candidate.minimumDailyAvailableHours)}h/day)`).join(', ') : '-'}</td><td><span className="badge">{item.status}</span></td></tr>)}</tbody></table></>}
    </div>}
  </section>;
}
