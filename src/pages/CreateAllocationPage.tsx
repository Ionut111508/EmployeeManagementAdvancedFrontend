import { FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { useAsync } from '../hooks/useAsync';

export function CreateAllocationPage() {
  const employees = useAsync(api.employees, []);
  const tasks = useAsync(api.tasks, []);
  const skills = useAsync(api.skills, []);
  const [automatic, setAutomatic] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ employeeId: '', projectId: '', taskId: '', startDate: '', endDate: '', hoursPerDay: '4', skillId: '' });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      if (automatic) await api.createAutoAllocation({ projectId: form.projectId, taskId: form.taskId, startDate: form.startDate, endDate: form.endDate || null, hoursPerDay: Number(form.hoursPerDay), skillId: form.skillId || null });
      else await api.createAllocation({ employeeId: form.employeeId, projectId: form.projectId, taskId: form.taskId, allocationStartDate: form.startDate, allocationEndDate: form.endDate || null, allocatedHours: Number(form.hoursPerDay) });
<<<<<<< HEAD
      setMessage('Allocation created successfully.');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Eroare la creare.'); }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Planning" title="Create allocation" description="Choose to manually select an employee or let the application choose automatically." />
=======
      setMessage('Allocation created.');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Could not create allocation.'); }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Planning" title="Create allocation" description="Choose the employee manually or let the application select one automatically." />
>>>>>>> 0fd9f40032bec48bf6cfcca9de2800957d248042
    <form className="card form-grid" onSubmit={submit}>
      <select className="field" value={automatic ? 'yes' : 'no'} onChange={e => setAutomatic(e.target.value === 'yes')}><option value="yes">Automatic</option><option value="no">Manual</option></select>
      {!automatic && <select className="field" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}><option value="">Employee</option>{(employees.data ?? []).map(e => <option key={e.employeeId} value={e.employeeId}>{e.firstName} {e.lastName}</option>)}</select>}
      <select className="field" value={`${form.projectId}|${form.taskId}`} onChange={e => { const parts = e.target.value.split('|'); setForm({ ...form, projectId: parts[0], taskId: parts[1] }); }} required><option value="|">Task</option>{(tasks.data ?? []).map(t => <option key={`${t.projectId}-${t.taskId}`} value={`${t.projectId}|${t.taskId}`}>{t.project?.projectName ?? t.projectId} - {t.taskName}</option>)}</select>
      <input className="field" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
      <input className="field" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
      <input className="field" type="number" min="1" max="12" value={form.hoursPerDay} onChange={e => setForm({ ...form, hoursPerDay: e.target.value })} required />
      {automatic && <select className="field" value={form.skillId} onChange={e => setForm({ ...form, skillId: e.target.value })}><option value="">Any skill</option>{(skills.data ?? []).map(s => <option key={s.skillId} value={s.skillId}>{s.skillName}</option>)}</select>}
      <button className="btn">Save allocation</button>
      {message && <p className="muted form-message">{message}</p>}
    </form>
  </section>;
}
