import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { useAsync } from '../hooks/useAsync';
import { formatNumber } from '../utils/format';
import type { AllocationAvailability, AllocationSimulation } from '../types/domain';

export function CreateAllocationPage() {
  const { session, hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const tasks = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.tasksVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const skills = useAsync(api.skills, []);
  const [automatic, setAutomatic] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<AllocationSimulation | null>(null);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [form, setForm] = useState({ employeeId: '', projectId: '', taskId: '', startDate: '', endDate: '', hoursPerDay: '4', skillId: '' });

  const selectedTask = useMemo(() => (tasks.data ?? []).find(task => task.projectId === form.projectId && task.taskId === form.taskId), [tasks.data, form.projectId, form.taskId]);
  const candidates = useAsync(() => {
    if (automatic || !selectedTask || !form.startDate || Number(form.hoursPerDay) <= 0) return Promise.resolve([] as AllocationAvailability[]);
    return api.allocationAvailability({
      projectId: selectedTask.projectId,
      skillId: form.skillId || selectedTask.requiredSkillId || null,
      startDate: form.startDate,
      endDate: form.endDate || form.startDate,
      requiredHoursPerDay: Number(form.hoursPerDay)
    }).then(items => items.filter(item => item.canTakeRequestedHours));
  }, [automatic, selectedTask?.projectId, selectedTask?.taskId, selectedTask?.requiredSkillId, form.startDate, form.endDate, form.hoursPerDay, form.skillId]);

  useEffect(() => {
    if (!tasks.data || form.taskId) return;
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    const task = tasks.data.find(item => item.projectId === projectId && item.taskId === taskId);
    if (!task) return;
    setForm(current => ({
      ...current,
      projectId: task.projectId,
      taskId: task.taskId,
      startDate: task.plannedStartDate?.slice(0, 10) ?? current.startDate,
      endDate: task.plannedEndDate?.slice(0, 10) ?? current.endDate,
      skillId: task.requiredSkillId ?? ''
    }));
  }, [tasks.data, searchParams, form.taskId]);

  function selectTask(value: string) {
    const [projectId, taskId] = value.split('|');
    const task = (tasks.data ?? []).find(item => item.projectId === projectId && item.taskId === taskId);
    setForm(current => ({
      ...current,
      projectId,
      taskId,
      employeeId: '',
      startDate: task?.plannedStartDate?.slice(0, 10) ?? current.startDate,
      endDate: task?.plannedEndDate?.slice(0, 10) ?? current.endDate,
      skillId: task?.requiredSkillId ?? ''
    }));
    setSimulation(null);
  }

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
      if (automatic) {
        const result = await api.createAutoAllocation({ projectId: form.projectId, taskId: form.taskId, startDate: form.startDate, endDate: form.endDate || null, hoursPerDay: Number(form.hoursPerDay), skillId: form.skillId || null });
        setMessage(`${result.status}: ${formatNumber(result.allocatedHours)}h allocated across ${result.allocations.length} employee(s), ${formatNumber(result.remainingHours)}h remaining.`);
      } else {
        await api.createAllocation({ employeeId: form.employeeId, projectId: form.projectId, taskId: form.taskId, allocationStartDate: form.startDate, allocationEndDate: form.endDate || null, allocatedHours: Number(form.hoursPerDay) });
        setMessage('Allocation created.');
      }
      setSimulation(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create allocation.');
    }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Planning" title="Allocate employees to a task" description="Choose a task and period, then assign a qualified available employee or let the system allocate automatically." actions={<Link className="btn secondary" to="/tasks">Back to tasks</Link>} />
    <form className="card form-grid" onSubmit={submit}>
      <label>Allocation mode<select className="field" value={automatic ? 'yes' : 'no'} onChange={e => { setAutomatic(e.target.value === 'yes'); setForm(current => ({ ...current, employeeId: '' })); setSimulation(null); }}><option value="no">Manual allocation</option><option value="yes">Automatic allocation</option></select></label>
      <label>Task<select className="field" value={`${form.projectId}|${form.taskId}`} onChange={e => selectTask(e.target.value)} required><option value="|">Select task</option>{(tasks.data ?? []).map(t => <option key={`${t.projectId}-${t.taskId}`} value={`${t.projectId}|${t.taskId}`}>{t.project?.projectName ?? t.projectId} - {t.taskName}</option>)}</select></label>
      <label>Start date<input className="field" type="date" value={form.startDate} onChange={e => { setForm({ ...form, startDate: e.target.value, employeeId: '' }); setSimulation(null); }} required /></label>
      <label>End date<input className="field" type="date" value={form.endDate} onChange={e => { setForm({ ...form, endDate: e.target.value, employeeId: '' }); setSimulation(null); }} /></label>
      <label>Hours per day<input className="field" type="number" min="0.5" max="12" step="0.5" value={form.hoursPerDay} onChange={e => { setForm({ ...form, hoursPerDay: e.target.value, employeeId: '' }); setSimulation(null); }} required /></label>
      <label>Required skill<select className="field" value={form.skillId} onChange={e => { setForm({ ...form, skillId: e.target.value, employeeId: '' }); setSimulation(null); }}>
        <option value="">{selectedTask?.requiredSkill ? `Use task skill: ${selectedTask.requiredSkill.skillName} ${selectedTask.requiredSkill.skillLevel ?? ''}` : 'Any skill'}</option>
        {(skills.data ?? []).map(s => <option key={s.skillId} value={s.skillId}>{s.skillName} {s.skillLevel ? `- ${s.skillLevel}` : ''}</option>)}
      </select></label>
      {!automatic && <label>Available employee<select className="field" value={form.employeeId} onChange={e => { setForm({ ...form, employeeId: e.target.value }); setSimulation(null); }} required><option value="">{candidates.loading ? 'Checking availability...' : 'Select qualified employee'}</option>{(candidates.data ?? []).map(candidate => <option key={candidate.employeeId} value={candidate.employeeId}>{candidate.fullName} - {formatNumber(candidate.minimumDailyAvailableHours)}h/day free</option>)}</select></label>}
      <button className="btn secondary" type="button" disabled={planningLoading || !hasPermission('allocations.simulate')} onClick={simulate}>{planningLoading ? 'Simulating...' : 'Simulate availability'}</button>
      <button className="btn" disabled={!automatic && !form.employeeId}>Save allocation</button>
      {message && <p className="muted form-message">{message}</p>}
    </form>

    {selectedTask && <div className="card">
      <h2>Selected task</h2>
      <p><strong>{selectedTask.taskName}</strong> <span className="muted">{selectedTask.project?.projectName ?? selectedTask.projectId}</span></p>
      <span className="badge">Estimated {formatNumber(selectedTask.estimatedHours)}h</span>
      <span className="badge">Required skill: {selectedTask.requiredSkill ? `${selectedTask.requiredSkill.skillName} ${selectedTask.requiredSkill.skillLevel ?? ''}` : 'None'}</span>
    </div>}

    {!automatic && selectedTask && !candidates.loading && candidates.data?.length === 0 && <div className="status-card status-error"><strong>No eligible employees found</strong><p>Change the period or daily hours, or verify that employees have the required skill.</p></div>}

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
        <thead><tr><th>Candidate</th><th>Status</th><th>Skill match</th><th>Available</th><th>Min daily available</th><th>Project role</th></tr></thead>
        <tbody>{simulation.candidates.map(candidate => <tr key={candidate.employeeId}><td><strong>{candidate.fullName}</strong></td><td><span className="badge">{candidate.status}</span></td><td>{candidate.matchedSkillName ? `${candidate.matchedSkillName} ${candidate.matchedSkillLevel ?? ''}` : candidate.requiredSkillName ? 'Missing' : 'Not required'}</td><td>{formatNumber(candidate.availableHours)}h</td><td>{formatNumber(candidate.minimumDailyAvailableHours)}h/day</td><td>{candidate.isProjectManager ? 'Manager' : candidate.isAssignedToProject ? 'Assigned' : 'Available pool'}</td></tr>)}</tbody>
      </table>
      {simulation.candidates.length === 0 && <p className="muted">No available candidates for this interval.</p>}
    </div>}
  </section>;
}
