import { http } from './http';
import type { Account, AccountCreate, Allocation, AllocationCreate, AutoAllocationCreate, Department, Employee, EmployeeCreate, EmployeeDepartment, EmployeeRole, EmployeeSkill, LoginRequest, LoginResponse, Project, ProjectSummary, Skill, TaskComment, TaskCreate, TaskDescription, TaskDescriptionCreate, TaskItem, Timesheet, WorkNorm } from '../types/domain';

export const api = {
  login: (payload: LoginRequest) => http.post<LoginResponse>('/Login', payload).then(r => r.data),

  projects: () => http.get<Project[]>('/Projects').then(r => r.data),
  projectById: (id: string) => http.get<Project>(`/Projects/${id}`).then(r => r.data),

  accounts: () => http.get<Account[]>('/Accounts').then(r => r.data),
  createAccount: (payload: AccountCreate) => http.post<Account>('/Accounts', payload).then(r => r.data),

  employees: () => http.get<Employee[]>('/Employees').then(r => r.data),
  createEmployee: (payload: EmployeeCreate) => http.post<Employee>('/Employees', payload).then(r => r.data),
  employeeRoles: () => http.get<EmployeeRole[]>('/Roles/employees').then(r => r.data),

  tasks: () => http.get<TaskItem[]>('/Tasks').then(r => r.data),
  createTask: (payload: TaskCreate) => http.post<TaskItem>('/Tasks', payload).then(r => r.data),

  descriptions: () => http.get<TaskDescription[]>('/Descriptions').then(r => r.data),
  createDescription: (payload: TaskDescriptionCreate) => http.post<TaskDescription>('/Descriptions', payload).then(r => r.data),

  allocations: () => http.get<Allocation[]>('/Allocations').then(r => r.data),
  createAllocation: (payload: AllocationCreate) => http.post<Allocation>('/Allocations', payload).then(r => r.data),
  createAutoAllocation: (payload: AutoAllocationCreate) => http.post<Allocation>('/Allocations/auto', payload).then(r => r.data),

  timesheets: () => http.get<Timesheet[]>('/Timesheets').then(r => r.data),
  departments: () => http.get<Department[]>('/Departments').then(r => r.data),
  employeeDepartments: () => http.get<EmployeeDepartment[]>('/EmployeeDepartments').then(r => r.data),
  skills: () => http.get<Skill[]>('/Skills').then(r => r.data),
  employeeSkills: () => http.get<EmployeeSkill[]>('/EmployeeSkills').then(r => r.data),
  workNorms: () => http.get<WorkNorm[]>('/WorkNorms').then(r => r.data),
  taskComments: () => http.get<TaskComment[]>('/TaskComments').then(r => r.data),
  projectSummary: (projectId: string) => http.get<ProjectSummary>(`/Dashboard/project/${projectId}/summary`).then(r => r.data)
};
