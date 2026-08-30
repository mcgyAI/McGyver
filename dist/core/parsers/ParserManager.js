"use strict";
// PHASE 1 - ingests documents/notes into knowledgeRegistry AND persists
// them via knowledgeStore. Plain text/markdown for now; PDFs and URLs are
// a later addition to this same class.
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserManager = exports.ParserManager = void 0;
const knowledgeRegistry_1 = require("../registries/knowledgeRegistry");
const knowledgeStore_1 = require("../../services/knowledgeStore");
class ParserManager {
    async ingestText(title, content) {
        const source = {
            id: `${Date.now()}-${title.slice(0, 20).replace(/\s+/g, '-')}`,
            type: 'note',
            title,
            content,
            addedAt: new Date(),
        };
        knowledgeRegistry_1.knowledgeRegistry.add(source);
        await (0, knowledgeStore_1.persistKnowledge)(source);
        return source;
    }
}
exports.ParserManager = ParserManager;
exports.parserManager = new ParserManager();
//# sourceMappingURL=ParserManager.js.map