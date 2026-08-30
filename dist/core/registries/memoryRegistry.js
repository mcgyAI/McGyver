"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearMemory = exports.saveMemory = exports.loadMemory = void 0;
// Thin re-export so other modules import memory through core/, keeping
// services/memory.ts as the one place that actually touches the database.
var memory_1 = require("../../services/memory");
Object.defineProperty(exports, "loadMemory", { enumerable: true, get: function () { return memory_1.loadMemory; } });
Object.defineProperty(exports, "saveMemory", { enumerable: true, get: function () { return memory_1.saveMemory; } });
Object.defineProperty(exports, "clearMemory", { enumerable: true, get: function () { return memory_1.clearMemory; } });
//# sourceMappingURL=memoryRegistry.js.map