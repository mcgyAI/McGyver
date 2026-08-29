"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFilesConnector = registerFilesConnector;
const toolRegistry_1 = require("../core/registries/toolRegistry");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
function registerFilesConnector() {
    const FILES_DIR = process.env.FILES_DIR || path_1.default.join(process.cwd(), 'files');
    toolRegistry_1.toolRegistry.register({
        id: 'files.list',
        description: 'List files in the configured directory',
        handler: async () => {
            try {
                const files = await promises_1.default.readdir(FILES_DIR);
                return files.map(f => ({ name: f }));
            }
            catch (error) {
                return { error: error.message };
            }
        }
    });
    toolRegistry_1.toolRegistry.register({
        id: 'files.read',
        description: 'Read a file from the configured directory',
        handler: async (input) => {
            try {
                const params = input;
                const filePath = path_1.default.join(FILES_DIR, params.filename);
                const content = await promises_1.default.readFile(filePath, 'utf-8');
                return { content };
            }
            catch (error) {
                return { error: error.message };
            }
        }
    });
}
//# sourceMappingURL=filesConnector.js.map