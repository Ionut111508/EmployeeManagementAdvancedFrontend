import { FormEvent, useMemo, useState } from 'react';
import { BriefcaseBusiness, ShieldCheck, UserCog } from 'lucide-react';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import type { EmployeeRole, UserRole } from '../types/domain';

const roleDescriptions: Record<UserRole, string> = {
  Admin: 'Full company access, including accounts, roles and all projects.',
  Manager: 'Manages staffing, tasks, leaves and timesheets only for assigned projects.',
  Employee: 'Sees only their own profile, assigned work, allocations and timesheets.'
};

export function RolesPage() {
  const [refresh, setRefresh] = useState(0);
  const roles = useAsync(api.employeeRoles, [refresh]);
  const projects = useAsync(api.projects, []);
  const [editing, setEditing] = useState<EmployeeRole | null>(null);
  const [role, setRole] = useState<UserRole>('Employee');
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const grouped = useMemo(() => ({
    Admin: (roles.data ?? []).filter(item => item.role === 'Admin'),
    Manager: (roles.data ?? []).filter(item => item.role === 'Manager'),
    Employee: (roles.data ?? []).filter(item => item.role === 'Employee')
  }), [roles.data]);

  function startEditing(person: EmployeeRole) {
    setEditing(person);
    setRole(person.role);
    setProjectIds(person.managedProjectIds ?? []);
    setMessage(null);
  }

  function toggleProject(projectId: string) {
    setProjectIds(current => current.includes(projectId)
      ? current.filter(id => id !== projectId)
      : [...current, projectId]);
  }

  async function saveRole(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setMessage(null);
    try {
      await api.updateEmployeeRole(editing.employeeId, {
        role,
        managedProjectIds: role === 'Manager' ? projectIds : []
      });
      setEditing(null);
      setRefresh(value => value + 1);
      setMessage('Role access updated. The employee receives the new permissions at the next login.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update role access.');
    }
  }

  return <section className="page-stack">
    <PageHeader eyebrow="Access control" title="Roles and project access" description="Promote employees, assign managers to projects, and keep every role inside its operational scope." />
    {message && <div className="status-card status-success"><strong>{message}</strong></div>}
    {editing && <form className="card role-editor" onSubmit={saveRole}>
      <div className="role-editor-heading">
        <div><p className="eyebrow">Edit access</p><h2>{editing.fullName}</h2><p className="muted">{editing.username}</p></div>
        <UserCog size={28} />
      </div>
      <label>Role<select className="field" value={role} onChange={event => { setRole(event.target.value as UserRole); if (event.target.value !== 'Manager') setProjectIds([]); }}><option value="Employee">Employee</option><option value="Manager">Manager</option><option value="Admin">Admin</option></select></label>
      <p className="muted">{roleDescriptions[role]}</p>
      {role === 'Manager' && <fieldset className="project-access-list">
        <legend>Managed projects</legend>
        {(projects.data ?? []).map(project => <label key={project.projectId} className="project-access-option"><input type="checkbox" checked={projectIds.includes(project.projectId)} onChange={() => toggleProject(project.projectId)} /><span><strong>{project.projectName}</strong><small>{project.projectId}</small></span></label>)}
        {projects.data?.length === 0 && <p className="muted">Create a project before promoting a manager.</p>}
      </fieldset>}
      <div className="page-actions"><button className="btn" disabled={role === 'Manager' && projectIds.length === 0}>Save access</button><button className="btn secondary" type="button" onClick={() => setEditing(null)}>Cancel</button></div>
    </form>}
    <Status loading={roles.loading || projects.loading} error={roles.error ?? projects.error} empty={roles.data?.length === 0} />
    {roles.data && <div className="grid grid-3">{(['Admin', 'Manager', 'Employee'] as UserRole[]).map(currentRole => <article className="card" key={currentRole}>
      <div className="role-card-head"><div className="kpi-icon">{currentRole === 'Manager' ? <BriefcaseBusiness size={20} /> : <ShieldCheck size={20} />}</div><span className={`badge role-${currentRole.toLowerCase()}`}>{grouped[currentRole].length}</span></div>
      <h2>{currentRole}</h2><p className="muted">{roleDescriptions[currentRole]}</p>
      <div className="role-list">{grouped[currentRole].map(person => <div className="role-list-item" key={person.employeeId}><div><strong>{person.fullName}</strong><p className="muted">{person.username}</p>{person.role === 'Manager' && <small>{person.managedProjectNames.length ? person.managedProjectNames.join(', ') : 'No project assigned'}</small>}</div><button className="btn secondary" type="button" onClick={() => startEditing(person)}>Manage</button></div>)}</div>
    </article>)}</div>}
  </section>;
}
