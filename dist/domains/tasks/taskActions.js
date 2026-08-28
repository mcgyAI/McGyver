"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTaskAction = executeTaskAction;
const taskManager_1 = require("./taskManager");
async function executeTaskAction(result) {
    if (result.action === 'create') {
        const task = await (0, taskManager_1.createTask)(result.title || 'Untitled task', result.project, result.dueDate);
        const due = task.dueDate ? ` (due ${task.dueDate})` : '';
        const proj = task.project ? ` [${task.project}]` : '';
        return `Added: "${task.title}"${proj}${due}`;
    }
    if (result.action === 'list') {
        const open = await (0, taskManager_1.listOpenTasks)();
        if (open.length === 0)
            return "Nothing on your list right now.";
        const lines = open.map(t => {
            const due = t.dueDate ? ` (due ${t.dueDate})` : '';
            const proj = t.project ? ` [${t.project}]` : '';
            return `- ${t.title}${proj}${due}`;
        });
        return `Here's what's open:\n${lines.join('\n')}`;
    }
    if (result.action === 'complete') {
        const found = await (0, taskManager_1.completeTaskByMatch)(result.match || '');
        if (!found)
            return `Couldn't find an open task matching "${result.match}".`;
        return `Marked done: "${found.title}"`;
    }
    return "Not sure what to do with that task request.";
}
//# sourceMappingURL=taskActions.js.map