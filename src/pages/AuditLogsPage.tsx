import { useMemo, useState } from 'react';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../utils/format';

export function AuditLogsPage() {
  const [entityType, setEntityType] = useState('all');
  const logs = useAsync(() => api.auditLogs({ limit: 200 }), []);
  const types = useMemo(() => Array.from(new Set((logs.data ?? []).map(item => item.entityType))).sort(), [logs.data]);
  const visible = useMemo(() => (logs.data ?? []).filter(item => entityType === 'all' || item.entityType === entityType), [logs.data, entityType]);

  return <section className="page-stack">
    <PageHeader eyebrow="Governance" title="Audit log" description="Traceable history of task, allocation and timesheet changes." />
    <div className="card filter-bar"><strong>Filter</strong><select className="field" value={entityType} onChange={event => setEntityType(event.target.value)}><option value="all">All entity types</option>{types.map(type => <option key={type} value={type}>{type}</option>)}</select><span className="badge">{visible.length} events</span></div>
    <Status loading={logs.loading} error={logs.error} empty={visible.length === 0} />
    {logs.data && visible.length > 0 && <div className="table-card"><table className="data-table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Project</th><th>Summary</th></tr></thead><tbody>{visible.map(item => <tr key={item.auditLogId}><td>{formatDate(item.createdAt)}<br/><span className="muted">{new Date(item.createdAt).toLocaleTimeString('ro-RO')}</span></td><td>{item.actorEmployeeId ?? 'System'}<br/><span className="badge">{item.actorRole}</span></td><td><span className="badge">{item.action}</span></td><td>{item.entityType}<br/><span className="muted">{item.entityId}</span></td><td>{item.projectId ?? '-'}</td><td>{item.summary}</td></tr>)}</tbody></table></div>}
  </section>;
}
