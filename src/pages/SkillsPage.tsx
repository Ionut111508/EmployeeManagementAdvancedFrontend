import { useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';

export function SkillsPage() {
  const { session } = useAuth();
  const skills = useAsync(api.skills, []);
  const employees = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.employeesVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const relations = useAsync(api.employeeSkills, []);
  const [skillFilter, setSkillFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [includeUnused, setIncludeUnused] = useState(false);
  const levels = useMemo(() => Array.from(new Set((skills.data ?? []).map(s => s.skillLevel).filter(Boolean))) as string[], [skills.data]);
  const visibleEmployeeIds = useMemo(() => new Set((employees.data ?? []).map(e => e.employeeId)), [employees.data]);
  const assignedSkillIds = useMemo(() => new Set((relations.data ?? []).filter(relation => visibleEmployeeIds.has(relation.employeeId)).map(relation => relation.skillId)), [relations.data, visibleEmployeeIds]);
  const visibleSkills = useMemo(() => (skills.data ?? []).filter(s =>
    (skillFilter === 'all' || s.skillId === skillFilter) &&
    (levelFilter === 'all' || s.skillLevel === levelFilter) &&
    (session?.role !== 'Manager' || includeUnused || assignedSkillIds.has(s.skillId))), [skills.data, skillFilter, levelFilter, session?.role, includeUnused, assignedSkillIds]);

  return <section className="page-stack">
    <PageHeader eyebrow="Configuration" title="Skills" description="Skills, levels, and employees who have them." />
    <div className="card filter-bar"><strong>Filters</strong><select className="field" value={skillFilter} onChange={e => setSkillFilter(e.target.value)}><option value="all">All skills</option>{(skills.data ?? []).map(s => <option key={s.skillId} value={s.skillId}>{s.skillName}</option>)}</select><select className="field" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}><option value="all">All levels</option>{levels.map(level => <option key={level} value={level}>{level}</option>)}</select>{session?.role === 'Manager' && <label className="filter-check"><input type="checkbox" checked={includeUnused} onChange={e => setIncludeUnused(e.target.checked)} /> Include skills without assigned employees</label>}</div>
    <Status loading={skills.loading} error={skills.error} empty={visibleSkills.length === 0} />
    {skills.data && <div className="grid grid-3">{visibleSkills.map(s => { const people = (relations.data ?? []).filter(x => x.skillId === s.skillId && visibleEmployeeIds.has(x.employeeId)); return <article className="card" key={s.skillId}><h2>{s.skillName}</h2><p className="muted">Level: {s.skillLevel ?? '-'}</p><div className="role-list">{people.map(item => <div className="role-list-item" key={item.employeeId}><strong>{item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : 'Unknown employee'}</strong></div>)}{people.length === 0 && <p className="muted">No employees assigned.</p>}</div></article>; })}</div>}
  </section>;
}
