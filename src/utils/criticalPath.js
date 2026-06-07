import { addDays, differenceInCalendarDays, max, min } from 'date-fns';
import { parseDate } from './dateUtils';

export const DEPENDENCY_TYPES = {
  FS: 'FS',
  SS: 'SS',
  FF: 'FF',
  SF: 'SF',
};

export const PROJECT_STATUS = {
  DRAFT: 'draft',
  PLANNING: 'planning',
  IN_PROGRESS: 'in-progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
  CANCELLED: 'cancelled',
};

export const PROJECT_STATUS_LABELS = {
  'draft': '草稿',
  'planning': '规划中',
  'in-progress': '执行中',
  'paused': '已暂停',
  'completed': '已完成',
  'archived': '已归档',
  'cancelled': '已取消',
};

export const PROJECT_STATUS_COLORS = {
  'draft': '#9ca3af',
  'planning': '#3b82f6',
  'in-progress': '#22c55e',
  'paused': '#eab308',
  'completed': '#6366f1',
  'archived': '#8b5cf6',
  'cancelled': '#ef4444',
};

export const PROJECT_STATUS_FLOW = {
  'draft': ['planning', 'cancelled'],
  'planning': ['draft', 'in-progress', 'cancelled'],
  'in-progress': ['paused', 'completed', 'cancelled'],
  'paused': ['in-progress', 'cancelled'],
  'completed': ['archived'],
  'archived': [],
  'cancelled': [],
};

export const TASK_STATUS = {
  NOT_STARTED: 'not-started',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  DELAYED: 'delayed',
  SEVERELY_DELAYED: 'severely-delayed',
  PAUSED: 'paused',
  OVERDUE_WARNING: 'overdue-warning',
};

export const TASK_STATUS_LABELS = {
  'not-started': '未开始',
  'in-progress': '进行中',
  'completed': '已完成',
  'delayed': '已延期',
  'severely-delayed': '严重延期',
  'paused': '已暂停',
  'overdue-warning': '超期预警',
};

export function detectCyclicDependencies(tasks, dependencies) {
  const visited = new Set();
  const recStack = new Set();
  const adjList = new Map();

  tasks.forEach((task) => adjList.set(task.id, []));
  dependencies.forEach((dep) => {
    if (adjList.has(dep.fromTaskId)) {
      adjList.get(dep.fromTaskId).push(dep.toTaskId);
    }
  });

  function dfs(nodeId) {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      if (dfs(task.id)) return true;
    }
  }

  return false;
}

export function calculateCriticalPath(tasks, dependencies) {
  if (tasks.length === 0) return [];

  const taskMap = new Map();
  tasks.forEach((task) => {
    taskMap.set(task.id, {
      ...task,
      startDate: parseDate(task.startDate),
      endDate: parseDate(task.endDate),
    });
  });

  const inDegree = new Map();
  const adjList = new Map();
  const reverseAdj = new Map();

  tasks.forEach((task) => {
    inDegree.set(task.id, 0);
    adjList.set(task.id, []);
    reverseAdj.set(task.id, []);
  });

  dependencies.forEach((dep) => {
    if (adjList.has(dep.fromTaskId) && adjList.has(dep.toTaskId)) {
      adjList.get(dep.fromTaskId).push({ to: dep.toTaskId, type: dep.type });
      reverseAdj.get(dep.toTaskId).push({ from: dep.fromTaskId, type: dep.type });
      inDegree.set(dep.toTaskId, (inDegree.get(dep.toTaskId) || 0) + 1);
    }
  });

  const earliestStart = new Map();
  const earliestFinish = new Map();
  const latestStart = new Map();
  const latestFinish = new Map();
  const duration = new Map();

  tasks.forEach((task) => {
    const dur = task.isMilestone ? 0 : Math.max(1, differenceInCalendarDays(parseDate(task.endDate), parseDate(task.startDate)) + 1);
    duration.set(task.id, dur);
    earliestStart.set(task.id, parseDate(task.startDate));
    earliestFinish.set(task.id, addDays(parseDate(task.startDate), dur));
  });

  const topoOrder = [];
  const queue = [];
  tasks.forEach((task) => {
    if (inDegree.get(task.id) === 0) queue.push(task.id);
  });

  while (queue.length > 0) {
    const nodeId = queue.shift();
    topoOrder.push(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const { to, type } of neighbors) {
      const es = earliestStart.get(nodeId);
      const ef = earliestFinish.get(nodeId);
      const durTo = duration.get(to);

      let newStart;
      if (type === DEPENDENCY_TYPES.FS) {
        newStart = ef;
      } else if (type === DEPENDENCY_TYPES.SS) {
        newStart = es;
      } else if (type === DEPENDENCY_TYPES.FF) {
        const newFinish = ef;
        newStart = addDays(newFinish, -durTo);
      } else if (type === DEPENDENCY_TYPES.SF) {
        const newFinish = es;
        newStart = addDays(newFinish, -durTo);
      }

      const currentStart = earliestStart.get(to);
      if (!currentStart || newStart > currentStart) {
        earliestStart.set(to, newStart);
        earliestFinish.set(to, addDays(newStart, durTo));
      }

      inDegree.set(to, inDegree.get(to) - 1);
      if (inDegree.get(to) === 0) {
        queue.push(to);
      }
    }
  }

  let projectEnd = earliestFinish.get(topoOrder[0]);
  topoOrder.forEach((id) => {
    const ef = earliestFinish.get(id);
    if (ef > projectEnd) projectEnd = ef;
  });

  tasks.forEach((task) => {
    latestFinish.set(task.id, projectEnd);
    latestStart.set(task.id, addDays(projectEnd, -duration.get(task.id)));
  });

  const reverseTopo = [...topoOrder].reverse();

  for (const nodeId of reverseTopo) {
    const predecessors = reverseAdj.get(nodeId) || [];
    for (const { from, type } of predecessors) {
      const ls = latestStart.get(nodeId);
      const lf = latestFinish.get(nodeId);
      const durFrom = duration.get(from);

      let newFinish;
      if (type === DEPENDENCY_TYPES.FS) {
        newFinish = ls;
      } else if (type === DEPENDENCY_TYPES.SS) {
        const newStart = ls;
        newFinish = addDays(newStart, durFrom);
      } else if (type === DEPENDENCY_TYPES.FF) {
        newFinish = lf;
      } else if (type === DEPENDENCY_TYPES.SF) {
        const newStart = lf;
        newFinish = addDays(newStart, durFrom);
      }

      const currentFinish = latestFinish.get(from);
      if (!currentFinish || newFinish < currentFinish) {
        latestFinish.set(from, newFinish);
        latestStart.set(from, addDays(newFinish, -durFrom));
      }
    }
  }

  const criticalPath = [];
  topoOrder.forEach((id) => {
    const es = earliestStart.get(id);
    const ls = latestStart.get(id);
    const slack = differenceInCalendarDays(ls, es);
    if (slack === 0 && !taskMap.get(id).isMilestone) {
      criticalPath.push(id);
    }
  });

  return criticalPath;
}

export function cascadeDateChanges(changedTaskId, tasks, dependencies) {
  const taskMap = new Map();
  tasks.forEach((t) => taskMap.set(t.id, { ...t, startDate: parseDate(t.startDate), endDate: parseDate(t.endDate) }));

  const changed = taskMap.get(changedTaskId);
  if (!changed) return tasks;

  const adjList = new Map();
  const inDegree = new Map();

  tasks.forEach((t) => {
    adjList.set(t.id, []);
    inDegree.set(t.id, 0);
  });

  dependencies.forEach((dep) => {
    if (adjList.has(dep.fromTaskId) && adjList.has(dep.toTaskId)) {
      adjList.get(dep.fromTaskId).push({ to: dep.toTaskId, type: dep.type });
      inDegree.set(dep.toTaskId, (inDegree.get(dep.toTaskId) || 0) + 1);
    }
  });

  const queue = [changedTaskId];
  const visited = new Set([changedTaskId]);

  while (queue.length > 0) {
    const fromId = queue.shift();
    const fromTask = taskMap.get(fromId);

    const neighbors = adjList.get(fromId) || [];
    for (const { to, type } of neighbors) {
      if (!taskMap.has(to)) continue;
      const toTask = taskMap.get(to);
      const dur = toTask.isMilestone ? 0 : differenceInCalendarDays(toTask.endDate, toTask.startDate) + 1;

      let newStart;
      if (type === DEPENDENCY_TYPES.FS) {
        newStart = addDays(fromTask.endDate, 1);
      } else if (type === DEPENDENCY_TYPES.SS) {
        newStart = fromTask.startDate;
      } else if (type === DEPENDENCY_TYPES.FF) {
        const newEnd = fromTask.endDate;
        newStart = addDays(newEnd, -(dur - 1));
      } else if (type === DEPENDENCY_TYPES.SF) {
        const newEnd = fromTask.startDate;
        newStart = addDays(newEnd, -(dur - 1));
      }

      if (newStart > toTask.startDate) {
        toTask.startDate = newStart;
        if (!toTask.isMilestone) {
          toTask.endDate = addDays(newStart, dur - 1);
        } else {
          toTask.endDate = newStart;
        }
        taskMap.set(to, toTask);

        if (!visited.has(to)) {
          visited.add(to);
          queue.push(to);
        }
      }
    }
  }

  return tasks.map((t) => {
    const updated = taskMap.get(t.id);
    return {
      ...t,
      startDate: updated.startDate.toISOString().split('T')[0],
      endDate: updated.endDate.toISOString().split('T')[0],
    };
  });
}

export function getTaskStatus(task) {
  if (task.isMilestone) {
    const today = new Date();
    const milestoneDate = parseDate(task.endDate);
    if (task.progress >= 100) return 'completed';
    if (milestoneDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return 'delayed';
    return 'in-progress';
  }

  if (task.progress >= 100) return 'completed';
  if (task.status === 'paused') return 'paused';

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = parseDate(task.startDate);
  const end = parseDate(task.endDate);

  const plannedDuration = task.plannedDuration
    ? task.plannedDuration
    : differenceInCalendarDays(end, start) + 1;

  let actualDuration;
  if (task.actualDuration !== undefined && task.actualDuration !== null) {
    actualDuration = task.actualDuration;
  } else {
    if (todayStart < start) {
      actualDuration = 0;
    } else if (todayStart > end) {
      actualDuration = differenceInCalendarDays(todayStart, start) + 1;
    } else {
      actualDuration = differenceInCalendarDays(todayStart, start) + 1;
    }
  }

  const durationRatio = plannedDuration > 0 ? actualDuration / plannedDuration : 0;

  if (task.progress > 0 && task.progress < 100) {
    if (end < todayStart) {
      if (durationRatio >= 2) return 'severely-delayed';
      if (durationRatio >= 1.5) return 'overdue-warning';
      return 'delayed';
    }
    return 'in-progress';
  }

  if (end < todayStart) {
    if (durationRatio >= 2) return 'severely-delayed';
    if (durationRatio >= 1.5) return 'overdue-warning';
    return 'delayed';
  }

  if (start <= today) return 'in-progress';

  return 'not-started';
}

export function canTransitionProjectStatus(fromStatus, toStatus) {
  const allowed = PROJECT_STATUS_FLOW[fromStatus] || [];
  return allowed.includes(toStatus);
}
