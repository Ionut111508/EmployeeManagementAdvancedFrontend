export type UserRole = 'Admin' | 'Manager' | 'Employee';

export interface Account { accountId: string; username: string; }
export interface WorkNorm { workNormId: string; workNormName: string; workHours: number; }
export interface Department { departmentId: string; departmentName: string; }
export interface Skill { skillId: string; skillName: string; skillLevel?: string | null; }

export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  accountId: string;
  workNormId: string;
  account?: Account | null;
  workNorm?: WorkNorm | null;
}

export interface Project { projectId: string; projectName: string; }
export interface TaskDescription { descriptionId: string; taskDescriptionText?: string | null; }

export interface TaskItem {
  projectId: string;
  taskId: string;
  taskName: string;
  estimatedHours?: number | null;
  descriptionId?: string | null;
  project?: Project | null;
  description?: TaskDescription | null;
}

export interface Allocation {
  employeeId: string;
  projectId: string;
  taskId: string;
  allocationStartDate: string;
  allocationEndDate?: string | null;
  allocatedHours: number;
  employee?: Employee | null;
  taskItem?: TaskItem | null;
}

export interface Timesheet {
  projectId: string;
  taskId: string;
  employeeId: string;
  workDate: string;
  workedHours: number;
  employee?: Employee | null;
  taskItem?: TaskItem | null;
}

export interface TaskComment {
  taskCommentId: string;
  commentText: string;
  commentDate: string;
  projectId: string;
  taskId: string;
  employeeId: string;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  tasksCount: number;
  estimatedHours: number;
  workedHours: number;
  progressPercent: number;
}
