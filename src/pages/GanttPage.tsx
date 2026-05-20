import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber } from '../utils/format';

const day = 1000 * 60 * 60 * 24;

export function GanttPage() {
  const { data, loading, error } = useAsync(async () => {
    const allocations = await api.allocations();
    const ranges = allocations.map(a => ({ ...a, start: new Date(a.allocationStartDate), end: new Date(a.allocationEndDate ?? a.allocationStartDate) }));
    const min = ranges.length ? new Date(Math.min(...ranges.map(r => r.start.getTime()))) : new Date();
    const max = ranges.length ? new Date(Math.max(...ranges.map(r => r.end.getTime()))) : new Date();
    const totalDays = Math.max(1, Math.round((max.getTime() - min.getTime()) / day) + 1);
    return { ranges, min, max, totalDays };
  }, []);

  return <section className="page-stack">
    <PageHeader eyebrow="Planning" title="Gantt Chart" description="Vizualizare simplă a perioadelor de alocare pe task-uri și angajați." />
    <Status loading={loading} error={error} empty={data?.ranges.length === 0} />
    {data && <div className="table-card gantt-card">
      <div className="gantt-header"><strong>{formatDate(data.min.toISOString())}</strong><span className="muted">Interval planificare</span><strong>{formatDate(data.max.toISOString())}</strong></div>
      <div className="gantt-list">
        {data.ranges.map(item => {
          const left = Math.max(0, ((item.start.getTime() - data.min.getTime()) / day) / data.totalDays * 100);
          const width = Math.max(4, (((item.end.getTime() - item.start.getTime()) / day) + 1) / data.totalDays * 100);
          return <div className="gantt-row" key={`${item.employeeId}-${item.projectId}-${item.taskId}`}>
            <div className="gantt-label"><strong>{item.taskName ?? item.taskId}</strong><span>{item.employeeName ?? item.employeeId} · {item.projectName ?? item.projectId} · {formatNumber(item.allocatedHours)}h/zi</span></div>
            <div className="gantt-track"><div className="gantt-bar" style={{ left: `${left}%`, width: `${width}%` }}>{formatDate(item.allocationStartDate)}</div></div>
          </div>;
        })}
      </div>
    </div>}
  </section>;
}
