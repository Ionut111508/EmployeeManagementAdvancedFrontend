import { http } from './http';
import type { Account, AccountCreate, AccountUpdate, Allocation, AllocationAvailability, AllocationAvailabilityRequest, AllocationCreate, AllocationSimulation, AllocationSimulationRequest, AutoAllocationCreate, AutoAllocationResult, CreatePlannedTaskRequest, CreatePlannedTaskResponse, Department, Employee, EmployeeCreate, EmployeeDepartment, EmployeeDepartmentCreate, EmployeeLeave, EmployeeLeaveCreate, EmployeeLeavePlan, EmployeeRole, EmployeeRoleUpdate, EmployeeSkill, EmployeeSkillCreate, LoginRequest, LoginResponse, Project, ProjectSummary, ResourcePlanningOverview, Skill, TaskComment, TaskCreate, TaskDescription, TaskDescriptionCreate, TaskItem, TaskPlanningPreview, TaskPlanningPreviewRequest, TaskStaffing, Timesheet, UserAccess, WorkNorm } from '../types/domain';

export const api = {
  login: (payload: LoginRequest) => http.post<LoginResponse>('/Auth/login', payload).then(r => r.data),
  accessForEmployee: (employeeId: string) => http.get<UserAccess>(`/Access/employee/${employeeId}`).then(r => r.data),

  projects: () => http.get<Project[]>('/Projects').then(r => r.data),
  projectsVisibleTo: (employeeId: string) => http.get<Project[]>(`/Projects/visible-to/${employeeId}`).then(r => r.data),
  projectById: (id: string) => http.get<Project>(`/Projects/${id}`).then(r => r.data),

  accounts: () => http.get<Account[]>('/Accounts').then(r => r.data),
  createAccount: (payload: AccountCreate) => http.post<Account>('/Accounts', payload).then(r => r.data),
  updateAccount: (accountId: string, payload: AccountUpdate) => http.put(`/Accounts/${accountId}`, payload).then(r => r.data),

  employees: () => http.get<Employee[]>('/Employees').then(r => r.data),
  employeesVisibleTo: (employeeId: string) => http.get<Employee[]>(`/Employees/visible-to/${employeeId}`).then(r => r.data),
  createEmployee: (payload: EmployeeCreate) => http.post<Employee>('/Employees', payload).then(r => r.data),
  employeeRoles: () => http.get<EmployeeRole[]>('/EmployeeRoles').then(r => r.data),
  updateEmployeeRole: (employeeId: string, payload: EmployeeRoleUpdate) => http.put<EmployeeRole>(`/EmployeeRoles/${employeeId}`, payload).then(r => r.data),

  tasks: () => http.get<TaskItem[]>('/Tasks').then(r => r.data),
  tasksVisibleTo: (employeeId: string) => http.get<TaskItem[]>(`/Tasks/visible-to/${employeeId}`).then(r => r.data),
  taskStaffing: (params: { startDate: string; endDate?: string | null; projectId?: string | null; hoursPerDay?: number }) => http.get<TaskStaffing[]>('/Tasks/staffing', { params }).then(r => r.data),
  createTask: (payload: TaskCreate) => http.post<TaskItem>('/Tasks', payload).then(r => r.data),
  previewTaskPlanning: (payload: TaskPlanningPreviewRequest) => http.post<TaskPlanningPreview>('/Tasks/planning-preview', payload).then(r => r.data),
  createPlannedTask: (payload: CreatePlannedTaskRequest) => http.post<CreatePlannedTaskResponse>('/Tasks/create-planned', payload).then(r => r.data),

  descriptions: () => http.get<TaskDescription[]>('/Descriptions').then(r => r.data),
  createDescription: (payload: TaskDescriptionCreate) => http.post<TaskDescription>('/Descriptions', payload).then(r => r.data),

  allocations: () => http.get<Allocation[]>('/Allocations').then(r => r.data),
  allocationsByEmployee: (employeeId: string) => http.get<Allocation[]>(`/Allocations/employee/${employeeId}`).then(r => r.data),
  allocationsByProject: (projectId: string) => http.get<Allocation[]>(`/Allocations/project/${projectId}`).then(r => r.data),
  allocationsByTask: (projectId: string, taskId: string) => http.get<Allocation[]>(`/Allocations/task/${projectId}/${taskId}`).then(r => r.data),
  allocationAvailability: (params: AllocationAvailabilityRequest) => http.get<AllocationAvailability[]>('/Allocations/availability', { params }).then(r => r.data),
  underutilizedEmployees: (params: AllocationAvailabilityRequest) => http.get<AllocationAvailability[]>('/Allocations/underutilized', { params }).then(r => r.data),
  resourcePlanningOverview: (params: { startDate: string; windowDays?: number; projectId?: string | null }) => http.get<ResourcePlanningOverview>('/Allocations/planning-overview', { params }).then(r => r.data),
  simulateAllocation: (payload: AllocationSimulationRequest) => http.post<AllocationSimulation>('/Allocations/simulate', payload).then(r => r.data),
  createAllocation: (payload: AllocationCreate) => http.post<Allocation>('/Allocations', payload).then(r => r.data),
  createAutoAllocation: (payload: AutoAllocationCreate) => http.post<AutoAllocationResult>('/Allocations/auto', payload).then(r => r.data),

  timesheets: () => http.get<Timesheet[]>('/Timesheets').then(r => r.data),
  timesheetsByEmployee: (employeeId: string) => http.get<Timesheet[]>(`/Timesheets/employee/${employeeId}`).then(r => r.data),
  timesheetsByTask: (projectId: string, taskId: string) => http.get<Timesheet[]>(`/Timesheets/task/${projectId}/${taskId}`).then(r => r.data),
  createTimesheet: (payload: Omit<Timesheet, 'employee' | 'taskItem'>) => http.post<Timesheet>('/Timesheets', payload).then(r => r.data),
  departments: () => http.get<Department[]>('/Departments').then(r => r.data),
  employeeDepartments: () => http.get<EmployeeDepartment[]>('/EmployeeDepartments').then(r => r.data),
  employeeDepartmentsByEmployee: (employeeId: string) => http.get<EmployeeDepartment[]>(`/EmployeeDepartments/employee/${employeeId}`).then(r => r.data),
  createEmployeeDepartment: (payload: EmployeeDepartmentCreate) => http.post<EmployeeDepartment>('/EmployeeDepartments', payload).then(r => r.data),
  skills: () => http.get<Skill[]>('/Skills').then(r => r.data),
  employeeSkills: () => http.get<EmployeeSkill[]>('/EmployeeSkills').then(r => r.data),
  employeeSkillsByEmployee: (employeeId: string) => http.get<EmployeeSkill[]>(`/EmployeeSkills/employee/${employeeId}`).then(r => r.data),
  createEmployeeSkill: (payload: EmployeeSkillCreate) => http.post<EmployeeSkill>('/EmployeeSkills', payload).then(r => r.data),
  employeeLeaves: () => http.get<EmployeeLeave[]>('/EmployeeLeaves').then(r => r.data),
  createEmployeeLeave: (payload: EmployeeLeaveCreate) => http.post('/EmployeeLeaves', payload).then(r => r.data),
  employeeLeavePlan: (leaveId: string) => http.get<EmployeeLeavePlan>(`/EmployeeLeaves/${leaveId}/plan`).then(r => r.data),
  workNorms: () => http.get<WorkNorm[]>('/WorkNorms').then(r => r.data),
  taskComments: () => http.get<TaskComment[]>('/TaskComments').then(r => r.data),
  projectSummary: (projectId: string) => http.get<ProjectSummary>(`/Dashboard/project/${projectId}/summary`).then(r => r.data)
};
