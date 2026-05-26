import { BriefcaseBusiness, CheckSquare, Clock3, Network, Users } from 'lucide-react';
import { api } from '../api/endpoints';
import { KpiCard } from '../components/ui/KpiCard';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';

export function DashboardPage() {
  const { data, loading, error } = useAsync(async () => {
    const [employees, projects, tasks, allocations, timesheets] = await Promise.all([
      api.employees(), api.projects(), api.tasks(), api.allocations(), api.timesheets()
    ]);
    return { employees, projects, tasks, allocations, timesheets };
  }, []);

  return <section className="page-stack">
    <PageHeader eyebrow="Overview" title="Dashboard" description="Operational indicators for projects, tasks, employees, allocations, and timesheets." />
    <Status loading={loading} error={error} />
    {data && <>
      <div className="grid grid-4">
        <KpiCard icon={Users} label="Employees" value={data.employees.length} hint="human resources" />
        <KpiCard icon={BriefcaseBusiness} label="Projects" value={data.projects.length} hint="active projects" />
        <KpiCard icon={CheckSquare} label="Tasks" value={data.tasks.length} hint="defined tasks" />
<<<<<<< HEAD
        <KpiCard icon={Network} label="Allocations" value={data.allocations.length} hint="assignments for tasks" />
      </div>
      <div className="grid grid-2">
        <div className="card"><h2>Main workflow</h2><p className="muted">The manager tracks projects, tasks, allocations, and employee timesheets.</p></div>
=======
        <KpiCard icon={Network} label="Allocations" value={data.allocations.length} hint="task assignments" />
      </div>
      <div className="grid grid-2">
        <div className="card"><h2>Main workflow</h2><p className="muted">Managers track projects, tasks, allocations, and employee timesheets.</p></div>
>>>>>>> 0fd9f40032bec48bf6cfcca9de2800957d248042
        <div className="card"><h2>Reported hours</h2><p className="muted">Total timesheet entries: <strong>{data.timesheets.length}</strong></p><KpiCard icon={Clock3} label="Timesheets" value={data.timesheets.length} /></div>
      </div>
    </>}
  </section>;
}
