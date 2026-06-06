import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export default function TaskEditModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  allTasks,
  dependencies,
}) {
  const [formData, setFormData] = useState({
    name: '',
    assignee: '',
    startDate: '',
    endDate: '',
    progress: 0,
    description: '',
    status: 'not-started',
    isMilestone: false,
    subtasks: [],
    parentId: null,
  });

  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        name: task.name || '',
        assignee: task.assignee || '',
        startDate: task.startDate || '',
        endDate: task.endDate || '',
        progress: task.progress || 0,
        description: task.description || '',
        status: task.status || 'not-started',
        isMilestone: task.isMilestone || false,
        subtasks: task.subtasks ? [...task.subtasks] : [],
        parentId: task.parentId || null,
      });
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'isMilestone' && value) {
        updated.endDate = prev.startDate;
      }
      return updated;
    });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    setFormData((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: uuidv4(), name: newSubtask.trim(), done: false }],
    }));
    setNewSubtask('');
  };

  const handleToggleSubtask = (subtaskId) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, done: !s.done } : s
      ),
    }));
  };

  const handleRemoveSubtask = (subtaskId) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((s) => s.id !== subtaskId),
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入任务名称');
      return;
    }
    if (!formData.startDate) {
      alert('请选择开始日期');
      return;
    }
    if (!formData.isMilestone && !formData.endDate) {
      alert('请选择结束日期');
      return;
    }
    onSave({ ...task, ...formData });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('确定要删除这个任务吗？')) {
      onDelete(task.id);
      onClose();
    }
  };

  const statusOptions = [
    { value: 'not-started', label: '未开始' },
    { value: 'in-progress', label: '进行中' },
    { value: 'paused', label: '已暂停' },
    { value: 'completed', label: '已完成' },
  ];

  const parentOptions = allTasks
    .filter((t) => t.id !== task.id && !t.isMilestone)
    .map((t) => ({ value: t.id, label: t.name }));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          width: 560,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {task.isNew ? '新建任务' : '编辑任务'}
          </h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#6b7280',
              padding: 4,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151', fontWeight: 500 }}>
              任务名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
              placeholder="请输入任务名称"
            />
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151', fontWeight: 500 }}>
                负责人
              </label>
              <input
                type="text"
                value={formData.assignee}
                onChange={(e) => handleChange('assignee', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
                placeholder="请输入负责人"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151', fontWeight: 500 }}>
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151', fontWeight: 500 }}>
                开始日期 *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {!formData.isMilestone && (
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151', fontWeight: 500 }}>
                  结束日期 *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151', fontWeight: 500 }}>
              进度: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => handleChange('progress', parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151' }}>
              <input
                type="checkbox"
                checked={formData.isMilestone}
                onChange={(e) => handleChange('isMilestone', e.target.checked)}
              />
              <span>设为里程碑（零工期节点）</span>
            </label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151', fontWeight: 500 }}>
              父任务
            </label>
            <select
              value={formData.parentId || ''}
              onChange={(e) => handleChange('parentId', e.target.value || null)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            >
              <option value="">无（顶级任务）</option>
              {parentOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151', fontWeight: 500 }}>
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                minHeight: 60,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              placeholder="任务描述..."
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, color: '#374151', fontWeight: 500 }}>
              子任务
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
                placeholder="输入子任务名称，回车添加"
              />
              <button
                onClick={handleAddSubtask}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                添加
              </button>
            </div>
            <div style={{ maxHeight: 120, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 6 }}>
              {formData.subtasks.length === 0 ? (
                <div style={{ padding: 12, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>
                  暂无子任务
                </div>
              ) : (
                formData.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '6px 10px',
                      borderBottom: '1px solid #f3f4f6',
                      gap: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={sub.done}
                      onChange={() => handleToggleSubtask(sub.id)}
                    />
                    <span style={{ flex: 1, fontSize: 13, textDecoration: sub.done ? 'line-through' : 'none', color: sub.done ? '#9ca3af' : '#374151' }}>
                      {sub.name}
                    </span>
                    <button
                      onClick={() => handleRemoveSubtask(sub.id)}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      删除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {!task.isNew && (
            <button
              onClick={handleDelete}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              删除任务
            </button>
          )}
          <div style={{ marginLeft: task.isNew ? 'auto' : 0, display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
