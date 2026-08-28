"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.listOpenTasks = listOpenTasks;
exports.completeTaskByMatch = completeTaskByMatch;
exports.completeTaskById = completeTaskById;
const taskStore_1 = require("../../services/taskStore");
function generateId(title) {
    return `${Date.now()}-${title.slice(0, 24).replace(/\s+/g, '-').toLowerCase()}`;
}
async function createTask(title, project, dueDate) {
    const task = {
        id: generateId(title),
        title,
        project,
        status: 'open',
        dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    await (0, taskStore_1.saveTask)(task);
    return task;
}
async function listOpenTasks() {
    const tasks = await (0, taskStore_1.loadAllTasks)();
    return tasks.filter(t => t.status === 'open');
}
async function completeTaskByMatch(match) {
    const tasks = await (0, taskStore_1.loadAllTasks)();
    const found = tasks.find(t => t.status === 'open' && t.title.toLowerCase().includes(match.toLowerCase()));
    if (!found)
        return null;
    found.status = 'done';
    found.updatedAt = new Date();
    await (0, taskStore_1.saveTask)(found);
    return found;
}
async function completeTaskById(id) {
    const tasks = await (0, taskStore_1.loadAllTasks)();
    const found = tasks.find(t => t.id === id);
    if (!found)
        return null;
    found.status = 'done';
    found.updatedAt = new Date();
    await (0, taskStore_1.saveTask)(found);
    return found;
}
//# sourceMappingURL=taskManager.js.map