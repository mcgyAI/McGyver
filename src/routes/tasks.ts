import { Router as ExpressRouter } from 'express';
import { loadAllTasks } from '../services/taskStore';
import { createTask, completeTaskById } from '../services/taskManager';

const router = ExpressRouter();

router.get('/tasks', async (_req, res) => {
  const tasks = await loadAllTasks();
  res.json({ success: true, tasks });
});

router.post('/tasks', async (req, res) => {
  try {
    const { title, project, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Missing required field: title' });
    }
    const task = await createTask(title, project, dueDate);
    res.json({ success: true, task });
  } catch (e) {
    console.error('[MCGYVER] Task create error:', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/tasks/:id/complete', async (req, res) => {
  try {
    const task = await completeTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, task });
  } catch (e) {
    console.error('[MCGYVER] Task complete error:', e);
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
