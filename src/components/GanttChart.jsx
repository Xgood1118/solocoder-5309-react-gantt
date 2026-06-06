import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  isSameDay,
  min,
  max,
  parseISO,
  startOfDay,
} from 'date-fns';
import html2canvas from 'html2canvas';
import { v4 as uuidv4 } from 'uuid';
import TaskBar from './TaskBar';
import DependencyLines from './DependencyLines';
import TimelineHeader from './TimelineHeader';
import TaskEditModal from './TaskEditModal';
import {
  VIEW_MODES,
  getCellWidth,
  generateTimeRange,
  getTaskPosition,
  dateFromPixelOffset,
  snapToDay,
  getTodayPosition,
  parseDate,
  formatDate,
  calculateDuration,
  LEFT_PANEL_WIDTH,
  HEADER_HEIGHT,
  ROW_HEIGHT,
  TASK_HEIGHT,
} from '../utils/dateUtils';
import {
  calculateCriticalPath,
  detectCyclicDependencies,
  cascadeDateChanges,
  DEPENDENCY_TYPES,
  getTaskStatus,
} from '../utils/criticalPath';
import { exportProjectToJSON, importProjectFromJSON } from '../utils/storage';

export default function GanttChart({
  project,
  onProjectChange,
}) {
  const [viewMode, setViewMode] = useState(VIEW_MODES.DAY);
  const [viewStart, setViewStart] = useState(() => parseDate(project.viewStartDate || project.startDate));
  const [viewEnd, setViewEnd] = useState(() => parseDate(project.viewEndDate || project.endDate));
  const [tasks, setTasks] = useState(project.tasks || []);
  const [dependencies, setDependencies] = useState(project.dependencies || []);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [groupByParent, setGroupByParent] = useState(false);
  const [collapsedParents, setCollapsedParents] = useState(new Set());

  const [isDragging, setIsDragging] = useState(false);
  const [dragTaskId, setDragTaskId] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragType, setDragType] = useState('move');
  const [dragOriginalStart, setDragOriginalStart] = useState(null);
  const [dragOriginalEnd, setDragOriginalEnd] = useState(null);

  const [isCreatingDependency, setIsCreatingDependency] = useState(false);
  const [depFromTaskId, setDepFromTaskId] = useState(null);
  const [depType, setDepType] = useState(DEPENDENCY_TYPES.FS);

  const ganttRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const criticalPath = useMemo(
    () => calculateCriticalPath(tasks, dependencies),
    [tasks, dependencies]
  );

  const assignees = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => t.assignee && set.add(t.assignee));
    return Array.from(set).sort();
  }, [tasks]);

  const filteredAndGroupedTasks = useMemo(() => {
    let result = [...tasks];

    if (filterAssignee) {
      result = result.filter((t) => t.assignee === filterAssignee);
    }
    if (filterStatus) {
      result = result.filter((t) => getTaskStatus(t) === filterStatus);
    }

    if (groupByParent) {
      const parentTasks = result.filter((t) => !t.parentId).sort((a, b) => a.order - b.order);
      const childTasks = result.filter((t) => t.parentId);
      const ordered = [];

      parentTasks.forEach((parent) => {
        ordered.push(parent);
        if (!collapsedParents.has(parent.id)) {
          const children = childTasks
            .filter((c) => c.parentId === parent.id)
            .sort((a, b) => a.order - b.order);
          ordered.push(...children);
        }
      });

      const orphans = childTasks.filter(
        (c) => !parentTasks.find((p) => p.id === c.parentId)
      );
      ordered.push(...orphans.sort((a, b) => a.order - b.order));

      result = ordered;
    } else {
      result.sort((a, b) => a.order - b.order);
    }

    return result;
  }, [tasks, filterAssignee, filterStatus, groupByParent, collapsedParents]);

  const taskRowIndex = useMemo(() => {
    const map = {};
    filteredAndGroupedTasks.forEach((task, index) => {
      map[task.id] = index;
    });
    return map;
  }, [filteredAndGroupedTasks]);

  const taskPositions = useMemo(() => {
    const positions = {};
    filteredAndGroupedTasks.forEach((task) => {
      const pos = getTaskPosition(
        parseDate(task.startDate),
        parseDate(task.endDate),
        viewStart,
        viewMode
      );
      positions[task.id] = pos;
    });
    return positions;
  }, [filteredAndGroupedTasks, viewStart, viewMode]);

  const timeCells = useMemo(
    () => generateTimeRange(viewStart, viewEnd, viewMode),
    [viewStart, viewEnd, viewMode]
  );

  const timelineWidth = timeCells.length * getCellWidth(viewMode);

  useEffect(() => {
    if (onProjectChange) {
      onProjectChange({
        ...project,
        tasks,
        dependencies,
        viewStartDate: formatDate(viewStart),
        viewEndDate: formatDate(viewEnd),
      });
    }
  }, [tasks, dependencies, viewStart, viewEnd]);

  const handleTaskDragStart = (e, task, type = 'move') => {
    e.preventDefault();
    setIsDragging(true);
    setDragTaskId(task.id);
    setDragType(type);
    setDragStartX(e.clientX);
    setDragOriginalStart(parseDate(task.startDate));
    setDragOriginalEnd(parseDate(task.endDate));

    const handleMouseMove = (moveEvent) => {
      if (!dragTaskId || !dragOriginalStart || !dragOriginalEnd) return;

      const deltaX = moveEvent.clientX - dragStartX;
      const cellWidth = getCellWidth(viewMode);
      const daysDelta = Math.round(deltaX / (cellWidth / (viewMode === VIEW_MODES.DAY ? 1 : viewMode === VIEW_MODES.WEEK ? 7 : 30)));

      setTasks((prevTasks) =>
        prevTasks.map((t) => {
          if (t.id !== dragTaskId) return t;

          let newStart = dragOriginalStart;
          let newEnd = dragOriginalEnd;

          if (dragType === 'move') {
            newStart = addDays(dragOriginalStart, daysDelta);
            newEnd = addDays(dragOriginalEnd, daysDelta);
          } else if (dragType === 'left') {
            newStart = addDays(dragOriginalStart, daysDelta);
            if (differenceInCalendarDays(newEnd, newStart) < 0) {
              newStart = newEnd;
            }
          } else if (dragType === 'right') {
            newEnd = addDays(dragOriginalEnd, daysDelta);
            if (differenceInCalendarDays(newEnd, newStart) < 0) {
              newEnd = newStart;
            }
          }

          if (t.isMilestone) {
            newEnd = newStart;
          }

          return {
            ...t,
            startDate: formatDate(snapToDay(newStart)),
            endDate: formatDate(snapToDay(newEnd)),
          };
        })
      );
    };

    const handleMouseUp = () => {
      if (dragTaskId && (dragType === 'move' || dragType === 'left' || dragType === 'right')) {
        setTasks((prevTasks) => {
          const updated = cascadeDateChanges(dragTaskId, prevTasks, dependencies);
          return updated;
        });
      }

      setIsDragging(false);
      setDragTaskId(null);
      setDragType('move');
      setDragStartX(0);
      setDragOriginalStart(null);
      setDragOriginalEnd(null);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTaskDoubleClick = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (updatedTask) => {
    setTasks((prev) => {
      let newTasks;
      if (prev.find((t) => t.id === updatedTask.id)) {
        newTasks = prev.map((t) => (t.id === updatedTask.id ? { ...updatedTask, version: (t.version || 1) + 1 } : t));
      } else {
        newTasks = [...prev, { ...updatedTask, order: prev.length }];
      }
      return cascadeDateChanges(updatedTask.id, newTasks, dependencies);
    });
  };

  const handleDeleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setDependencies((prev) => prev.filter((d) => d.fromTaskId !== taskId && d.toTaskId !== taskId));
  };

  const handleAddTask = () => {
    const newTask = {
      id: uuidv4(),
      name: '新任务',
      assignee: '',
      startDate: formatDate(new Date()),
      endDate: formatDate(addDays(new Date(), 3)),
      progress: 0,
      status: 'not-started',
      isMilestone: false,
      parentId: null,
      description: '',
      order: tasks.length,
      version: 1,
      subtasks: [],
      isNew: true,
    };
    setEditingTask(newTask);
    setIsModalOpen(true);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    scrollContainerRef.current?.scrollTo({ left: 0, top: scrollTop });
  };

  const handleScroll = (e) => {
    setScrollLeft(e.target.scrollLeft);
    setScrollTop(e.target.scrollTop);
  };

  const handleZoomToRange = () => {
    const startStr = prompt('请输入开始日期 (YYYY-MM-DD):', formatDate(viewStart));
    if (!startStr) return;
    const endStr = prompt('请输入结束日期 (YYYY-MM-DD):', formatDate(viewEnd));
    if (!endStr) return;

    const start = parseISO(startStr);
    const end = parseISO(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert('日期格式不正确');
      return;
    }
    if (start > end) {
      alert('开始日期不能晚于结束日期');
      return;
    }

    setViewStart(start);
    setViewEnd(end);
  };

  const handleToggleParent = (parentId) => {
    setCollapsedParents((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  const handleExportPNG = async () => {
    if (!ganttRef.current) return;
    try {
      const canvas = await html2canvas(ganttRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `${project.name || 'gantt'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export PNG failed:', err);
      alert('导出PNG失败');
    }
  };

  const handleExportJSON = () => {
    const projectData = {
      ...project,
      tasks,
      dependencies,
    };
    exportProjectToJSON(projectData);
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importProjectFromJSON(file);
      if (imported.tasks) setTasks(imported.tasks);
      if (imported.dependencies) setDependencies(imported.dependencies);
      if (imported.startDate) setViewStart(parseDate(imported.startDate));
      if (imported.endDate) setViewEnd(parseDate(imported.endDate));
      alert('导入成功');
    } catch (err) {
      alert('导入失败: ' + err.message);
    }
    e.target.value = '';
  };

  const handleAddDependency = () => {
    if (!selectedTaskId) {
      alert('请先选择一个任务作为源任务');
      return;
    }
    setIsCreatingDependency(true);
    setDepFromTaskId(selectedTaskId);
  };

  const handleTaskClick = (task) => {
    if (isCreatingDependency && depFromTaskId && depFromTaskId !== task.id) {
      const newDep = {
        id: uuidv4(),
        fromTaskId: depFromTaskId,
        toTaskId: task.id,
        type: depType,
      };

      const testDeps = [...dependencies, newDep];
      if (detectCyclicDependencies(tasks, testDeps)) {
        alert('存在循环依赖无法保存');
        setIsCreatingDependency(false);
        setDepFromTaskId(null);
        return;
      }

      setDependencies(testDeps);
      setIsCreatingDependency(false);
      setDepFromTaskId(null);

      setTasks((prevTasks) => cascadeDateChanges(task.id, prevTasks, testDeps));
    } else {
      setSelectedTaskId(task.id);
    }
  };

  const handleRemoveDependency = (depId) => {
    setDependencies((prev) => prev.filter((d) => d.id !== depId));
  };

  const todayLeft = getTodayPosition(viewStart, viewMode);

  const statusLabels = {
    'not-started': '未开始',
    'in-progress': '进行中',
    'completed': '已完成',
    'delayed': '已延期',
    'paused': '已暂停',
  };

  const statusColors = {
    'not-started': '#9ca3af',
    'in-progress': '#3b82f6',
    'completed': '#22c55e',
    'delayed': '#ef4444',
    'paused': '#eab308',
  };

  return (
    <div className="gantt-chart" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        className="gantt-toolbar"
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 4, backgroundColor: 'white', borderRadius: 6, border: '1px solid #d1d5db', padding: 2 }}>
          {Object.values(VIEW_MODES).map((mode) => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode)}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: 4,
                backgroundColor: viewMode === mode ? '#3b82f6' : 'transparent',
                color: viewMode === mode ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: viewMode === mode ? 500 : 400,
              }}
            >
              {mode === VIEW_MODES.DAY ? '日' : mode === VIEW_MODES.WEEK ? '周' : mode === VIEW_MODES.MONTH ? '月' : '年'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>负责人:</span>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
          >
            <option value="">全部</option>
            {assignees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>状态:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
          >
            <option value="">全部</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={groupByParent}
            onChange={(e) => setGroupByParent(e.target.checked)}
          />
          按父任务分组
        </label>

        <button
          onClick={handleZoomToRange}
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: 13,
            color: '#374151',
          }}
        >
          缩放至日期范围
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleAddTask}
          style={{
            padding: '6px 14px',
            border: 'none',
            borderRadius: 6,
            backgroundColor: '#22c55e',
            color: 'white',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          + 添加任务
        </button>

        <button
          onClick={handleAddDependency}
          disabled={!selectedTaskId || isCreatingDependency}
          style={{
            padding: '6px 14px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            backgroundColor: 'white',
            color: '#374151',
            cursor: selectedTaskId && !isCreatingDependency ? 'pointer' : 'not-allowed',
            fontSize: 13,
            opacity: selectedTaskId && !isCreatingDependency ? 1 : 0.5,
          }}
        >
          {isCreatingDependency ? '选择目标任务...' : '添加依赖'}
        </button>

        {isCreatingDependency && (
          <select
            value={depType}
            onChange={(e) => setDepType(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
          >
            <option value={DEPENDENCY_TYPES.FS}>FS (完成-开始)</option>
            <option value={DEPENDENCY_TYPES.SS}>SS (开始-开始)</option>
            <option value={DEPENDENCY_TYPES.FF}>FF (完成-完成)</option>
            <option value={DEPENDENCY_TYPES.SF}>SF (开始-完成)</option>
          </select>
        )}

        <button
          onClick={handleExportPNG}
          style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer', fontSize: 13 }}
        >
          导出PNG
        </button>

        <button
          onClick={handleExportJSON}
          style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, backgroundColor: 'white', cursor: 'pointer', fontSize: 13 }}
        >
          导出JSON
        </button>

        <label
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          导入JSON
          <input
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div
        ref={ganttRef}
        className="gantt-container"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
      >
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div
            className="gantt-left-panel"
            style={{
              width: LEFT_PANEL_WIDTH,
              flexShrink: 0,
              borderRight: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                height: HEADER_HEIGHT,
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                fontWeight: 600,
                fontSize: 14,
                backgroundColor: '#f9fafb',
                color: '#374151',
              }}
            >
              任务列表
            </div>
            <div
              style={{ flex: 1, overflow: 'hidden' }}
              onScroll={(e) => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTop = e.target.scrollTop;
                }
              }}
            >
              <div style={{ marginTop: -scrollTop }}>
                {filteredAndGroupedTasks.map((task, index) => {
                  const isParent = groupByParent && !task.parentId && tasks.some((t) => t.parentId === task.id);
                  const isChild = groupByParent && task.parentId;
                  const isCollapsed = collapsedParents.has(task.id);
                  const status = getTaskStatus(task);

                  return (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      style={{
                        height: ROW_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        padding: `0 ${isChild ? 28 : 12}px`,
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        backgroundColor: selectedTaskId === task.id ? '#eff6ff' : 'white',
                        transition: 'background-color 0.15s',
                        gap: 8,
                      }}
                      onMouseEnter={(e) => {
                        if (selectedTaskId !== task.id) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedTaskId !== task.id) {
                          e.currentTarget.style.backgroundColor = 'white';
                        }
                      }}
                    >
                      {isParent && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleParent(task.id);
                          }}
                          style={{
                            width: 16,
                            height: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            color: '#6b7280',
                            userSelect: 'none',
                          }}
                        >
                          {isCollapsed ? '▶' : '▼'}
                        </span>
                      )}
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: task.isMilestone ? 0 : 2,
                          backgroundColor: statusColors[status],
                          transform: task.isMilestone ? 'rotate(45deg)' : 'none',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          color: '#374151',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                        title={task.name}
                      >
                        {task.name}
                      </span>
                      {task.assignee && (
                        <span
                          style={{
                            fontSize: 11,
                            color: '#9ca3af',
                            flexShrink: 0,
                          }}
                        >
                          {task.assignee}
                        </span>
                      )}
                    </div>
                  );
                })}
                {filteredAndGroupedTasks.length === 0 && (
                  <div
                    style={{
                      padding: 40,
                      textAlign: 'center',
                      color: '#9ca3af',
                      fontSize: 13,
                    }}
                  >
                    暂无任务，点击"添加任务"开始
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="gantt-scroll-container"
            style={{ flex: 1, overflow: 'auto' }}
            onScroll={handleScroll}
          >
            <div
              className="gantt-content"
              style={{
                position: 'relative',
                width: timelineWidth,
                minHeight: '100%',
              }}
            >
              <TimelineHeader
                viewMode={viewMode}
                timeCells={timeCells}
                viewStart={viewStart}
                headerHeight={HEADER_HEIGHT}
                leftPanelWidth={0}
              />

              <div
                style={{
                  position: 'relative',
                  height: HEADER_HEIGHT + filteredAndGroupedTasks.length * ROW_HEIGHT,
                  minHeight: '100%',
                }}
              >
                {filteredAndGroupedTasks.map((task, index) => (
                  <div
                    key={`row-${task.id}`}
                    style={{
                      position: 'absolute',
                      top: HEADER_HEIGHT + index * ROW_HEIGHT,
                      left: 0,
                      width: '100%',
                      height: ROW_HEIGHT,
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                    }}
                  />
                ))}

                <div
                  style={{
                    position: 'absolute',
                    top: HEADER_HEIGHT,
                    left: todayLeft,
                    width: 2,
                    height: filteredAndGroupedTasks.length * ROW_HEIGHT,
                    backgroundColor: '#dc2626',
                    zIndex: 15,
                    pointerEvents: 'none',
                  }}
                />

                <DependencyLines
                  dependencies={dependencies.filter(
                    (d) => taskRowIndex[d.fromTaskId] !== undefined && taskRowIndex[d.toTaskId] !== undefined
                  )}
                  taskPositions={taskPositions}
                  taskRows={taskRowIndex}
                  rowHeight={ROW_HEIGHT}
                  taskHeight={TASK_HEIGHT}
                  headerHeight={HEADER_HEIGHT}
                  totalHeight={HEADER_HEIGHT + filteredAndGroupedTasks.length * ROW_HEIGHT}
                />

                {filteredAndGroupedTasks.map((task) => {
                  const pos = taskPositions[task.id];
                  const rowIndex = taskRowIndex[task.id];
                  if (!pos || rowIndex === undefined) return null;

                  return (
                    <div key={task.id} style={{ position: 'absolute' }}>
                      <TaskBar
                        task={task}
                        left={pos.left}
                        width={pos.width}
                        top={HEADER_HEIGHT + rowIndex * ROW_HEIGHT}
                        isCritical={criticalPath.includes(task.id)}
                        onMouseDown={(e) => handleTaskDragStart(e, task, 'move')}
                        onDoubleClick={handleTaskDoubleClick}
                        onResizeStart={(e, t, side) => handleTaskDragStart(e, t, side)}
                        isDragging={isDragging && dragTaskId === task.id && dragType === 'move'}
                        isResizing={isDragging && dragTaskId === task.id && (dragType === 'left' || dragType === 'right')}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCreatingDependency && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: 14,
            zIndex: 100,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          点击目标任务建立 {depType} 依赖关系
          <button
            onClick={() => {
              setIsCreatingDependency(false);
              setDepFromTaskId(null);
            }}
            style={{
              padding: '4px 10px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 4,
              color: 'white',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            取消
          </button>
        </div>
      )}

      <TaskEditModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        allTasks={tasks}
        dependencies={dependencies}
      />
    </div>
  );
}
