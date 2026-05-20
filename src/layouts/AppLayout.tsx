import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, CheckSquare, Clock3, Gauge, Layers3, Network, Users, Wrench } from 'lucide-react';
import { API_BASE_URL } from '../api/http';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Gauge },
  { to: '/projects', label: 'Projects', icon: BriefcaseBusiness },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/allocations', label: 'Allocations', icon: Network },
  { to: '/timesheets', label: 'Timesheets', icon: Clock3 },
  { to: '/gantt', label: 'Gantt', icon: BarChart3 },
  { to: '/departments', label: 'Departments', icon: Layers3 },
  { to: '/skills', label: 'Skills', icon: Wrench }
];

export function AppLayout() {
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
          {navItems.map(item => (
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
          <div className="role-chip">Manager Demo</div>
        </header>
        <main className="app-main"><Outlet /></main>
      </div>
    </div>
  );
}
