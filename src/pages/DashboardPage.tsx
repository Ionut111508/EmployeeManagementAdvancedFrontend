import { BriefcaseBusiness, CheckSquare, Clock3, Network, Users } from 'lucide-react';
import { api } from '../api/endpoints';
import { loadVisibleAllocations, loadVisibleTimesheets } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { KpiCard } from '../components/ui/KpiCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { dateInputValue, formatNumber } from '../utils/format';

export function DashboardPage() {
  const { session, access } = useAuth();
  const { data, loading, error } = useAsync(async () => {
    if (!session) throw new Error('Login is required.');
    const [employees, projects, tasks, allocations, timesheets] = await Promise.all([
      api.employeesVisibleTo(session.employeeId),
      api.projectsVisibleTo(session.employeeId),
      api.tasksVisibleTo(session.employeeId),
      loadVisibleAllocations(session, access),
      loadVisibleTimesheets(session, access)
    ]);
    return { employees, projects, tasks, allocations, timesheets };
  }, [session?.employeeId, access?.managedProjectIds.join('|')]);

  const today = dateInputValue();
  const totalWorkedHours = data?.timesheets.reduce((sum, entry) => sum + entry.workedHours, 0) ?? 0;
  const activeAllocations = data?.allocations.filter(allocation => allocation.allocationStartDate.slice(0, 10) <= today && (allocation.allocationEndDate ?? allocation.allocationStartDate).slice(0, 10) >= today).length ?? 0;
  const completedTasks = data?.tasks.filter(task => task.plannedEndDate && task.plannedEndDate.slice(0, 10) < today).length ?? 0;

  return <section className="page-stack">
    <PageHeader eyebrow="Overview" title="Dashboard" description="Operational indicators scoped to the current user role." />
    <Status loading={loading} error={error} />
    {data && <>
      <div className="grid grid-4">
        <KpiCard icon={Users} label="Employees" value={data.employees.length} hint="human resources" />
        <KpiCard icon={BriefcaseBusiness} label="Projects" value={data.projects.length} hint="active projects" />
        <KpiCard icon={CheckSquare} label="Tasks" value={data.tasks.length} hint="defined tasks" />
        <KpiCard icon={Network} label="Active allocations" value={activeAllocations} hint={`${data.allocations.length} planned records`} />
      </div>
      <div className="grid grid-2">
        <div className="card"><h2>Planning status</h2><p className="muted"><strong>{completedTasks}</strong> tasks completed before today. The dashboard is scoped by role: admins see the company, managers their projects, and employees their assignments.</p></div>
        <div className="card"><h2>Reported work</h2><p className="muted">Across <strong>{data.timesheets.length}</strong> timesheet entries.</p><div className="dashboard-metric"><Clock3 size={22} /><div><strong>{formatNumber(totalWorkedHours)}h</strong><span>worked hours reported through today</span></div></div></div>
      </div>
    </>}
  </section>;
}
