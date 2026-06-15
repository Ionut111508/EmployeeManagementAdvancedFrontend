import { Link, useParams } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { dateInputValue, formatDate, formatNumber } from '../utils/format';

export function EmployeeDetailsPage() {
  const { employeeId } = useParams();
  const { session } = useAuth();
  const targetEmployeeId = session?.role === 'Employee' ? session.employeeId : employeeId;
  const routeIsAllowed = session?.role !== 'Employee' || employeeId === session.employeeId;
  const employees = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.employeesVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const allocations = useAsync(() => {
    if (!targetEmployeeId) return Promise.resolve([]);
    return api.allocationsByEmployee(targetEmployeeId);
  }, [targetEmployeeId]);
  const timesheets = useAsync(() => {
    if (!targetEmployeeId) return Promise.resolve([]);
    return api.timesheetsByEmployee(targetEmployeeId);
  }, [targetEmployeeId]);
  const skills = useAsync(() => targetEmployeeId ? api.employeeSkillsByEmployee(targetEmployeeId) : Promise.resolve([]), [targetEmployeeId]);
  const departments = useAsync(() => targetEmployeeId ? api.employeeDepartmentsByEmployee(targetEmployeeId) : Promise.resolve([]), [targetEmployeeId]);
  const employee = (employees.data ?? []).find(e => e.employeeId === targetEmployeeId);
  const employeeAllocations = allocations.data ?? [];
  const employeeTimesheets = timesheets.data ?? [];
  const employeeSkills = skills.data ?? [];
  const employeeDepartments = departments.data ?? [];
  const today = dateInputValue();
  const currentAllocated = employeeAllocations
    .filter(item => item.allocationStartDate.slice(0, 10) <= today && (item.allocationEndDate ?? item.allocationStartDate).slice(0, 10) >= today)
    .reduce((sum, item) => sum + item.allocatedHours, 0);
  const totalWorked = employeeTimesheets.reduce((sum, item) => sum + item.workedHours, 0);

  if (!routeIsAllowed) return <section className="page-stack"><div className="status-card status-error"><strong>Access denied</strong><p>You can only open your own employee profile.</p></div></section>;

  return <section className="page-stack">
    <PageHeader eyebrow="Employee profile" title={employee ? `${employee.firstName} ${employee.lastName}` : 'Employee details'} description="Employee information, skills, departments, allocations, and timesheets." />
    <Link className="btn-link" to={session?.role === 'Employee' ? '/' : '/employees'}>{session?.role === 'Employee' ? 'Back to dashboard' : 'Back to employees'}</Link>
    <Status loading={employees.loading || allocations.loading || timesheets.loading || skills.loading || departments.loading} error={employees.error ?? allocations.error ?? timesheets.error ?? skills.error ?? departments.error} empty={!employee && !employees.loading} />
    {employee && <>
      <div className="grid grid-3">
        <article className="card"><h2>Contact</h2><p>{employee.email}</p><p className="muted">{employee.phoneNumber}</p></article>
        <article className="card"><h2>Work norm</h2><p>{employee.workNorm?.workNormName ?? '-'}</p><span className="badge">{formatNumber(employee.workNorm?.workHours)}h/day</span></article>
        <article className="card"><h2>Current workload</h2><p>Allocated today: {formatNumber(currentAllocated)}h/day</p><p>Worked overall: {formatNumber(totalWorked)}h</p></article>
      </div>
      <div className="grid grid-2">
        <article className="card"><h2>Skills</h2>{employeeSkills.length ? employeeSkills.map(item => <p key={item.skillId}><strong>{item.skill?.skillName ?? item.skillId}</strong> <span className="muted">{item.skill?.skillLevel ?? ''}</span></p>) : <p className="muted">No skills assigned.</p>}</article>
        <article className="card"><h2>Departments</h2>{employeeDepartments.length ? employeeDepartments.map(item => <p key={item.departmentId}><strong>{item.department?.departmentName ?? item.departmentId}</strong> <span className="muted">from {formatDate(item.startDate)}</span></p>) : <p className="muted">No departments assigned.</p>}</article>
      </div>
      <div className="table-card"><table className="data-table"><thead><tr><th>Project</th><th>Task</th><th>Period</th><th>Hours/day</th></tr></thead><tbody>{employeeAllocations.map(a => <tr key={`${a.projectId}-${a.taskId}`}><td>{a.projectName ?? '-'}</td><td>{a.taskName ?? '-'}</td><td>{formatDate(a.allocationStartDate)} - {formatDate(a.allocationEndDate)}</td><td><span className="badge">{formatNumber(a.allocatedHours)}h</span></td></tr>)}</tbody></table></div>
      <div className="table-card"><div className="section-heading"><div><h2>Reported work</h2><p className="muted">Timesheet entries visible for this employee.</p></div><span className="badge">{formatNumber(totalWorked)}h total</span></div><table className="data-table"><thead><tr><th>Date</th><th>Project</th><th>Task</th><th>Hours</th></tr></thead><tbody>{employeeTimesheets.map(item => { const allocation = employeeAllocations.find(value => value.projectId === item.projectId && value.taskId === item.taskId); return <tr key={`${item.projectId}-${item.taskId}-${item.workDate}`}><td>{formatDate(item.workDate)}</td><td>{allocation?.projectName ?? item.projectId}</td><td>{allocation?.taskName ?? item.taskId}</td><td><span className="badge">{formatNumber(item.workedHours)}h</span></td></tr>; })}</tbody></table>{employeeTimesheets.length === 0 && <p className="muted">No reported hours yet.</p>}</div>
    </>}
  </section>;
}
