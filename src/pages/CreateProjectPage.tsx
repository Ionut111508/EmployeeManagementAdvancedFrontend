import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ projectId: '', projectName: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const project = await api.createProject({
        projectId: form.projectId.trim(),
        projectName: form.projectName.trim()
      });
      navigate(`/projects/${encodeURIComponent(project.projectId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project.');
    } finally {
      setSaving(false);
    }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Administration" title="Create project" description="Create the project workspace, then add tasks and assign project managers." actions={<Link className="btn secondary" to="/projects">Back to projects</Link>} />
    <form className="card form-grid" onSubmit={handleSubmit}>
      <label>Project ID<input className="field" value={form.projectId} maxLength={50} onChange={event => setForm(current => ({ ...current, projectId: event.target.value }))} placeholder="e.g. PRJ_MOBILE" required /></label>
      <label>Project name<input className="field" value={form.projectName} maxLength={100} onChange={event => setForm(current => ({ ...current, projectName: event.target.value }))} placeholder="e.g. Mobile Banking Application" required /></label>
      <button className="btn" disabled={saving}>{saving ? 'Creating...' : 'Create project'}</button>
      {error && <div className="status-card status-error form-message" role="alert"><strong>Project could not be created</strong><p>{error}</p></div>}
    </form>
  </section>;
}
