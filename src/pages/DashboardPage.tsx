import { BriefcaseBusiness, CheckSquare, Clock3, Network, Users } from 'lucide-react';
import { api } from '../api/endpoints';
import { loadVisibleAllocations, loadVisibleTimesheets } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { KpiCard } from '../components/ui/KpiCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';

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

  return <section className="page-stack">
    <PageHeader eyebrow="Overview" title="Dashboard" description="Operational indicators scoped to the current user role." />
    <Status loading={loading} error={error} />
    {data && <>
      <div className="grid grid-4">
        <KpiCard icon={Users} label="Employees" value={data.employees.length} hint="human resources" />
        <KpiCard icon={BriefcaseBusiness} label="Projects" value={data.projects.length} hint="active projects" />
        <KpiCard icon={CheckSquare} label="Tasks" value={data.tasks.length} hint="defined tasks" />
        <KpiCard icon={Network} label="Allocations" value={data.allocations.length} hint="task assignments" />
      </div>
      <div className="grid grid-2">
        <div className="card"><h2>Main workflow</h2><p className="muted">Your dashboard is filtered by role: admins see all data, managers see managed projects, employees see their own work.</p></div>
        <div className="card"><h2>Reported hours</h2><p className="muted">Total timesheet entries: <strong>{data.timesheets.length}</strong></p><KpiCard icon={Clock3} label="Timesheets" value={data.timesheets.length} /></div>
      </div>
    </>}
  </section>;
}
