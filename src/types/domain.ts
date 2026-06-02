export type UserRole = 'Admin' | 'Manager' | 'Employee';
export type Permission =
  | 'accounts.manage'
  | 'roles.manage'
  | 'employees.view.all'
  | 'employees.manage'
  | 'employees.view.available'
  | 'projects.view.all'
  | 'projects.manage'
  | 'projects.view.managed'
  | 'projects.view.assigned'
  | 'tasks.view.all'
  | 'tasks.manage'
  | 'tasks.view.managed'
  | 'tasks.manage.managed'
  | 'tasks.view.assigned'
  | 'allocations.view.all'
  | 'allocations.manage'
  | 'allocations.view.managed'
  | 'allocations.manage.managed'
  | 'allocations.view.own'
  | 'allocations.simulate'
  | 'availability.view'
  | 'leaves.manage'
  | 'leaves.view.team'
  | 'leaves.request'
  | 'timesheets.view.all'
  | 'timesheets.view.team'
  | 'timesheets.manage.own'
  | 'profile.view';

export interface Account { accountId: string; username: string; role?: UserRole; }
export interface AccountCreate { accountId: string; username: string; password: string; role?: UserRole; }
export interface WorkNorm { workNormId: string; workNormName: string; workHours: number; }
export interface Department { departmentId: string; departmentName: string; }
export interface Skill { skillId: string; skillName: string; skillLevel?: string | null; }
export interface LoginRequest { username: string; password: string; }
export interface LoginResponse { token?: string; accountId: string; username: string; role: UserRole; fullName: string; employeeId: string; permissions: Permission[]; expiresAt?: string; }
export interface UserAccess { accountId: string; username: string; employeeId: string; fullName: string; role: UserRole; permissions: Permission[]; managedProjectIds: string[]; canViewAllCompanyData: boolean; canManageRoles: boolean; canViewAvailability: boolean; }
export interface Employee { employeeId: string; firstName: string; lastName: string; email: string; phoneNumber: string; accountId: string; workNormId: string; account?: Account | null; workNorm?: WorkNorm | null; }
export interface EmployeeCreate { employeeId: string; lastName: string; firstName: string; email: string; phoneNumber: string; accountId: string; workNormId: string; }
export interface EmployeeRole { employeeId: string; fullName: string; username: string; role: UserRole; projectsManaged?: number; description?: string; }
export interface Project { projectId: string; projectName: string; }
export interface TaskDescription { descriptionId: string; taskDescriptionText?: string | null; }
export interface TaskDescriptionCreate { descriptionId: string; taskDescriptionText: string; }
export interface TaskItem { projectId: string; taskId: string; taskName: string; estimatedHours?: number | null; descriptionId?: string | null; project?: Project | null; description?: TaskDescription | null; }
export interface TaskCreate { projectId: string; taskId: string; taskName: string; estimatedHours: number; descriptionId: string; }
export interface Allocation { employeeId: string; projectId: string; taskId: string; employeeName?: string | null; projectName?: string | null; taskName?: string | null; allocationStartDate: string; allocationEndDate?: string | null; allocatedHours: number; totalAllocationHours?: number | null; employee?: Employee | null; taskItem?: TaskItem | null; }
export interface AllocationCreate { employeeId: string; projectId: string; taskId: string; allocationStartDate: string; allocationEndDate?: string | null; allocatedHours: number; }
export interface AutoAllocationCreate { projectId: string; taskId: string; startDate: string; endDate?: string | null; hoursPerDay: number; skillId?: string | null; }
export interface AllocationAvailabilityRequest { projectId?: string | null; employeeId?: string | null; skillId?: string | null; startDate: string; endDate?: string | null; requiredHoursPerDay?: number | null; onlyProjectEmployees?: boolean; }
export interface AllocationAvailability {
  employeeId: string;
  fullName: string;
  projectId?: string | null;
  isAssignedToProject: boolean;
  isProjectManager: boolean;
  workNormHoursPerDay: number;
  workingDays: number;
  capacityHours: number;
  existingAllocatedHours: number;
  availableHours: number;
  minimumDailyAvailableHours: number;
  isOnLeave: boolean;
  canTakeRequestedHours: boolean;
  status: string;
}
export interface AllocationSimulationRequest { employeeId?: string | null; projectId: string; taskId: string; startDate: string; endDate?: string | null; hoursPerDay: number; skillId?: string | null; }
export interface AllocationSimulation {
  projectId: string;
  taskId: string;
  taskName: string;
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  requestedTotalHours: number;
  currentTaskAllocatedHours: number;
  taskEstimatedHours: number;
  taskRemainingHoursAfterSimulation: number;
  canAllocate: boolean;
  reasons: string[];
  candidates: AllocationAvailability[];
}
export interface Timesheet { projectId: string; taskId: string; employeeId: string; workDate: string; workedHours: number; employee?: Employee | null; taskItem?: TaskItem | null; }
export interface TaskComment { taskCommentId: string; commentText: string; commentDate: string; projectId: string; taskId: string; employeeId: string; }
export interface EmployeeSkill { employeeId: string; skillId: string; acquiredDate?: string | null; employee?: Employee | null; skill?: Skill | null; }
export interface EmployeeSkillCreate { employeeId: string; skillId: string; acquiredDate?: string | null; }
export interface EmployeeDepartment { employeeId: string; departmentId: string; startDate: string; endDate?: string | null; employee?: Employee | null; department?: Department | null; }
export interface EmployeeDepartmentCreate { employeeId: string; departmentId: string; startDate: string; endDate?: string | null; }
export interface EmployeeLeave { employeeLeaveId: string; employeeId: string; employeeName: string; startDate: string; endDate: string; leaveType: string; reason?: string | null; replacementEmployeeId?: string | null; replacementEmployeeName?: string | null; }
export interface EmployeeLeaveCreate { employeeId: string; startDate: string; endDate: string; leaveType: string; reason?: string | null; replacementEmployeeId?: string | null; }
export interface ProjectSummary { projectId: string; projectName: string; tasksCount: number; estimatedHours: number; workedHours: number; progressPercent: number; }
