import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { useAuth } from './auth/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { EmployeeDetailsPage } from './pages/EmployeeDetailsPage';
import { CreateEmployeePage } from './pages/CreateEmployeePage';
import { TasksPage } from './pages/TasksPage';
import { CreateTaskPage } from './pages/CreateTaskPage';
import { TaskDetailsPage } from './pages/TaskDetailsPage';
import { AllocationsPage } from './pages/AllocationsPage';
import { CreateAllocationPage } from './pages/CreateAllocationPage';
import { TimesheetsPage } from './pages/TimesheetsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { SkillsPage } from './pages/SkillsPage';
import { AssignmentsPage } from './pages/AssignmentsPage';
import { EmployeeLeavesPage } from './pages/EmployeeLeavesPage';
import { GanttPage } from './pages/GanttPage';
import { RolesPage } from './pages/RolesPage';
import { LoginPage } from './pages/LoginPage';
import { AccountsPage } from './pages/AccountsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import type { Permission } from './types/domain';

function AccessDenied() {
  return <section className="page-stack">
    <div className="status-card status-error">
      <strong>Access denied</strong>
      <p>You do not have permission to open this page.</p>
    </div>
  </section>;
}

function RequirePermission({ anyOf, children }: { anyOf: Permission[]; children: ReactElement }) {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(anyOf) ? children : <AccessDenied />;
}

export default function App() {
  const { isAuthenticated, login } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<RequirePermission anyOf={['projects.view.all', 'projects.view.managed', 'projects.view.assigned']}><ProjectsPage /></RequirePermission>} />
        <Route path="projects/create" element={<RequirePermission anyOf={['projects.manage']}><CreateProjectPage /></RequirePermission>} />
        <Route path="projects/:projectId" element={<RequirePermission anyOf={['projects.view.all', 'projects.view.managed', 'projects.view.assigned']}><ProjectDetailsPage /></RequirePermission>} />
        <Route path="tasks" element={<RequirePermission anyOf={['tasks.view.all', 'tasks.view.managed', 'tasks.view.assigned']}><TasksPage /></RequirePermission>} />
        <Route path="tasks/create" element={<RequirePermission anyOf={['tasks.manage', 'tasks.manage.managed']}><CreateTaskPage /></RequirePermission>} />
        <Route path="task-view/:projectId/:taskId" element={<RequirePermission anyOf={['tasks.view.all', 'tasks.view.managed', 'tasks.view.assigned']}><TaskDetailsPage /></RequirePermission>} />
        <Route path="employees" element={<RequirePermission anyOf={['employees.view.all', 'employees.view.available']}><EmployeesPage /></RequirePermission>} />
        <Route path="people/:employeeId" element={<RequirePermission anyOf={['profile.view', 'employees.view.all', 'employees.view.available']}><EmployeeDetailsPage /></RequirePermission>} />
        <Route path="employees/create" element={<RequirePermission anyOf={['employees.manage']}><CreateEmployeePage /></RequirePermission>} />
        <Route path="roles" element={<RequirePermission anyOf={['roles.manage']}><RolesPage /></RequirePermission>} />
        <Route path="accounts" element={<RequirePermission anyOf={['accounts.manage']}><AccountsPage /></RequirePermission>} />
        <Route path="allocations" element={<RequirePermission anyOf={['allocations.view.all', 'allocations.view.managed', 'allocations.view.own']}><AllocationsPage /></RequirePermission>} />
        <Route path="allocations/create" element={<RequirePermission anyOf={['allocations.manage', 'allocations.manage.managed']}><CreateAllocationPage /></RequirePermission>} />
        <Route path="timesheets" element={<RequirePermission anyOf={['timesheets.view.all', 'timesheets.view.team', 'timesheets.manage.own']}><TimesheetsPage /></RequirePermission>} />
        <Route path="leaves" element={<RequirePermission anyOf={['leaves.manage', 'leaves.view.team', 'leaves.request']}><EmployeeLeavesPage /></RequirePermission>} />
        <Route path="departments" element={<RequirePermission anyOf={['employees.view.all', 'employees.view.available']}><DepartmentsPage /></RequirePermission>} />
        <Route path="skills" element={<RequirePermission anyOf={['employees.view.all', 'employees.view.available']}><SkillsPage /></RequirePermission>} />
        <Route path="assignments" element={<RequirePermission anyOf={['employees.manage', 'employees.manage.managed']}><AssignmentsPage /></RequirePermission>} />
        <Route path="gantt" element={<RequirePermission anyOf={['allocations.view.all', 'allocations.view.managed', 'allocations.view.own']}><GanttPage /></RequirePermission>} />
        <Route path="notifications" element={<RequirePermission anyOf={['notifications.view']}><NotificationsPage /></RequirePermission>} />
        <Route path="audit" element={<RequirePermission anyOf={['audit.view.all', 'audit.view.managed']}><AuditLogsPage /></RequirePermission>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
