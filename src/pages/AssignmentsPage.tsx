import { FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { useAsync } from '../hooks/useAsync';

export function AssignmentsPage() {
  const employees = useAsync(api.employees, []);
  const skills = useAsync(api.skills, []);
  const departments = useAsync(api.departments, []);
  const [message, setMessage] = useState<string | null>(null);
  const [skillForm, setSkillForm] = useState({ employeeId: '', skillId: '', acquiredDate: new Date().toISOString().slice(0, 10) });
  const [departmentForm, setDepartmentForm] = useState({ employeeId: '', departmentId: '', startDate: new Date().toISOString().slice(0, 10), endDate: '' });

  async function assignSkill(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      await api.createEmployeeSkill({ employeeId: skillForm.employeeId, skillId: skillForm.skillId, acquiredDate: skillForm.acquiredDate || null });
      setMessage('Skill assigned to employee.');
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
    <PageHeader eyebrow="Assignments" title="Employee assignments" description="De aici se aloca skill-uri si departamente pentru angajati." />
    {message && <div className="card"><p>{message}</p></div>}
    <div className="grid grid-2">
      <form className="card form-grid" onSubmit={assignSkill}>
        <h2>Assign skill</h2>
        <select className="field" value={skillForm.employeeId} onChange={e => setSkillForm({ ...skillForm, employeeId: e.target.value })} required><option value="">Employee</option>{(employees.data ?? []).map(e => <option key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName}</option>)}</select>
        <select className="field" value={skillForm.skillId} onChange={e => setSkillForm({ ...skillForm, skillId: e.target.value })} required><option value="">Skill</option>{(skills.data ?? []).map(s => <option key={s.skillId} value={s.skillId}>{s.skillName} {s.skillLevel ? '- ' + s.skillLevel : ''}</option>)}</select>
        <input className="field" type="date" value={skillForm.acquiredDate} onChange={e => setSkillForm({ ...skillForm, acquiredDate: e.target.value })} />
        <button className="btn">Save skill</button>
      </form>
      <form className="card form-grid" onSubmit={assignDepartment}>
        <h2>Add to department</h2>
        <select className="field" value={departmentForm.employeeId} onChange={e => setDepartmentForm({ ...departmentForm, employeeId: e.target.value })} required><option value="">Employee</option>{(employees.data ?? []).map(e => <option key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName}</option>)}</select>
        <select className="field" value={departmentForm.departmentId} onChange={e => setDepartmentForm({ ...departmentForm, departmentId: e.target.value })} required><option value="">Department</option>{(departments.data ?? []).map(d => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}</select>
        <input className="field" type="date" value={departmentForm.startDate} onChange={e => setDepartmentForm({ ...departmentForm, startDate: e.target.value })} required />
        <input className="field" type="date" value={departmentForm.endDate} onChange={e => setDepartmentForm({ ...departmentForm, endDate: e.target.value })} />
        <button className="btn">Save department</button>
      </form>
    </div>
  </section>;
}
