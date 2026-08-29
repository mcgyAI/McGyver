"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.completeTaskById = completeTaskById;
async function createTask(title, project, dueDate) {
    const task = {
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
async function completeTaskById(id) {
    // In a real implementation, this would update in database
    return null;
}
//# sourceMappingURL=taskManager.js.map