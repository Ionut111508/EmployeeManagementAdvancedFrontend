import { FormEvent, useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { useAsync } from '../hooks/useAsync';
import { formatNumber } from '../utils/format';
import type { AllocationSimulation } from '../types/domain';

export function CreateAllocationPage() {
  const { session, hasPermission } = useAuth();
  const employees = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.employeesVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const tasks = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.tasksVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const skills = useAsync(api.skills, []);
  const [automatic, setAutomatic] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<AllocationSimulation | null>(null);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [form, setForm] = useState({ employeeId: '', projectId: '', taskId: '', startDate: '', endDate: '', hoursPerDay: '4', skillId: '' });

  const selectedTask = useMemo(() => (tasks.data ?? []).find(task => task.projectId === form.projectId && task.taskId === form.taskId), [tasks.data, form.projectId, form.taskId]);

  async function simulate() {
    setMessage(null);
    setSimulation(null);

    if (!form.projectId || !form.taskId || !form.startDate || Number(form.hoursPerDay) <= 0) {
      setMessage('Select a task, start date, and valid hours/day before simulation.');
      return;
    }

    if (!automatic && !form.employeeId) {
      setMessage('Select an employee for manual allocation simulation.');
      return;
    }

    setPlanningLoading(true);
    try {
      const result = await api.simulateAllocation({
        employeeId: automatic ? null : form.employeeId,
        projectId: form.projectId,
        taskId: form.taskId,
        startDate: form.startDate,
        endDate: form.endDate || null,
        hoursPerDay: Number(form.hoursPerDay),
        skillId: form.skillId || null
      });
      setSimulation(result);
      setMessage(result.canAllocate ? 'Simulation passed. The allocation can be created.' : result.reasons.join(' '));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not run allocation simulation.');
    } finally {
      setPlanningLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      if (automatic) await api.createAutoAllocation({ projectId: form.projectId, taskId: form.taskId, startDate: form.startDate, endDate: form.endDate || null, hoursPerDay: Number(form.hoursPerDay), skillId: form.skillId || null });
      else await api.createAllocation({ employeeId: form.employeeId, projectId: form.projectId, taskId: form.taskId, allocationStartDate: form.startDate, allocationEndDate: form.endDate || null, allocatedHours: Number(form.hoursPerDay) });
      setSimulation(null);
      setMessage('Allocation created.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create allocation.');
    }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Planning" title="Create allocation" description="Simulate availability first, then create the allocation manually or automatically." />
    <form className="card form-grid" onSubmit={submit}>
      <select className="field" value={automatic ? 'yes' : 'no'} onChange={e => setAutomatic(e.target.value === 'yes')}><option value="yes">Automatic</option><option value="no">Manual</option></select>
      {!automatic && <select className="field" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}><option value="">Employee</option>{(employees.data ?? []).map(e => <option key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName}</option>)}</select>}
      <select className="field" value={`${form.projectId}|${form.taskId}`} onChange={e => { const parts = e.target.value.split('|'); setForm({ ...form, projectId: parts[0], taskId: parts[1], employeeId: '' }); setSimulation(null); }} required><option value="|">Task</option>{(tasks.data ?? []).map(t => <option key={`${t.projectId}-${t.taskId}`} value={`${t.projectId}|${t.taskId}`}>{t.project?.projectName ?? t.projectId} - {t.taskName}</option>)}</select>
      <input className="field" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
      <input className="field" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
      <input className="field" type="number" min="1" max="12" value={form.hoursPerDay} onChange={e => setForm({ ...form, hoursPerDay: e.target.value })} required />
      {automatic && <select className="field" value={form.skillId} onChange={e => setForm({ ...form, skillId: e.target.value })}><option value="">Any skill</option>{(skills.data ?? []).map(s => <option key={s.skillId} value={s.skillId}>{s.skillName}</option>)}</select>}
      <button className="btn secondary" type="button" disabled={planningLoading || !hasPermission('allocations.simulate')} onClick={simulate}>{planningLoading ? 'Simulating...' : 'Simulate availability'}</button>
      <button className="btn">Save allocation</button>
      {message && <p className="muted form-message">{message}</p>}
    </form>

    {selectedTask && <div className="card">
      <h2>Selected task</h2>
      <p><strong>{selectedTask.taskName}</strong> <span className="muted">{selectedTask.project?.projectName ?? selectedTask.projectId}</span></p>
      <span className="badge">Estimated {formatNumber(selectedTask.estimatedHours)}h</span>
    </div>}

    {simulation && <div className="table-card">
      <h2>Simulation result</h2>
      <div className="grid grid-4 simulation-kpis">
        <div><span className="muted">Requested</span><strong>{formatNumber(simulation.requestedTotalHours)}h</strong></div>
        <div><span className="muted">Already allocated</span><strong>{formatNumber(simulation.currentTaskAllocatedHours)}h</strong></div>
        <div><span className="muted">Estimated</span><strong>{formatNumber(simulation.taskEstimatedHours)}h</strong></div>
        <div><span className="muted">After simulation</span><strong>{formatNumber(simulation.taskRemainingHoursAfterSimulation)}h</strong></div>
      </div>
      {simulation.reasons.length > 0 && <div className="status-card status-error">{simulation.reasons.map(reason => <p key={reason}>{reason}</p>)}</div>}
      <table className="data-table">
        <thead><tr><th>Candidate</th><th>Status</th><th>Available</th><th>Min daily available</th><th>Project role</th></tr></thead>
        <tbody>{simulation.candidates.map(candidate => <tr key={candidate.employeeId}><td><strong>{candidate.fullName}</strong></td><td><span className="badge">{candidate.status}</span></td><td>{formatNumber(candidate.availableHours)}h</td><td>{formatNumber(candidate.minimumDailyAvailableHours)}h/day</td><td>{candidate.isProjectManager ? 'Manager' : candidate.isAssignedToProject ? 'Assigned' : 'Available pool'}</td></tr>)}</tbody>
      </table>
      {simulation.candidates.length === 0 && <p className="muted">No available candidates for this interval.</p>}
    </div>}
  </section>;
}
