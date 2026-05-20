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
    <PageHeader eyebrow="Overview" title="Dashboard" description="Indicatori operaționali pentru proiecte, task-uri, angajați, alocări și pontaj." />
    <Status loading={loading} error={error} />
    {data && <>
      <div className="grid grid-4">
        <KpiCard icon={Users} label="Employees" value={data.employees.length} hint="resurse umane" />
        <KpiCard icon={BriefcaseBusiness} label="Projects" value={data.projects.length} hint="proiecte active" />
        <KpiCard icon={CheckSquare} label="Tasks" value={data.tasks.length} hint="sarcini definite" />
        <KpiCard icon={Network} label="Allocations" value={data.allocations.length} hint="asignări pe task-uri" />
      </div>
      <div className="grid grid-2">
        <div className="card"><h2>Flux principal</h2><p className="muted">Managerul urmărește proiectele, task-urile, alocările și pontajele angajaților.</p></div>
        <div className="card"><h2>Ore raportate</h2><p className="muted">Total înregistrări pontaj: <strong>{data.timesheets.length}</strong></p><KpiCard icon={Clock3} label="Timesheets" value={data.timesheets.length} /></div>
      </div>
    </>}
  </section>;
}
