const STORAGE_KEY = 'react-gantt-projects';
const CURRENT_PROJECT_KEY = 'react-gantt-current-project';

export function loadProjects() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load projects:', e);
    return [];
  }
}

export function saveProjects(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects:', e);
  }
}

export function loadCurrentProjectId() {
  try {
    return localStorage.getItem(CURRENT_PROJECT_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function saveCurrentProjectId(id) {
  try {
    localStorage.setItem(CURRENT_PROJECT_KEY, id);
  } catch (e) {
    console.error('Failed to save current project:', e);
  }
}

export function exportProjectToJSON(project) {
  const data = JSON.stringify(project, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name || 'project'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importProjectFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target.result);
        resolve(project);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
