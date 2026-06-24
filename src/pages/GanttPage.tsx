import { useMemo, useState } from 'react';
import { loadVisibleAllocations } from '../api/scoped';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import type { Allocation, TaskItem } from '../types/domain';
import { dateInputValue, formatDate, formatNumber, parseLocalDate } from '../utils/format';

const day = 1000 * 60 * 60 * 24;
const today = new Date();
today.setHours(0, 0, 0, 0);

interface GanttTaskRow {
  task: TaskItem;
  projectId: string;
  projectName: string;
  startDate: string;
  endDate: string;
  start: Date;
  end: Date;
  allocations: Allocation[];
  employeeNames: string[];
  totalDailyHours: number;
}

export function GanttPage() {
  const { session, access } = useAuth();
  const [projectFilter, setProjectFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, loading, error } = useAsync(async () => {
    if (!session) throw new Error('Login is required.');
    const [tasks, allocations] = await Promise.all([
      api.tasksVisibleTo(session.employeeId),
      loadVisibleAllocations(session, access)
    ]);
    return { tasks, allocations };
  }, [session?.employeeId, access?.managedProjectIds.join('|')]);

  const rows = useMemo(() => {
    const allocationsByTask = new Map<string, Allocation[]>();
    for (const allocation of data?.allocations ?? []) {
      const key = `${allocation.projectId}|${allocation.taskId}`;
      allocationsByTask.set(key, [...(allocationsByTask.get(key) ?? []), allocation]);
    }

    return (data?.tasks ?? []).map(task => {
      const allocations = allocationsByTask.get(`${task.projectId}|${task.taskId}`) ?? [];
      const allocationStarts = allocations.map(item => item.allocationStartDate).filter(Boolean);
      const allocationEnds = allocations.map(item => item.allocationEndDate ?? item.allocationStartDate).filter(Boolean);
      const startDate = task.plannedStartDate ?? allocationStarts.sort()[0];
      allocationEnds.sort();
      const endDate = task.plannedEndDate ?? allocationEnds[allocationEnds.length - 1] ?? startDate;
      if (!startDate || !endDate) return null;

      return {
        task,
        projectId: task.projectId,
        projectName: task.project?.projectName ?? allocations[0]?.projectName ?? task.projectId,
        startDate,
        endDate,
        start: parseLocalDate(startDate),
        end: parseLocalDate(endDate),
        allocations,
        employeeNames: Array.from(new Set(allocations.map(item => item.employeeName ?? item.employeeId))),
        totalDailyHours: allocations.reduce((sum, item) => sum + item.allocatedHours, 0)
      } satisfies GanttTaskRow;
    }).filter((row): row is GanttTaskRow => row !== null);
  }, [data]);

  const projects = useMemo(() => Array.from(new Map(rows.map(row => [row.projectId, row.projectName])).entries()), [rows]);
  const employees = useMemo(() => Array.from(new Map((data?.allocations ?? []).map(item => [item.employeeId, item.employeeName ?? item.employeeId])).entries()), [data]);

  const filtered = useMemo(() => rows.filter(row => {
    const matchesProject = projectFilter === 'all' || row.projectId === projectFilter;
    const matchesEmployee = employeeFilter === 'all' || row.allocations.some(item => item.employeeId === employeeFilter);
    const isClosed = row.task.status === 'Completed' || row.task.status === 'Cancelled' || row.end < today;
    const isActive = !isClosed && row.start <= today && row.end >= today;
    const isFuture = !isClosed && row.start > today;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && isActive) || (statusFilter === 'closed' && isClosed) || (statusFilter === 'future' && isFuture);
    return matchesProject && matchesEmployee && matchesStatus;
  }), [rows, projectFilter, employeeFilter, statusFilter]);

  const projectGroups = useMemo(() => {
    const groups = new Map<string, GanttTaskRow[]>();
    for (const row of filtered) groups.set(row.projectId, [...(groups.get(row.projectId) ?? []), row]);
    return Array.from(groups.entries()).map(([projectId, tasks]) => {
      const sortedTasks = [...tasks].sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime() || a.task.taskName.localeCompare(b.task.taskName));
      const start = new Date(Math.min(...sortedTasks.map(item => item.start.getTime())));
      const end = new Date(Math.max(...sortedTasks.map(item => item.end.getTime())));
      return { projectId, projectName: sortedTasks[0].projectName, tasks: sortedTasks, start, end, totalDays: Math.max(1, Math.round((end.getTime() - start.getTime()) / day) + 1) };
    }).sort((a, b) => a.start.getTime() - b.start.getTime() || a.projectName.localeCompare(b.projectName));
  }, [filtered]);

  return <section className="page-stack">
    <PageHeader eyebrow="Planning" title="Gantt Chart" description="Project schedules with one timeline row per task." />
    <div className="card filter-bar"><strong>Filters</strong><label>Project<select className="field" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}><option value="all">All projects</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>{session?.role !== 'Employee' && <label>Employee<select className="field" value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}><option value="all">All employees</option>{employees.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>}<label>Status<select className="field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="active">Active now</option><option value="future">Future</option><option value="closed">Completed</option></select></label><span className="badge">{filtered.length} tasks</span></div>
    <Status loading={loading} error={error} empty={filtered.length === 0} />
    {projectGroups.map(group => <div className="table-card gantt-card" key={group.projectId}>
      <div className="gantt-summary"><div><span>Project</span><strong>{group.projectName}</strong></div><div className="gantt-project-range"><span>Planned interval</span><strong>{formatDate(dateInputValue(group.start))} - {formatDate(dateInputValue(group.end))}</strong></div></div>
      <div className="gantt-list">
        <div className="gantt-columns"><span>Task</span><span>Start</span><span>Project timeline</span><span>End</span><span>Staffing</span></div>
        {group.tasks.map(row => {
          const left = Math.max(0, ((row.start.getTime() - group.start.getTime()) / day) / group.totalDays * 100);
          const width = Math.max(3, (((row.end.getTime() - row.start.getTime()) / day) + 1) / group.totalDays * 100);
          const timelineStatus = row.task.status === 'Completed' || row.task.status === 'Cancelled' || row.end < today ? 'completed' : row.start > today ? 'future' : 'active';
          const staffing = row.allocations.length === 0 ? 'Unstaffed' : `${row.employeeNames.length} ${row.employeeNames.length === 1 ? 'person' : 'people'}`;
          return <div className="gantt-row" key={`${row.projectId}-${row.task.taskId}`}>
            <div className="gantt-label"><strong>{row.task.taskName}</strong><span>{row.task.status}</span></div>
            <time className="gantt-date">{formatDate(row.startDate)}</time>
            <div className="gantt-track"><div className={`gantt-bar gantt-${timelineStatus}`} tabIndex={0} style={{ left: `${left}%`, width: `${width}%` }}><span className="gantt-bar-label">{row.task.status}</span><div className="gantt-tooltip" role="tooltip"><strong>{row.task.taskName}</strong><span>{formatDate(row.startDate)} - {formatDate(row.endDate)}</span><span>Estimated: {formatNumber(row.task.estimatedHours)}h</span><span>{row.employeeNames.length ? `Allocated: ${row.employeeNames.join(', ')}` : 'No employees allocated'}</span>{row.allocations.length > 0 && <span>Total daily allocation: {formatNumber(row.totalDailyHours)}h/day</span>}</div></div></div>
            <time className="gantt-date">{formatDate(row.endDate)}</time>
            <div className="gantt-staffing"><strong>{staffing}</strong>{row.allocations.length > 0 && <span>{formatNumber(row.totalDailyHours)}h/day</span>}</div>
          </div>;
        })}
      </div>
    </div>)}
  </section>;
}
