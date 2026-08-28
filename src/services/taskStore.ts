import { getDb } from './db';

export interface Task {
  id: string;
  title: string;
  project?: string;
  status: 'open' | 'done';
  dueDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

let fallback: Task[] = [];

export async function loadAllTasks(): Promise<Task[]> {
  try {
    const db = getDb();
    const docs = await db.collection('tasks').find({}).toArray();
    return docs.map((d: any) => ({
      id: d.id,
      title: d.title,
      project: d.project,
      status: d.status,
      dueDate: d.dueDate,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  } catch (e) {
    console.warn('[MCGYVER] Task load falling back to in-process store:', (e as Error).message);
    return fallback;
  }
}

export async function saveTask(task: Task): Promise<void> {
  try {
    const db = getDb();
    await db.collection('tasks').updateOne(
      { id: task.id },
      { $set: task as any },
      { upsert: true }
    );
  } catch (e) {
    console.warn('[MCGYVER] Task save falling back to in-process store:', (e as Error).message);
    fallback = [...fallback.filter(t => t.id !== task.id), task];
  }
}
