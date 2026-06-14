import { NavLink, Outlet } from 'react-router-dom';
import type { ElementType } from 'react';
import { BarChart3, BriefcaseBusiness, CheckSquare, Clock3, Gauge, Layers3, Link2, LogOut, Network, ShieldCheck, UserCog, Users, Wrench } from 'lucide-react';
import { API_BASE_URL } from '../api/http';
import { useAuth } from '../auth/AuthContext';
import type { Permission } from '../types/domain';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Gauge },
  { to: '/projects', label: 'Projects', icon: BriefcaseBusiness, permissions: ['projects.view.all', 'projects.view.managed', 'projects.view.assigned'] },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare, permissions: ['tasks.view.all', 'tasks.view.managed', 'tasks.view.assigned'] },
  { to: '/employees', label: 'Employees', icon: Users, permissions: ['employees.view.all', 'employees.view.available'] },
  { to: '/accounts', label: 'Accounts', icon: UserCog, permissions: ['accounts.manage'] },
  { to: '/roles', label: 'Roles', icon: ShieldCheck, permissions: ['roles.manage'] },
  { to: '/allocations', label: 'Allocations', icon: Network, permissions: ['allocations.view.all', 'allocations.view.managed', 'allocations.view.own'] },
  { to: '/assignments', label: 'Assignments', icon: Link2, permissions: ['employees.manage'] },
  { to: '/leaves', label: 'Leaves', icon: Clock3, permissions: ['leaves.manage', 'leaves.view.team', 'leaves.request'] },
  { to: '/timesheets', label: 'Timesheets', icon: Clock3, permissions: ['timesheets.view.all', 'timesheets.view.team', 'timesheets.manage.own'] },
  { to: '/gantt', label: 'Gantt', icon: BarChart3, permissions: ['allocations.view.all', 'allocations.view.managed', 'allocations.view.own'] },
  { to: '/departments', label: 'Departments', icon: Layers3, permissions: ['employees.view.all', 'employees.view.available'] },
  { to: '/skills', label: 'Skills', icon: Wrench, permissions: ['employees.view.all', 'employees.view.available'] }
] satisfies Array<{ to: string; label: string; icon: ElementType; permissions?: Permission[] }>;

export function AppLayout() {
  const { session, logout, hasAnyPermission } = useAuth();
  const visibleNavItems = navItems.filter(item => !item.permissions || hasAnyPermission(item.permissions));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">PM</div>
          <div>
            <strong>NovaTech</strong>
            <span>Project Suite</span>
          </div>
        </div>
        <nav className="side-nav">
          {visibleNavItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="content-shell">
        <header className="topbar">
          <div>
            <span className="muted small-label">API</span>
            <strong>{API_BASE_URL}</strong>
          </div>
          <div className="topbar-actions">
            <div className="session-summary">
              <strong>{session?.fullName}</strong>
              <span className={`role-chip role-${session?.role.toLowerCase()}`}>{session?.role}</span>
            </div>
            <button className="btn secondary" type="button" onClick={logout}><LogOut size={16} /> Logout</button>
          </div>
        </header>
        <main className="app-main"><Outlet /></main>
      </div>
    </div>
  );
}
