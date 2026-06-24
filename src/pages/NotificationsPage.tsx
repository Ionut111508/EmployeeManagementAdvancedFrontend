import { Bell, CircleAlert, Clock3, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate } from '../utils/format';

const icons = { StaffingDeficit: Users, OverAllocation: CircleAlert, TimesheetApproval: Clock3, TaskDelayed: CircleAlert };

export function NotificationsPage() {
  const notifications = useAsync(() => api.notifications(30), []);
  return <section className="page-stack">
    <PageHeader eyebrow="Operations" title="Notifications" description="Capacity, staffing and approval issues that require attention." />
    <Status loading={notifications.loading} error={notifications.error} empty={notifications.data?.length === 0} emptyText="No operational alerts in the next 30 days." />
    {notifications.data && <div className="notification-list">{notifications.data.map(item => {
      const Icon = icons[item.type] ?? Bell;
      const target = item.taskId && item.projectId ? `/task-view/${item.projectId}/${item.taskId}` : item.type === 'TimesheetApproval' ? '/timesheets' : '/allocations';
      return <article className={`notification-item severity-${item.severity.toLowerCase()}`} key={item.notificationId}>
        <div className="notification-icon"><Icon size={20} /></div>
        <div><div className="notification-heading"><strong>{item.title}</strong><span className="badge">{item.severity}</span></div><p>{item.message}</p>{item.relevantDate && <small>Relevant date: {formatDate(item.relevantDate)}</small>}</div>
        <Link className="btn secondary" to={target}>Open</Link>
      </article>;
    })}</div>}
  </section>;
}
