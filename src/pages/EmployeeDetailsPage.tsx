import { Link, useParams } from 'react-router-dom';
import { api } from '../api/endpoints';
import { loadVisibleAllocations, loadVisibleTimesheets } from '../api/scoped';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Status } from '../components/ui/Status';
import { useAsync } from '../hooks/useAsync';
import { formatDate, formatNumber } from '../utils/format';

export function EmployeeDetailsPage() {
  const { employeeId } = useParams();
  const { session, access } = useAuth();
  const employees = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return api.employeesVisibleTo(session.employeeId);
  }, [session?.employeeId]);
  const allocations = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return loadVisibleAllocations(session, access);
  }, [session?.employeeId, access?.managedProjectIds.join('|')]);
  const timesheets = useAsync(() => {
    if (!session) throw new Error('Login is required.');
    return loadVisibleTimesheets(session, access);
  }, [session?.employeeId, access?.managedProjectIds.join('|')]);
  const skills = useAsync(api.employeeSkills, []);
  const departments = useAsync(api.employeeDepartments, []);
  const employee = (employees.data ?? []).find(e => e.employeeId === employeeId);
  const employeeAllocations = (allocations.data ?? []).filter(a => a.employeeId === employeeId);
  const employeeTimesheets = (timesheets.data ?? []).filter(t => t.employeeId === employeeId);
  const employeeSkills = (skills.data ?? []).filter(s => s.employeeId === employeeId);
  const employeeDepartments = (departments.data ?? []).filter(d => d.employeeId === employeeId);
  const totalAllocated = employeeAllocations.reduce((sum, item) => sum + item.allocatedHours, 0);
  const totalWorked = employeeTimesheets.reduce((sum, item) => sum + item.workedHours, 0);

  return <section className="page-stack">
    <PageHeader eyebrow="Employee profile" title={employee ? `${employee.firstName} ${employee.lastName}` : 'Employee details'} description="Employee information, skills, departments, allocations, and timesheets." />
    <Link className="btn-link" to={session?.role === 'Employee' ? '/' : '/employees'}>{session?.role === 'Employee' ? 'Back to dashboard' : 'Back to employees'}</Link>
    <Status loading={employees.loading} error={employees.error} empty={!employee && !employees.loading} />
    {employee && <>
      <div className="grid grid-3">
        <article className="card"><h2>Contact</h2><p>{employee.email}</p><p className="muted">{employee.phoneNumber}</p></article>
        <article className="card"><h2>Work norm</h2><p>{employee.workNorm?.workNormName ?? '-'}</p><span className="badge">{formatNumber(employee.workNorm?.workHours)}h/day</span></article>
        <article className="card"><h2>Totals</h2><p>Allocated: {formatNumber(totalAllocated)}h/day</p><p>Worked: {formatNumber(totalWorked)}h</p></article>
      </div>
      <div className="grid grid-2">
        <article className="card"><h2>Skills</h2>{employeeSkills.length ? employeeSkills.map(item => <p key={item.skillId}><strong>{item.skill?.skillName ?? item.skillId}</strong> <span className="muted">{item.skill?.skillLevel ?? ''}</span></p>) : <p className="muted">No skills assigned.</p>}</article>
        <article className="card"><h2>Departments</h2>{employeeDepartments.length ? employeeDepartments.map(item => <p key={item.departmentId}><strong>{item.department?.departmentName ?? item.departmentId}</strong> <span className="muted">from {formatDate(item.startDate)}</span></p>) : <p className="muted">No departments assigned.</p>}</article>
      </div>
      <div className="table-card"><table className="data-table"><thead><tr><th>Project</th><th>Task</th><th>Period</th><th>Hours/day</th></tr></thead><tbody>{employeeAllocations.map(a => <tr key={`${a.projectId}-${a.taskId}`}><td>{a.projectName ?? '-'}</td><td>{a.taskName ?? '-'}</td><td>{formatDate(a.allocationStartDate)} - {formatDate(a.allocationEndDate)}</td><td><span className="badge">{formatNumber(a.allocatedHours)}h</span></td></tr>)}</tbody></table></div>
    </>}
  </section>;
}
