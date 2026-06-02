import { api } from './endpoints';
import type { Allocation, LoginResponse, Timesheet, UserAccess } from '../types/domain';

export async function loadVisibleAllocations(session: LoginResponse, access: UserAccess | null): Promise<Allocation[]> {
  if (session.role === 'Admin') return api.allocations();
  if (session.role === 'Employee') return api.allocationsByEmployee(session.employeeId);

  const projectIds = access?.managedProjectIds ?? [];
  const grouped = await Promise.all(projectIds.map(projectId => api.allocationsByProject(projectId)));
  return dedupeAllocations(grouped.flat());
}

export async function loadVisibleTimesheets(session: LoginResponse, access: UserAccess | null): Promise<Timesheet[]> {
  if (session.role === 'Admin') return api.timesheets();
  if (session.role === 'Employee') return api.timesheetsByEmployee(session.employeeId);

  const allocations = await loadVisibleAllocations(session, access);
  const taskKeys = Array.from(new Map(allocations.map(a => [`${a.projectId}|${a.taskId}`, a])).values());
  const grouped = await Promise.all(taskKeys.map(item => api.timesheetsByTask(item.projectId, item.taskId)));
  return dedupeTimesheets(grouped.flat());
}

function dedupeAllocations(items: Allocation[]) {
  return Array.from(new Map(items.map(item => [`${item.employeeId}|${item.projectId}|${item.taskId}`, item])).values());
}

function dedupeTimesheets(items: Timesheet[]) {
  return Array.from(new Map(items.map(item => [`${item.employeeId}|${item.projectId}|${item.taskId}|${item.workDate}`, item])).values());
}
