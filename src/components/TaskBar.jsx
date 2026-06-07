import React, { useState, useRef, useEffect } from 'react';
import { parseDate, calculateDuration, formatDate } from '../utils/dateUtils';
import { getTaskStatus, TASK_STATUS_LABELS } from '../utils/criticalPath';

const STATUS_COLORS = {
  'not-started': { bg: '#9ca3af', border: '#6b7280' },
  'in-progress': { bg: '#3b82f6', border: '#2563eb' },
  'completed': { bg: '#22c55e', border: '#16a34a' },
  'delayed': { bg: '#ef4444', border: '#dc2626' },
  'severely-delayed': { bg: '#b91c1c', border: '#991b1b' },
  'paused': { bg: '#eab308', border: '#ca8a04' },
  'overdue-warning': { bg: '#f97316', border: '#ea580c' },
};

export default function TaskBar({
  task,
  left,
  width,
  top,
  isCritical,
  onMouseDown,
  onDoubleClick,
  onDragStart,
  onResizeStart,
  isDragging,
  isResizing,
  showTooltip = true,
  readOnly = false,
}) {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const taskRef = useRef(null);

  const status = getTaskStatus(task);
  const colors = STATUS_COLORS[status] || STATUS_COLORS['not-started'];
  const duration = calculateDuration(parseDate(task.startDate), parseDate(task.endDate));
  const subtaskDone = (task.subtasks || []).filter((s) => s.done).length;
  const subtaskTotal = (task.subtasks || []).length;

  const handleMouseEnter = (e) => {
    if (showTooltip) {
      setShowTooltipState(true);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (showTooltipState) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    setShowTooltipState(false);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (onMouseDown) onMouseDown(e, task);
  };

  const handleLeftResizeMouseDown = (e) => {
    e.stopPropagation();
    if (onResizeStart) onResizeStart(e, task, 'left');
  };

  const handleRightResizeMouseDown = (e) => {
    e.stopPropagation();
    if (onResizeStart) onResizeStart(e, task, 'right');
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (onDoubleClick) onDoubleClick(task);
  };

  if (task.isMilestone) {
    return (
      <div
        ref={taskRef}
        className="gantt-milestone"
        style={{
          position: 'absolute',
          left: left - 12,
          top: top + 6,
          width: 24,
          height: 24,
          cursor: readOnly ? 'default' : 'pointer',
          zIndex: isCritical ? 30 : 10,
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          style={{
            width: 20,
            height: 20,
            backgroundColor: isCritical ? '#dc2626' : colors.bg,
            border: `2px solid ${isCritical ? '#991b1b' : colors.border}`,
            transform: 'rotate(45deg)',
            marginLeft: 2,
            marginTop: 2,
          }}
        />
        {showTooltipState && (
          <TaskTooltip
            task={task}
            status={status}
            duration={duration}
            subtaskDone={subtaskDone}
            subtaskTotal={subtaskTotal}
            isCritical={isCritical}
            position={tooltipPos}
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={taskRef}
      className={`gantt-task-bar ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        position: 'absolute',
        left,
        top: top + 6,
        width,
        height: 28,
        cursor: readOnly ? 'default' : 'move',
        zIndex: isCritical ? 30 : 10,
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: colors.bg,
          borderRadius: 4,
          border: `2px solid ${isCritical ? '#dc2626' : colors.border}`,
          boxShadow: isCritical ? '0 0 6px rgba(220, 38, 38, 0.5)' : '0 1px 3px rgba(0,0,0,0.2)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'box-shadow 0.2s',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${task.progress || 0}%`,
            backgroundColor: 'rgba(0,0,0,0.2)',
            transition: 'width 0.2s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            color: 'white',
            fontSize: 12,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            gap: 6,
          }}
        >
          {status === 'severely-delayed' && (
            <span style={{ fontSize: 14, fontWeight: 'bold' }}>⚠</span>
          )}
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</span>
        </div>
      </div>

      {!readOnly && (
        <div
          className="resize-handle resize-handle-left"
          style={{
            position: 'absolute',
            left: -4,
            top: 4,
            width: 8,
            height: 20,
            cursor: 'ew-resize',
            backgroundColor: 'transparent',
            zIndex: 5,
          }}
          onMouseDown={handleLeftResizeMouseDown}
        />
      )}

      {!readOnly && (
        <div
          className="resize-handle resize-handle-right"
          style={{
            position: 'absolute',
            right: -4,
            top: 4,
            width: 8,
            height: 20,
            cursor: 'ew-resize',
            backgroundColor: 'transparent',
            zIndex: 5,
          }}
          onMouseDown={handleRightResizeMouseDown}
        />
      )}

      {showTooltipState && (
        <TaskTooltip
          task={task}
          status={status}
          duration={duration}
          subtaskDone={subtaskDone}
          subtaskTotal={subtaskTotal}
          isCritical={isCritical}
          position={tooltipPos}
        />
      )}
    </div>
  );
}

function TaskTooltip({ task, status, duration, subtaskDone, subtaskTotal, isCritical, position }) {
  const plannedDuration = task.plannedDuration || duration;
  const actualDuration = task.actualDuration !== undefined && task.actualDuration !== null
    ? task.actualDuration
    : duration;
  const ratio = plannedDuration > 0 ? (actualDuration / plannedDuration).toFixed(1) : '0';

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x + 15,
        top: position.y + 15,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: 12,
        minWidth: 200,
        maxWidth: 300,
        zIndex: 1000,
        fontSize: 13,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{task.name}</div>
      {isCritical && (
        <div style={{ color: '#dc2626', marginBottom: 6, fontSize: 12, fontWeight: 500 }}>
          ⚠ 关键路径任务，延期会导致项目延期
        </div>
      )}
      {status === 'severely-delayed' && (
        <div style={{ color: '#b91c1c', marginBottom: 6, fontSize: 12, fontWeight: 500 }}>
          ⚠ 严重延期！实际工期超过预计 {ratio} 倍
        </div>
      )}
      {status === 'overdue-warning' && (
        <div style={{ color: '#f97316', marginBottom: 6, fontSize: 12, fontWeight: 500 }}>
          ⚡ 超期预警：实际工期超过预计 {ratio} 倍
        </div>
      )}
      <div style={{ color: '#6b7280', marginBottom: 4 }}>
        <span style={{ display: 'inline-block', width: 70 }}>状态:</span>
        <span style={{ color: '#1f2937', fontWeight: 500 }}>{TASK_STATUS_LABELS[status] || status}</span>
      </div>
      <div style={{ color: '#6b7280', marginBottom: 4 }}>
        <span style={{ display: 'inline-block', width: 70 }}>开始:</span>
        <span style={{ color: '#1f2937' }}>{formatDate(parseDate(task.startDate))}</span>
      </div>
      <div style={{ color: '#6b7280', marginBottom: 4 }}>
        <span style={{ display: 'inline-block', width: 70 }}>结束:</span>
        <span style={{ color: '#1f2937' }}>{formatDate(parseDate(task.endDate))}</span>
      </div>
      <div style={{ color: '#6b7280', marginBottom: 4 }}>
        <span style={{ display: 'inline-block', width: 70 }}>预计工期:</span>
        <span style={{ color: '#1f2937' }}>{plannedDuration} 天</span>
      </div>
      <div style={{ color: '#6b7280', marginBottom: 4 }}>
        <span style={{ display: 'inline-block', width: 70 }}>实际工期:</span>
        <span style={{
          color: ratio >= 2 ? '#b91c1c' : ratio >= 1.5 ? '#f97316' : '#1f2937',
          fontWeight: ratio >= 1.5 ? 500 : 400,
        }}>{actualDuration} 天{ratio >= 1.5 ? ` (${ratio}x)` : ''}</span>
      </div>
      <div style={{ color: '#6b7280', marginBottom: 4 }}>
        <span style={{ display: 'inline-block', width: 70 }}>进度:</span>
        <span style={{ color: '#1f2937' }}>{task.progress || 0}%</span>
      </div>
      {task.assignee && (
        <div style={{ color: '#6b7280', marginBottom: 4 }}>
          <span style={{ display: 'inline-block', width: 70 }}>负责人:</span>
          <span style={{ color: '#1f2937' }}>{task.assignee}</span>
        </div>
      )}
      {subtaskTotal > 0 && (
        <div style={{ color: '#6b7280' }}>
          <span style={{ display: 'inline-block', width: 70 }}>子任务:</span>
          <span style={{ color: '#1f2937' }}>{subtaskDone}/{subtaskTotal} 完成</span>
        </div>
      )}
    </div>
  );
}
