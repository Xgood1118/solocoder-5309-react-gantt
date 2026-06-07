export const QUOTA_FREE = {
  maxTasks: 50,
  maxDependencies: 20,
  planName: '免费版',
};

export const QUOTA_PRO = {
  maxTasks: Infinity,
  maxDependencies: Infinity,
  planName: '专业版',
};

export const PLANS = {
  FREE: 'free',
  PRO: 'pro',
};

export const PLAN_LABELS = {
  'free': '免费版',
  'pro': '专业版',
};

export const ROLES = {
  ADMIN: 'admin',
  PM: 'pm',
  DEVELOPER: 'developer',
  TESTER: 'tester',
  VIEWER: 'viewer',
  CLIENT: 'client',
};

export const ROLE_LABELS = {
  'admin': '管理员',
  'pm': '项目经理',
  'developer': '开发成员',
  'tester': '测试成员',
  'viewer': '只读访客',
  'client': '客户',
};

export const PERMISSIONS = {
  EDIT_PROJECT: 'edit_project',
  EDIT_TASK: 'edit_task',
  EDIT_TASK_DATE: 'edit_task_date',
  EDIT_TASK_PROGRESS: 'edit_task_progress',
  ADD_TASK: 'add_task',
  DELETE_TASK: 'delete_task',
  ADD_DEPENDENCY: 'add_dependency',
  DELETE_DEPENDENCY: 'delete_dependency',
  EDIT_BASELINE: 'edit_baseline',
  VIEW_DETAILS: 'view_details',
  VIEW_FINANCE: 'view_finance',
  EXPORT: 'export',
  IMPORT: 'import',
  MANAGE_PROJECTS: 'manage_projects',
  COMMENT: 'comment',
};

const rolePermissionMatrix = {
  [ROLES.ADMIN]: {
    [PERMISSIONS.EDIT_PROJECT]: true,
    [PERMISSIONS.EDIT_TASK]: true,
    [PERMISSIONS.EDIT_TASK_DATE]: true,
    [PERMISSIONS.EDIT_TASK_PROGRESS]: true,
    [PERMISSIONS.ADD_TASK]: true,
    [PERMISSIONS.DELETE_TASK]: true,
    [PERMISSIONS.ADD_DEPENDENCY]: true,
    [PERMISSIONS.DELETE_DEPENDENCY]: true,
    [PERMISSIONS.EDIT_BASELINE]: true,
    [PERMISSIONS.VIEW_DETAILS]: true,
    [PERMISSIONS.VIEW_FINANCE]: true,
    [PERMISSIONS.EXPORT]: true,
    [PERMISSIONS.IMPORT]: true,
    [PERMISSIONS.MANAGE_PROJECTS]: true,
    [PERMISSIONS.COMMENT]: true,
  },
  [ROLES.PM]: {
    [PERMISSIONS.EDIT_PROJECT]: true,
    [PERMISSIONS.EDIT_TASK]: true,
    [PERMISSIONS.EDIT_TASK_DATE]: true,
    [PERMISSIONS.EDIT_TASK_PROGRESS]: true,
    [PERMISSIONS.ADD_TASK]: true,
    [PERMISSIONS.DELETE_TASK]: true,
    [PERMISSIONS.ADD_DEPENDENCY]: true,
    [PERMISSIONS.DELETE_DEPENDENCY]: true,
    [PERMISSIONS.EDIT_BASELINE]: true,
    [PERMISSIONS.VIEW_DETAILS]: true,
    [PERMISSIONS.VIEW_FINANCE]: false,
    [PERMISSIONS.EXPORT]: true,
    [PERMISSIONS.IMPORT]: true,
    [PERMISSIONS.MANAGE_PROJECTS]: true,
    [PERMISSIONS.COMMENT]: true,
  },
  [ROLES.DEVELOPER]: {
    [PERMISSIONS.EDIT_PROJECT]: false,
    [PERMISSIONS.EDIT_TASK]: false,
    [PERMISSIONS.EDIT_TASK_DATE]: false,
    [PERMISSIONS.EDIT_TASK_PROGRESS]: true,
    [PERMISSIONS.ADD_TASK]: false,
    [PERMISSIONS.DELETE_TASK]: false,
    [PERMISSIONS.ADD_DEPENDENCY]: false,
    [PERMISSIONS.DELETE_DEPENDENCY]: false,
    [PERMISSIONS.EDIT_BASELINE]: false,
    [PERMISSIONS.VIEW_DETAILS]: true,
    [PERMISSIONS.VIEW_FINANCE]: false,
    [PERMISSIONS.EXPORT]: false,
    [PERMISSIONS.IMPORT]: false,
    [PERMISSIONS.MANAGE_PROJECTS]: false,
    [PERMISSIONS.COMMENT]: true,
  },
  [ROLES.TESTER]: {
    [PERMISSIONS.EDIT_PROJECT]: false,
    [PERMISSIONS.EDIT_TASK]: false,
    [PERMISSIONS.EDIT_TASK_DATE]: false,
    [PERMISSIONS.EDIT_TASK_PROGRESS]: false,
    [PERMISSIONS.ADD_TASK]: false,
    [PERMISSIONS.DELETE_TASK]: false,
    [PERMISSIONS.ADD_DEPENDENCY]: false,
    [PERMISSIONS.DELETE_DEPENDENCY]: false,
    [PERMISSIONS.EDIT_BASELINE]: false,
    [PERMISSIONS.VIEW_DETAILS]: true,
    [PERMISSIONS.VIEW_FINANCE]: false,
    [PERMISSIONS.EXPORT]: false,
    [PERMISSIONS.IMPORT]: false,
    [PERMISSIONS.MANAGE_PROJECTS]: false,
    [PERMISSIONS.COMMENT]: true,
  },
  [ROLES.VIEWER]: {
    [PERMISSIONS.EDIT_PROJECT]: false,
    [PERMISSIONS.EDIT_TASK]: false,
    [PERMISSIONS.EDIT_TASK_DATE]: false,
    [PERMISSIONS.EDIT_TASK_PROGRESS]: false,
    [PERMISSIONS.ADD_TASK]: false,
    [PERMISSIONS.DELETE_TASK]: false,
    [PERMISSIONS.ADD_DEPENDENCY]: false,
    [PERMISSIONS.DELETE_DEPENDENCY]: false,
    [PERMISSIONS.EDIT_BASELINE]: false,
    [PERMISSIONS.VIEW_DETAILS]: true,
    [PERMISSIONS.VIEW_FINANCE]: false,
    [PERMISSIONS.EXPORT]: true,
    [PERMISSIONS.IMPORT]: false,
    [PERMISSIONS.MANAGE_PROJECTS]: false,
    [PERMISSIONS.COMMENT]: false,
  },
  [ROLES.CLIENT]: {
    [PERMISSIONS.EDIT_PROJECT]: false,
    [PERMISSIONS.EDIT_TASK]: false,
    [PERMISSIONS.EDIT_TASK_DATE]: false,
    [PERMISSIONS.EDIT_TASK_PROGRESS]: false,
    [PERMISSIONS.ADD_TASK]: false,
    [PERMISSIONS.DELETE_TASK]: false,
    [PERMISSIONS.ADD_DEPENDENCY]: false,
    [PERMISSIONS.DELETE_DEPENDENCY]: false,
    [PERMISSIONS.EDIT_BASELINE]: false,
    [PERMISSIONS.VIEW_DETAILS]: false,
    [PERMISSIONS.VIEW_FINANCE]: false,
    [PERMISSIONS.EXPORT]: false,
    [PERMISSIONS.IMPORT]: false,
    [PERMISSIONS.MANAGE_PROJECTS]: false,
    [PERMISSIONS.COMMENT]: false,
  },
};

export function hasPermission(role, permission) {
  const rolePerms = rolePermissionMatrix[role];
  if (!rolePerms) return false;
  return rolePerms[permission] === true;
}

export function canAddTask(taskCount, planType = 'free') {
  const quota = planType === 'free' ? QUOTA_FREE : QUOTA_PRO;
  return taskCount < quota.maxTasks;
}

export function canAddDependency(depCount, planType = 'free') {
  const quota = planType === 'free' ? QUOTA_FREE : QUOTA_PRO;
  return depCount < quota.maxDependencies;
}

export function getQuotaInfo(planType = 'free') {
  return planType === 'free' ? QUOTA_FREE : QUOTA_PRO;
}

export function checkQuotaWarnings(tasks, dependencies, planType = 'free') {
  const warnings = [];
  const quota = getQuotaInfo(planType);

  if (tasks.length >= quota.maxTasks * 0.8 && tasks.length < quota.maxTasks) {
    warnings.push({
      type: 'task-warning',
      message: `任务数已达 ${tasks.length}/${quota.maxTasks}，接近上限`,
    });
  }
  if (tasks.length >= quota.maxTasks) {
    warnings.push({
      type: 'task-error',
      message: `任务数已达上限 ${quota.maxTasks}，请升级专业版`,
    });
  }

  if (dependencies.length >= quota.maxDependencies * 0.8 && dependencies.length < quota.maxDependencies) {
    warnings.push({
      type: 'dep-warning',
      message: `依赖关系已达 ${dependencies.length}/${quota.maxDependencies}，接近上限`,
    });
  }
  if (dependencies.length >= quota.maxDependencies) {
    warnings.push({
      type: 'dep-error',
      message: `依赖关系已达上限 ${quota.maxDependencies}，请升级专业版`,
    });
  }

  return warnings;
}
