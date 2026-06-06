import React, { useState, useEffect } from 'react';
import GanttChart from './components/GanttChart';
import { sampleProject, createEmptyProject } from './data/sampleData';
import {
  loadProjects,
  saveProjects,
  loadCurrentProjectId,
  saveCurrentProjectId,
} from './utils/storage';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    const savedProjects = loadProjects();
    const savedId = loadCurrentProjectId();

    if (savedProjects.length === 0) {
      const initial = [sampleProject];
      setProjects(initial);
      saveProjects(initial);
      setCurrentProjectId(sampleProject.id);
      saveCurrentProjectId(sampleProject.id);
    } else {
      setProjects(savedProjects);
      if (savedId && savedProjects.find((p) => p.id === savedId)) {
        setCurrentProjectId(savedId);
      } else {
        setCurrentProjectId(savedProjects[0].id);
        saveCurrentProjectId(savedProjects[0].id);
      }
    }
  }, []);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const handleProjectChange = (updatedProject) => {
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === updatedProject.id ? { ...updatedProject, updatedAt: new Date().toISOString() } : p
      );
      saveProjects(updated);
      return updated;
    });
  };

  const handleSwitchProject = (projectId) => {
    setCurrentProjectId(projectId);
    saveCurrentProjectId(projectId);
    setShowProjectManager(false);
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) {
      alert('请输入项目名称');
      return;
    }
    const newProject = createEmptyProject(newProjectName.trim());
    setProjects((prev) => {
      const updated = [...prev, newProject];
      saveProjects(updated);
      return updated;
    });
    setCurrentProjectId(newProject.id);
    saveCurrentProjectId(newProject.id);
    setNewProjectName('');
    setShowProjectManager(false);
  };

  const handleDeleteProject = (projectId) => {
    if (!confirm('确定要删除这个项目吗？此操作不可撤销。')) return;
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== projectId);
      saveProjects(updated);
      if (projectId === currentProjectId && updated.length > 0) {
        setCurrentProjectId(updated[0].id);
        saveCurrentProjectId(updated[0].id);
      }
      return updated;
    });
  };

  const statusColors = {
    draft: '#9ca3af',
    planning: '#3b82f6',
    'in-progress': '#22c55e',
    paused: '#eab308',
    completed: '#6366f1',
    archived: '#8b5cf6',
    cancelled: '#ef4444',
  };

  const statusLabels = {
    draft: '草稿',
    planning: '规划中',
    'in-progress': '执行中',
    paused: '已暂停',
    completed: '已完成',
    archived: '已归档',
    cancelled: '已取消',
  };

  if (!currentProject) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>暂无项目</p>
        <button
          onClick={() => setShowProjectManager(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          创建项目
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          height: 56,
          backgroundColor: '#1f2937',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
          flexShrink: 0,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>📊 React Gantt</h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            padding: '6px 12px',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 6,
          }}
          onClick={() => setShowProjectManager(true)}
        >
          <span style={{ fontSize: 14, fontWeight: 500 }}>{currentProject.name}</span>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: statusColors[currentProject.status] || '#9ca3af',
            }}
          />
          <span style={{ fontSize: 12, opacity: 0.7 }}>{statusLabels[currentProject.status]}</span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>▼</span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          任务: {currentProject.tasks?.length || 0} | 依赖: {currentProject.dependencies?.length || 0}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <GanttChart project={currentProject} onProjectChange={handleProjectChange} />
      </div>

      {showProjectManager && (
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
            zIndex: 2000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProjectManager(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              width: 500,
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>项目管理</h3>
              <button
                onClick={() => setShowProjectManager(false)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="输入新项目名称"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
                <button
                  onClick={handleCreateProject}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  新建
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 24px',
                    gap: 12,
                    cursor: 'pointer',
                    backgroundColor: project.id === currentProjectId ? '#eff6ff' : 'transparent',
                    transition: 'background-color 0.15s',
                  }}
                  onClick={() => handleSwitchProject(project.id)}
                  onMouseEnter={(e) => {
                    if (project.id !== currentProjectId) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (project.id !== currentProjectId) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: statusColors[project.status] || '#9ca3af',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1f2937' }}>{project.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {project.tasks?.length || 0} 个任务 · {project.dependencies?.length || 0} 条依赖
                    </div>
                  </div>
                  {project.id !== currentProjectId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: 12,
                        padding: 4,
                      }}
                    >
                      删除
                    </button>
                  )}
                  {project.id === currentProjectId && (
                    <span style={{ fontSize: 12, color: '#3b82f6', fontWeight: 500 }}>当前</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
