import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { employeeName, formatDate, formatNumber } from '../utils/format';

export function TimesheetsPage() {
  const { data, loading, error } = useAsync(api.timesheets, []);
  return <section className="page-stack">
    <PageHeader eyebrow="Pontaj" title="Timesheets" description="Ore lucrate raportate de angajați pe task-uri." />
    <Status loading={loading} error={error} empty={data?.length === 0} />
    {data && <div className="table-card"><table className="data-table"><thead><tr><th>Date</th><th>Employee</th><th>Project</th><th>Task</th><th>Hours</th></tr></thead><tbody>{data.map(t => <tr key={`${t.employeeId}-${t.projectId}-${t.taskId}-${t.workDate}`}><td>{formatDate(t.workDate)}</td><td>{employeeName(t.employee)}</td><td>{t.projectId}</td><td>{t.taskItem?.taskName ?? t.taskId}</td><td><span className="badge">{formatNumber(t.workedHours)}h</span></td></tr>)}</tbody></table></div>}
  </section>;
}
