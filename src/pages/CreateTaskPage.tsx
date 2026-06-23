import { FormEvent, useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import type { TaskPlanningPreview } from '../types/domain';
import { addDays, dateInputValue, formatNumber } from '../utils/format';

const today = dateInputValue();
const twoWeeksFromNow = dateInputValue(addDays(new Date(), 14));

const emptyForm = {
  projectId: '', taskId: '', taskName: '', estimatedHours: '40', descriptionId: '',
  descriptionText: '', requiredSkillId: '', plannedStartDate: today, plannedEndDate: twoWeeksFromNow,
  allocationMode: 'Automatic' as 'Automatic' | 'Manual'
};

export function CreateTaskPage() {
  const { session } = useAuth();
  const projects = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.projectsVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const skills = useAsync(api.skills, []);
  const [form, setForm] = useState(emptyForm);
  const [plan, setPlan] = useState<TaskPlanningPreview | null>(null);
  const [manualHours, setManualHours] = useState<Record<string, string>>({});
  const [planning, setPlanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const manualTotal = useMemo(() => plan
    ? Object.values(manualHours).reduce((sum, value) => sum + (Number(value) || 0) * plan.workingDays, 0)
    : 0, [manualHours, plan]);

  function updatePlanningField<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm(current => ({ ...current, [key]: value }));
    if (key !== 'allocationMode') {
      setPlan(null);
      setManualHours({});
    }
  }

  async function analyzeCapacity() {
    setError(null);
    setMessage(null);
    setPlanning(true);
    try {
      const result = await api.previewTaskPlanning({
        projectId: form.projectId,
        estimatedHours: Number(form.estimatedHours),
        requiredSkillId: form.requiredSkillId || null,
        plannedStartDate: form.plannedStartDate,
        plannedEndDate: form.plannedEndDate
      });
      setPlan(result);
      setManualHours({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capacity analysis failed.');
    } finally {
      setPlanning(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (!plan) {
      setError('Analyze capacity before creating the task.');
      return;
    }

    setSaving(true);
    try {
      const result = await api.createPlannedTask({
        projectId: form.projectId,
        taskId: form.taskId,
        taskName: form.taskName,
        estimatedHours: Number(form.estimatedHours),
        descriptionId: form.descriptionId,
        descriptionText: form.descriptionText,
        requiredSkillId: form.requiredSkillId || null,
        plannedStartDate: form.plannedStartDate,
        plannedEndDate: form.plannedEndDate,
        allocationMode: form.allocationMode,
        manualAllocations: form.allocationMode === 'Manual'
          ? Object.entries(manualHours)
              .filter(([, value]) => Number(value) > 0)
              .map(([employeeId, value]) => ({ employeeId, hoursPerDay: Number(value) }))
          : []
      });
      setMessage(`Task created: ${result.staffingStatus}. ${formatNumber(result.allocatedHours)}h allocated, ${formatNumber(result.remainingHours)}h remaining.`);
      setForm(emptyForm);
      setPlan(null);
      setManualHours({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the planned task.');
    } finally {
      setSaving(false);
    }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Resource planning" title="Create and staff task" description="Define the work, analyze safe capacity, then confirm a manual or automatic allocation plan." />
    <form className="page-stack" onSubmit={handleSubmit}>
      <div className="card form-grid">
        <h2>Task details</h2>
        <select className="field" value={form.projectId} onChange={e => updatePlanningField('projectId', e.target.value)} required>
          <option value="">Select project</option>
          {(projects.data ?? []).map(project => <option key={project.projectId} value={project.projectId}>{project.projectName}</option>)}
        </select>
        <input className="field" placeholder="Task ID" value={form.taskId} onChange={e => setForm({ ...form, taskId: e.target.value })} required />
        <input className="field" placeholder="Task name" value={form.taskName} onChange={e => setForm({ ...form, taskName: e.target.value })} required />
        <input className="field" type="number" min="0.25" step="0.25" placeholder="Estimated hours" value={form.estimatedHours} onChange={e => updatePlanningField('estimatedHours', e.target.value)} required />
        <select className="field" value={form.requiredSkillId} onChange={e => updatePlanningField('requiredSkillId', e.target.value)}>
          <option value="">No minimum skill</option>
          {(skills.data ?? []).map(skill => <option key={skill.skillId} value={skill.skillId}>{skill.skillName} {skill.skillLevel ? `- ${skill.skillLevel}` : ''}</option>)}
        </select>
        <input className="field" placeholder="Description ID" value={form.descriptionId} onChange={e => setForm({ ...form, descriptionId: e.target.value })} required />
        <label>Planned start<input className="field" type="date" min={today} value={form.plannedStartDate} onChange={e => { updatePlanningField('plannedStartDate', e.target.value); if (form.plannedEndDate < e.target.value) updatePlanningField('plannedEndDate', e.target.value); }} required /></label>
        <label>Planned end<input className="field" type="date" min={form.plannedStartDate || today} value={form.plannedEndDate} onChange={e => updatePlanningField('plannedEndDate', e.target.value)} required /></label>
        <textarea className="field field-span" placeholder="Task description" value={form.descriptionText} onChange={e => setForm({ ...form, descriptionText: e.target.value })} required />
        <div className="field-span filter-bar">
          <label><input type="radio" checked={form.allocationMode === 'Automatic'} onChange={() => updatePlanningField('allocationMode', 'Automatic')} /> Automatic allocation</label>
          <label><input type="radio" checked={form.allocationMode === 'Manual'} onChange={() => updatePlanningField('allocationMode', 'Manual')} /> Manual allocation</label>
          <button className="btn secondary" type="button" onClick={analyzeCapacity} disabled={planning || !form.projectId}>{planning ? 'Analyzing...' : 'Analyze capacity'}</button>
        </div>
      </div>

      {error && <Status error={error} />}
      {message && <div className="status-card">{message}</div>}

      {plan && <div className="table-card">
        <div className="gantt-header"><div><h2>Capacity result</h2><p className="muted">{plan.workingDays} working days; capacity is based on the lowest free daily capacity in the interval.</p></div><span className="badge">{plan.canFullyStaff ? 'Can be fully staffed' : `${formatNumber(plan.remainingUncoveredHours)}h uncovered`}</span></div>
        <div className="grid grid-3 simulation-kpis">
          <div><span>Estimated effort</span><strong>{formatNumber(plan.estimatedHours)}h</strong></div>
          <div><span>Safe qualified capacity</span><strong>{formatNumber(plan.safeAvailableHours)}h</strong></div>
          <div><span>Qualified candidates</span><strong>{plan.candidates.filter(candidate => candidate.maxAssignableHours > 0).length}</strong></div>
        </div>

        {form.allocationMode === 'Automatic' && <>
          <h3>Automatic proposal</h3>
          <Status empty={plan.automaticPlan.length === 0} />
          {plan.automaticPlan.length > 0 && <table className="data-table"><thead><tr><th>Employee</th><th>Hours/day</th><th>Total</th></tr></thead><tbody>{plan.automaticPlan.map(item => <tr key={item.employeeId}><td><strong>{item.employeeName}</strong></td><td>{formatNumber(item.hoursPerDay)}h</td><td>{formatNumber(item.totalHours)}h</td></tr>)}</tbody></table>}
        </>}

        {form.allocationMode === 'Manual' && <>
          <div className="gantt-header"><h3>Manual selection</h3><span className="badge">{formatNumber(manualTotal)}h selected; {formatNumber(Math.max(plan.estimatedHours - manualTotal, 0))}h remaining</span></div>
          <table className="data-table"><thead><tr><th>Select</th><th>Employee</th><th>Matched skill</th><th>Current load</th><th>Daily free</th><th>Safe total</th><th>Hours/day</th></tr></thead><tbody>{plan.candidates.map(candidate => {
            const eligible = candidate.maxAssignableHours > 0;
            const selected = manualHours[candidate.employeeId] !== undefined;
            return <tr key={candidate.employeeId}><td><input type="checkbox" disabled={!eligible} checked={selected} onChange={e => setManualHours(current => { const next = { ...current }; if (e.target.checked) next[candidate.employeeId] = String(Math.min(candidate.minimumDailyAvailableHours, 4)); else delete next[candidate.employeeId]; return next; })} /></td><td><strong>{candidate.fullName}</strong><br/><span className="muted">{candidate.status}</span></td><td>{candidate.matchedSkillName ? `${candidate.matchedSkillName} ${candidate.matchedSkillLevel ?? ''}` : form.requiredSkillId ? '-' : 'Not required'}</td><td>{formatNumber(candidate.existingAllocatedHours)}h / {formatNumber(candidate.capacityHours)}h</td><td>{formatNumber(candidate.minimumDailyAvailableHours)}h/day</td><td>{formatNumber(candidate.maxAssignableHours)}h</td><td>{selected ? <input className="field compact-field" type="number" min="0.01" max={candidate.minimumDailyAvailableHours} step="0.01" value={manualHours[candidate.employeeId]} onChange={e => setManualHours(current => ({ ...current, [candidate.employeeId]: e.target.value }))} /> : '-'}</td></tr>;
          })}</tbody></table>
        </>}
      </div>}

      <button className="btn submit-plan" disabled={saving || !plan}>{saving ? 'Creating task...' : `Create task with ${form.allocationMode.toLowerCase()} allocation`}</button>
    </form>
  </section>;
}
