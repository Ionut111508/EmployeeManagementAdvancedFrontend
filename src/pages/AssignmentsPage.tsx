import { FormEvent, useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { useAsync } from '../hooks/useAsync';
import { dateInputValue } from '../utils/format';

export function AssignmentsPage() {
  const { session } = useAuth();
  const employees = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.employeesVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const skills = useAsync(api.skills, []);
  const departments = useAsync(api.departments, []);
  const [message, setMessage] = useState<string | null>(null);
  const [skillForm, setSkillForm] = useState({ employeeId: '', skillName: '', skillLevel: '', acquiredDate: dateInputValue() });
  const [departmentForm, setDepartmentForm] = useState({ employeeId: '', departmentId: '', startDate: dateInputValue(), endDate: '' });
  const skillNames = useMemo(() => Array.from(new Set((skills.data ?? []).map(skill => skill.skillName))).sort(), [skills.data]);
  const skillLevels = useMemo(() => Array.from(new Set((skills.data ?? [])
    .filter(skill => skill.skillName === skillForm.skillName)
    .map(skill => skill.skillLevel ?? 'Unspecified'))).sort(), [skills.data, skillForm.skillName]);
  const selectedSkill = (skills.data ?? []).find(skill => skill.skillName === skillForm.skillName && (skill.skillLevel ?? 'Unspecified') === skillForm.skillLevel);

  async function assignSkill(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!selectedSkill) {
      setMessage('Select both a skill and its level.');
      return;
    }
    try {
      await api.createEmployeeSkill({ employeeId: skillForm.employeeId, skillId: selectedSkill.skillId, acquiredDate: skillForm.acquiredDate || null });
      setMessage('Skill assigned to employee.');
      setSkillForm({ employeeId: '', skillName: '', skillLevel: '', acquiredDate: dateInputValue() });
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Could not assign skill.'); }
  }

  async function assignDepartment(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      await api.createEmployeeDepartment({ employeeId: departmentForm.employeeId, departmentId: departmentForm.departmentId, startDate: departmentForm.startDate, endDate: departmentForm.endDate || null });
      setMessage('Employee added to department.');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Could not assign department.'); }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Assignments" title="Employee assignments" description="Assign skills and departments to employees from this page." />
    {message && <div className="card"><p>{message}</p></div>}
    <div className="grid grid-2">
      <form className="card form-grid" onSubmit={assignSkill}>
        <h2>Assign skill</h2>
        <label>Skill<select className="field" value={skillForm.skillName} onChange={e => setSkillForm({ ...skillForm, skillName: e.target.value, skillLevel: '' })} required><option value="">Select skill</option>{skillNames.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
        <label>Level<select className="field" value={skillForm.skillLevel} onChange={e => setSkillForm({ ...skillForm, skillLevel: e.target.value })} required disabled={!skillForm.skillName}><option value="">Select level</option>{skillLevels.map(level => <option key={level} value={level}>{level}</option>)}</select></label>
        <label>Employee<select className="field" value={skillForm.employeeId} onChange={e => setSkillForm({ ...skillForm, employeeId: e.target.value })} required><option value="">Select employee</option>{(employees.data ?? []).map(e => <option key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName}</option>)}</select></label>
        <label>Acquired date<input className="field" type="date" value={skillForm.acquiredDate} onChange={e => setSkillForm({ ...skillForm, acquiredDate: e.target.value })} /></label>
        <button className="btn" disabled={!selectedSkill}>Save skill</button>
      </form>
      <form className="card form-grid" onSubmit={assignDepartment}>
        <h2>Add to department</h2>
        <label>Employee<select className="field" value={departmentForm.employeeId} onChange={e => setDepartmentForm({ ...departmentForm, employeeId: e.target.value })} required><option value="">Select employee</option>{(employees.data ?? []).map(e => <option key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName}</option>)}</select></label>
        <label>Department<select className="field" value={departmentForm.departmentId} onChange={e => setDepartmentForm({ ...departmentForm, departmentId: e.target.value })} required><option value="">Select department</option>{(departments.data ?? []).map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}</select></label>
        <label>Assignment start<input className="field" type="date" value={departmentForm.startDate} onChange={e => setDepartmentForm({ ...departmentForm, startDate: e.target.value, endDate: departmentForm.endDate && departmentForm.endDate < e.target.value ? e.target.value : departmentForm.endDate })} required /></label>
        <label>Assignment end (optional)<input className="field" type="date" min={departmentForm.startDate} value={departmentForm.endDate} onChange={e => setDepartmentForm({ ...departmentForm, endDate: e.target.value })} /></label>
        <button className="btn">Save department</button>
      </form>
    </div>
  </section>;
}
