import { FormEvent, useState } from 'react';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { useAsync } from '../hooks/useAsync';

export function CreateTaskPage() {
  const { session } = useAuth();
  const projects = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.projectsVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const skills = useAsync(api.skills, []);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ projectId: '', taskId: '', taskName: '', estimatedHours: '40', descriptionId: '', taskDescriptionText: '', requiredSkillId: '' });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      await api.createDescription({ descriptionId: form.descriptionId, taskDescriptionText: form.taskDescriptionText });
      await api.createTask({ projectId: form.projectId, taskId: form.taskId, taskName: form.taskName, estimatedHours: Number(form.estimatedHours), descriptionId: form.descriptionId, requiredSkillId: form.requiredSkillId || null });
      setMessage('Task created successfully.');
      setForm({ projectId: '', taskId: '', taskName: '', estimatedHours: '40', descriptionId: '', taskDescriptionText: '', requiredSkillId: '' });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create task.');
    }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Create" title="Create task" description="Create a description and then the task associated with a project." />
    <form className="card form-grid" onSubmit={handleSubmit}>
      <select className="field" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} required>
        <option value="">Select project</option>
        {(projects.data ?? []).map(p => <option key={p.projectId} value={p.projectId}>{p.projectName}</option>)}
      </select>
      <input className="field" placeholder="Task ID" value={form.taskId} onChange={e => setForm({ ...form, taskId: e.target.value })} required />
      <input className="field" placeholder="Task name" value={form.taskName} onChange={e => setForm({ ...form, taskName: e.target.value })} required />
      <input className="field" type="number" min="1" placeholder="Estimated hours" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} required />
      <select className="field" value={form.requiredSkillId} onChange={e => setForm({ ...form, requiredSkillId: e.target.value })}>
        <option value="">No minimum skill</option>
        {(skills.data ?? []).map(skill => <option key={skill.skillId} value={skill.skillId}>{skill.skillName} {skill.skillLevel ? `- ${skill.skillLevel}` : ''}</option>)}
      </select>
      <input className="field" placeholder="Description ID" value={form.descriptionId} onChange={e => setForm({ ...form, descriptionId: e.target.value })} required />
      <input className="field" placeholder="Description text" value={form.taskDescriptionText} onChange={e => setForm({ ...form, taskDescriptionText: e.target.value })} required />
      <button className="btn">Create task</button>
      {message && <p className="muted form-message">{message}</p>}
    </form>
  </section>;
}
