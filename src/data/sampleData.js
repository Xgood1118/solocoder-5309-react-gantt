import { v4 as uuidv4 } from 'uuid';

function newId() {
  return uuidv4();
}

function createSampleProject() {
  const projectId = newId();
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

  const t1 = newId();
  const t2 = newId();
  const t3 = newId();
  const t4 = newId();
  const t5 = newId();
  const t6 = newId();
  const t7 = newId();
  const t8 = newId();
  const m1 = newId();
  const m2 = newId();

  const tasks = [
    {
      id: t1,
      name: '需求分析与设计',
      assignee: '张三',
      startDate: formatDate(startDate),
      endDate: formatDate(addDays(startDate, 4)),
      progress: 100,
      status: 'completed',
      isMilestone: false,
      parentId: null,
      description: '用户需求调研、产品设计、UI设计',
      order: 0,
      version: 1,
      plannedDuration: 5,
      actualDuration: 5,
      subtasks: [
        { id: newId(), name: '用户调研', done: true },
        { id: newId(), name: '产品原型', done: true },
        { id: newId(), name: 'UI设计稿', done: true },
      ],
    },
    {
      id: t2,
      name: '技术选型与架构设计',
      assignee: '李四',
      startDate: formatDate(addDays(startDate, 5)),
      endDate: formatDate(addDays(startDate, 9)),
      progress: 100,
      status: 'completed',
      isMilestone: false,
      parentId: null,
      description: '技术方案评审、架构设计',
      order: 1,
      version: 1,
      plannedDuration: 5,
      actualDuration: 6,
      subtasks: [
        { id: newId(), name: '框架选型', done: true },
        { id: newId(), name: '数据库设计', done: true },
      ],
    },
    {
      id: t3,
      name: '用户登录模块开发',
      assignee: '王五',
      startDate: formatDate(addDays(startDate, 10)),
      endDate: formatDate(addDays(startDate, 14)),
      progress: 70,
      status: 'in-progress',
      isMilestone: false,
      parentId: null,
      description: '登录注册、验证码、密码找回',
      order: 2,
      version: 1,
      plannedDuration: 5,
      actualDuration: 8,
      subtasks: [
        { id: newId(), name: '登录页面', done: true },
        { id: newId(), name: '注册页面', done: true },
        { id: newId(), name: '第三方登录', done: false },
      ],
    },
    {
      id: t4,
      name: '用户管理模块开发',
      assignee: '赵六',
      startDate: formatDate(addDays(startDate, 15)),
      endDate: formatDate(addDays(startDate, 24)),
      progress: 30,
      status: 'in-progress',
      isMilestone: false,
      parentId: null,
      description: '用户CRUD、角色权限',
      order: 3,
      version: 1,
      plannedDuration: 10,
      actualDuration: 22,
      subtasks: [
        { id: newId(), name: '用户列表', done: true },
        { id: newId(), name: '角色管理', done: false },
        { id: newId(), name: '权限配置', done: false },
      ],
    },
    {
      id: m1,
      name: '内测发布里程碑',
      assignee: '张三',
      startDate: formatDate(addDays(startDate, 25)),
      endDate: formatDate(addDays(startDate, 25)),
      progress: 0,
      status: 'not-started',
      isMilestone: true,
      parentId: null,
      description: '内部测试版本发布',
      order: 4,
      version: 1,
      plannedDuration: 1,
      actualDuration: 1,
      subtasks: [],
    },
    {
      id: t5,
      name: '订单模块开发',
      assignee: '王五',
      startDate: formatDate(addDays(startDate, 26)),
      endDate: formatDate(addDays(startDate, 35)),
      progress: 0,
      status: 'not-started',
      isMilestone: false,
      parentId: null,
      description: '订单创建、支付、退款',
      order: 5,
      version: 1,
      plannedDuration: 10,
      actualDuration: 10,
      subtasks: [
        { id: newId(), name: '订单列表', done: false },
        { id: newId(), name: '支付接入', done: false },
        { id: newId(), name: '退款流程', done: false },
      ],
    },
    {
      id: t6,
      name: '数据分析模块开发',
      assignee: '李四',
      startDate: formatDate(addDays(startDate, 26)),
      endDate: formatDate(addDays(startDate, 40)),
      progress: 0,
      status: 'not-started',
      isMilestone: false,
      parentId: null,
      description: '数据看板、报表导出',
      order: 6,
      version: 1,
      plannedDuration: 15,
      actualDuration: 15,
      subtasks: [
        { id: newId(), name: '数据看板', done: false },
        { id: newId(), name: '报表导出', done: false },
      ],
    },
    {
      id: t7,
      name: '集成测试与修复',
      assignee: '赵六',
      startDate: formatDate(addDays(startDate, 36)),
      endDate: formatDate(addDays(startDate, 45)),
      progress: 0,
      status: 'not-started',
      isMilestone: false,
      parentId: null,
      description: '功能测试、性能测试、Bug修复',
      order: 7,
      version: 1,
      plannedDuration: 10,
      actualDuration: 10,
      subtasks: [
        { id: newId(), name: '功能测试', done: false },
        { id: newId(), name: '性能测试', done: false },
        { id: newId(), name: 'Bug修复', done: false },
      ],
    },
    {
      id: m2,
      name: '正式上线里程碑',
      assignee: '张三',
      startDate: formatDate(addDays(startDate, 46)),
      endDate: formatDate(addDays(startDate, 46)),
      progress: 0,
      status: 'not-started',
      isMilestone: true,
      parentId: null,
      description: '生产环境正式上线',
      order: 8,
      version: 1,
      plannedDuration: 1,
      actualDuration: 1,
      subtasks: [],
    },
    {
      id: t8,
      name: '上线后运维',
      assignee: '王五',
      startDate: formatDate(addDays(startDate, 47)),
      endDate: formatDate(addDays(startDate, 53)),
      progress: 0,
      status: 'paused',
      isMilestone: false,
      parentId: null,
      description: '上线后一周运维保障',
      order: 9,
      version: 1,
      plannedDuration: 7,
      actualDuration: 7,
      subtasks: [
        { id: newId(), name: '监控告警', done: false },
        { id: newId(), name: '问题响应', done: false },
      ],
    },
  ];

  const dependencies = [
    { id: newId(), fromTaskId: t1, toTaskId: t2, type: 'FS' },
    { id: newId(), fromTaskId: t2, toTaskId: t3, type: 'FS' },
    { id: newId(), fromTaskId: t3, toTaskId: t4, type: 'FS' },
    { id: newId(), fromTaskId: t4, toTaskId: m1, type: 'FS' },
    { id: newId(), fromTaskId: m1, toTaskId: t5, type: 'FS' },
    { id: newId(), fromTaskId: m1, toTaskId: t6, type: 'SS' },
    { id: newId(), fromTaskId: t5, toTaskId: t7, type: 'FS' },
    { id: newId(), fromTaskId: t6, toTaskId: t7, type: 'FF' },
    { id: newId(), fromTaskId: t7, toTaskId: m2, type: 'FS' },
    { id: newId(), fromTaskId: m2, toTaskId: t8, type: 'FS' },
  ];

  return {
    id: projectId,
    name: '研发项目 V1.0',
    description: '6个月研发项目甘特图示例',
    status: 'in-progress',
    startDate: formatDate(startDate),
    endDate: formatDate(addDays(startDate, 53)),
    tasks,
    dependencies,
    baseline: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewStartDate: formatDate(startDate),
    viewEndDate: formatDate(addDays(startDate, 60)),
  };
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export const sampleProject = createSampleProject();

export function createEmptyProject(name = '新项目') {
  const now = new Date();
  return {
    id: newId(),
    name,
    description: '',
    status: 'draft',
    startDate: formatDate(now),
    endDate: formatDate(addDays(now, 30)),
    tasks: [],
    dependencies: [],
    baseline: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewStartDate: formatDate(now),
    viewEndDate: formatDate(addDays(now, 60)),
  };
}

export { newId };
