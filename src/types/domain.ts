export type UserRole = 'Admin' | 'Manager' | 'Employee';
export type Permission =
  | 'accounts.manage'
  | 'roles.manage'
  | 'employees.view.all'
  | 'employees.manage'
  | 'employees.manage.managed'
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
  | 'timesheets.approve'
  | 'notifications.view'
  | 'audit.view.all'
  | 'audit.view.managed'
  | 'tasks.status.manage'
  | 'tasks.status.manage.managed'
  | 'profile.view';

export interface Account { accountId: string; username: string; role: UserRole; employeeId?: string | null; employeeName?: string | null; }
export interface AccountCreate { accountId: string; username: string; password: string; role?: UserRole; }
export interface AccountUpdate { username: string; password?: string | null; role: UserRole; }
export interface WorkNorm { workNormId: string; workNormName: string; workHours: number; }
export interface Department { departmentId: string; departmentName: string; }
export interface Skill { skillId: string; skillName: string; skillLevel?: string | null; }
export interface LoginRequest { username: string; password: string; }
export interface LoginResponse { token?: string; accountId: string; username: string; role: UserRole; fullName: string; employeeId: string; permissions: Permission[]; expiresAt?: string; }
export interface UserAccess { accountId: string; username: string; employeeId: string; fullName: string; role: UserRole; permissions: Permission[]; managedProjectIds: string[]; canViewAllCompanyData: boolean; canManageRoles: boolean; canViewAvailability: boolean; }
export interface Employee { employeeId: string; firstName: string; lastName: string; email: string; phoneNumber: string; accountId: string; workNormId: string; account?: Account | null; workNorm?: WorkNorm | null; }
export interface EmployeeCreate { employeeId: string; lastName: string; firstName: string; email: string; phoneNumber: string; accountId: string; workNormId: string; }
export interface EmployeeRole { employeeId: string; fullName: string; username: string; role: UserRole; managedProjectIds: string[]; managedProjectNames: string[]; }
export interface EmployeeRoleUpdate { role: UserRole; managedProjectIds: string[]; }
export interface Project { projectId: string; projectName: string; }
export interface ProjectCreate { projectId: string; projectName: string; }
export interface TaskDescription { descriptionId: string; taskDescriptionText?: string | null; }
export interface TaskDescriptionCreate { descriptionId: string; taskDescriptionText: string; }
export type TaskStatus = 'Backlog' | 'Ready' | 'InProgress' | 'Blocked' | 'Delayed' | 'Completed' | 'Cancelled';
export type TimesheetStatus = 'Pending' | 'Approved' | 'Rejected';
export interface TaskItem { projectId: string; taskId: string; taskName: string; estimatedHours?: number | null; descriptionId?: string | null; requiredSkillId?: string | null; plannedStartDate?: string | null; plannedEndDate?: string | null; status: TaskStatus; workflowStatus: Exclude<TaskStatus, 'Delayed'>; approvedWorkedHours: number; remainingHours: number; project?: Project | null; description?: TaskDescription | null; requiredSkill?: Skill | null; }
export interface TaskCreate { projectId: string; taskId: string; taskName: string; estimatedHours: number; descriptionId: string; requiredSkillId?: string | null; plannedStartDate?: string | null; plannedEndDate?: string | null; }
export interface TaskDeletionResult { taskId: string; taskName: string; deletedAllocations: number; releasedEmployees: string[]; }
export interface Allocation { employeeId: string; projectId: string; taskId: string; employeeName?: string | null; projectName?: string | null; taskName?: string | null; requiredSkillId?: string | null; requiredSkillName?: string | null; requiredSkillLevel?: string | null; allocationStartDate: string; allocationEndDate?: string | null; allocatedHours: number; totalAllocationHours?: number | null; employee?: Employee | null; taskItem?: TaskItem | null; }
export interface AllocationCreate { employeeId: string; projectId: string; taskId: string; allocationStartDate: string; allocationEndDate?: string | null; allocatedHours: number; }
export interface AutoAllocationCreate { projectId: string; taskId: string; startDate: string; endDate?: string | null; hoursPerDay: number; skillId?: string | null; }
export interface AutoAllocationResult { allocations: Allocation[]; allocatedHours: number; remainingHours: number; status: string; }
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
  meetsSkillRequirement: boolean;
  requiredSkillId?: string | null;
  requiredSkillName?: string | null;
  requiredSkillLevel?: string | null;
  matchedSkillId?: string | null;
  matchedSkillName?: string | null;
  matchedSkillLevel?: string | null;
  canTakeRequestedHours: boolean;
  status: string;
}
export interface TaskPlanningCandidate extends AllocationAvailability { maxAssignableHours: number; }
export interface PlannedAllocation { employeeId: string; employeeName: string; hoursPerDay: number; totalHours: number; allocationStartDate: string; allocationEndDate: string; }
export interface TaskPlanningPreviewRequest { projectId: string; estimatedHours: number; requiredSkillId?: string | null; plannedStartDate: string; plannedEndDate: string; }
export interface TaskPlanningPreview {
  plannedStartDate: string;
  plannedEndDate: string;
  workingDays: number;
  estimatedHours: number;
  safeAvailableHours: number;
  remainingUncoveredHours: number;
  canFullyStaff: boolean;
  candidates: TaskPlanningCandidate[];
  automaticPlan: PlannedAllocation[];
}
export interface ManualTaskAllocation { employeeId: string; hoursPerDay: number; allocationStartDate?: string | null; allocationEndDate?: string | null; }
export interface CreatePlannedTaskRequest extends TaskPlanningPreviewRequest {
  taskName: string;
  descriptionText: string;
  allocationMode: 'Automatic' | 'Manual';
  manualAllocations: ManualTaskAllocation[];
}
export interface CreatePlannedTaskResponse { task: TaskItem; allocations: Allocation[]; allocatedHours: number; remainingHours: number; staffingStatus: string; }
export interface ResourcePlanningOverview {
  currentStartDate: string;
  currentEndDate: string;
  futureStartDate: string;
  futureEndDate: string;
  idleEmployees: AllocationAvailability[];
  underutilizedEmployees: AllocationAvailability[];
  becomingAvailableEmployees: AllocationAvailability[];
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
  requiredSkillId?: string | null;
  requiredSkillName?: string | null;
  requiredSkillLevel?: string | null;
  canAllocate: boolean;
  reasons: string[];
  candidates: AllocationAvailability[];
}
export interface TaskStaffing {
  projectId: string;
  projectName: string;
  taskId: string;
  taskName: string;
  estimatedHours: number;
  allocatedHours: number;
  remainingHours: number;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  allocatedPeople: number;
  requiredSkillId?: string | null;
  requiredSkillName?: string | null;
  requiredSkillLevel?: string | null;
  status: string;
  candidates: AllocationAvailability[];
}
export interface Timesheet { projectId: string; taskId: string; employeeId: string; workDate: string; workedHours: number; status: TimesheetStatus; submittedAt: string; reviewedAt?: string | null; reviewedByEmployeeId?: string | null; reviewComment?: string | null; employee?: Employee | null; taskItem?: TaskItem | null; }
export interface TimesheetReview { status: 'Approved' | 'Rejected'; comment?: string | null; }
export interface AuditLog { auditLogId: number; createdAt: string; actorEmployeeId?: string | null; actorName?: string | null; actorRole: UserRole; action: string; entityType: string; entityId: string; projectId?: string | null; summary: string; beforeJson?: string | null; afterJson?: string | null; }
export interface AppNotification { notificationId: string; type: 'StaffingDeficit' | 'OverAllocation' | 'TimesheetApproval' | 'TaskDelayed'; severity: 'Critical' | 'Warning' | 'Info'; title: string; message: string; projectId?: string | null; taskId?: string | null; employeeId?: string | null; relevantDate?: string | null; }
export interface TaskComment { taskCommentId: string; commentText: string; commentDate: string; projectId: string; taskId: string; employeeId: string; }
export interface EmployeeSkill { employeeId: string; skillId: string; acquiredDate?: string | null; employee?: Employee | null; skill?: Skill | null; }
export interface EmployeeSkillCreate { employeeId: string; skillId: string; acquiredDate?: string | null; }
export interface EmployeeDepartment { employeeId: string; departmentId: string; startDate: string; endDate?: string | null; employee?: Employee | null; department?: Department | null; }
export interface EmployeeDepartmentCreate { employeeId: string; departmentId: string; startDate: string; endDate?: string | null; }
export interface EmployeeLeave { employeeLeaveId: string; employeeId: string; employeeName: string; startDate: string; endDate: string; leaveType: string; reason?: string | null; replacementEmployeeId?: string | null; replacementEmployeeName?: string | null; }
export interface EmployeeLeaveCreate { employeeId: string; startDate: string; endDate: string; leaveType: string; reason?: string | null; replacementEmployeeId?: string | null; }
export interface EmployeeLeaveCreateResult { employeeLeaveId: string; impactedAllocations: number; coveredAllocations: number; }
export interface EmployeeLeaveImpact {
  projectId: string;
  projectName: string;
  taskId: string;
  taskName: string;
  allocationStartDate: string;
  allocationEndDate?: string | null;
  overlapStartDate: string;
  overlapEndDate: string;
  allocatedHours: number;
  requiredSkillId?: string | null;
  requiredSkillName?: string | null;
  requiredSkillLevel?: string | null;
  status: string;
  replacementCandidates: AllocationAvailability[];
}
export interface EmployeeLeavePlan {
  leave: EmployeeLeave;
  hasDelayRisk: boolean;
  recommendation: string;
  impacts: EmployeeLeaveImpact[];
}
export interface ProjectSummary { projectId: string; projectName: string; tasksCount: number; estimatedHours: number; workedHours: number; progressPercent: number; }
