import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber } from '../utils/format';

export function AllocationsPage() {
  const { data, loading, error } = useAsync(api.allocations, []);
  return <section className="page-stack">
    <PageHeader eyebrow="Resource planning" title="Allocations" description="Alocări de angajați pe proiecte și task-uri, folosite pentru Gantt și workload." />
    <Status loading={loading} error={error} empty={data?.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Employee</th><th>Project</th><th>Task</th><th>Period</th><th>Hours/day</th></tr></thead><tbody>{data.map(a => <tr key={`${a.employeeId}-${a.projectId}-${a.taskId}`}><td>{a.employeeName ?? a.employeeId}<br/><span className="muted">{a.employeeId}</span></td><td>{a.projectName ?? a.projectId}</td><td>{a.taskName ?? a.taskId}</td><td>{formatDate(a.allocationStartDate)} - {formatDate(a.allocationEndDate)}</td><td><span className="badge">{formatNumber(a.allocatedHours)}h</span></td></tr>)}</tbody></table></div>}
  </section>;
}
