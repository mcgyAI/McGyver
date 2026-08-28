// PHASE 1 - ingests documents/notes into knowledgeRegistry AND persists
// them via knowledgeStore. Plain text/markdown for now; PDFs and URLs are
// a later addition to this same class.

import { knowledgeRegistry, KnowledgeSource } from '../registries/knowledgeRegistry';
import { persistKnowledge } from '../../services/knowledgeStore';

export class ParserManager {
  async ingestText(title: string, content: string): Promise<KnowledgeSource> {
    const source: KnowledgeSource = {
      id: `${Date.now()}-${title.slice(0, 20).replace(/\s+/g, '-')}`,
      type: 'note',
      title,
      content,
      addedAt: new Date(),
    };
    knowledgeRegistry.add(source);
    await persistKnowledge(source);
    return source;
  }
}

export const parserManager = new ParserManager();
