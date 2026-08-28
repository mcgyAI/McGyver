import { loadAllTasks, saveTask, Task } from '../../services/taskStore';

function generateId(title: string): string {
  return `${Date.now()}-${title.slice(0, 24).replace(/\s+/g, '-').toLowerCase()}`;
}

export async function createTask(title: string, project?: string, dueDate?: string): Promise<Task> {
  const task: Task = {
    id: generateId(title),
    title,
    project,
    status: 'open',
    dueDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await saveTask(task);
  return task;
}

export async function listOpenTasks(): Promise<Task[]> {
  const tasks = await loadAllTasks();
  return tasks.filter(t => t.status === 'open');
}

export async function completeTaskByMatch(match: string): Promise<Task | null> {
  const tasks = await loadAllTasks();
  const found = tasks.find(t => t.status === 'open' && t.title.toLowerCase().includes(match.toLowerCase()));
  if (!found) return null;
  found.status = 'done';
  found.updatedAt = new Date();
  await saveTask(found);
  return found;
}

export async function completeTaskById(id: string): Promise<Task | null> {
  const tasks = await loadAllTasks();
  const found = tasks.find(t => t.id === id);
  if (!found) return null;
  found.status = 'done';
  found.updatedAt = new Date();
  await saveTask(found);
  return found;
}
