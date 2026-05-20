import { http } from './http';
import type { Allocation, Department, Employee, Project, ProjectSummary, Skill, TaskComment, TaskItem, Timesheet, WorkNorm } from '../types/domain';

export const api = {
  projects: () => http.get<Project[]>('/Projects').then(r => r.data),
  projectById: (id: string) => http.get<Project>(`/Projects/${id}`).then(r => r.data),
  employees: () => http.get<Employee[]>('/Employees').then(r => r.data),
  tasks: () => http.get<TaskItem[]>('/Tasks').then(r => r.data),
  allocations: () => http.get<Allocation[]>('/Allocations').then(r => r.data),
  timesheets: () => http.get<Timesheet[]>('/Timesheets').then(r => r.data),
  departments: () => http.get<Department[]>('/Departments').then(r => r.data),
  skills: () => http.get<Skill[]>('/Skills').then(r => r.data),
  workNorms: () => http.get<WorkNorm[]>('/WorkNorms').then(r => r.data),
  taskComments: () => http.get<TaskComment[]>('/TaskComments').then(r => r.data),
  projectSummary: (projectId: string) => http.get<ProjectSummary>(`/Dashboard/project/${projectId}/summary`).then(r => r.data)
};
