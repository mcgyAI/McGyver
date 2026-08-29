export interface Task {
  id: string;
  title: string;
  project?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

export async function createTask(title: string, project?: string, dueDate?: string): Promise<Task> {
  const task: Task = {
    id: Date.now().toString(),
    title,
    project,
    dueDate,
    completed: false,
    createdAt: new Date().toISOString()
  };
  // In a real implementation, this would save to database
  return task;
}

export async function completeTaskById(id: string): Promise<Task | null> {
  // In a real implementation, this would update in database
  return null;
}
