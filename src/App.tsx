import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { EmployeeDetailsPage } from './pages/EmployeeDetailsPage';
import { CreateEmployeePage } from './pages/CreateEmployeePage';
import { TasksPage } from './pages/TasksPage';
import { CreateTaskPage } from './pages/CreateTaskPage';
import { AllocationsPage } from './pages/AllocationsPage';
import { CreateAllocationPage } from './pages/CreateAllocationPage';
import { TimesheetsPage } from './pages/TimesheetsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { SkillsPage } from './pages/SkillsPage';
import { GanttPage } from './pages/GanttPage';
import { RolesPage } from './pages/RolesPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/create" element={<CreateTaskPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="people/:employeeId" element={<EmployeeDetailsPage />} />
        <Route path="employees/create" element={<CreateEmployeePage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="allocations" element={<AllocationsPage />} />
        <Route path="allocations/create" element={<CreateAllocationPage />} />
        <Route path="timesheets" element={<TimesheetsPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="gantt" element={<GanttPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
