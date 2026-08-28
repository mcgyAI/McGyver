export interface KnowledgeSource {
  id: string;
  type: 'note' | 'document' | 'conversation' | 'url';
  title: string;
  content: string;
  addedAt: Date;
}

// PHASE 1 STUB. This in-memory, substring-search version exists only so
// the rest of the system (Router, prompts) has a stable interface to
// build against today. Phase 1 replaces the internals with a real
// embedding store (e.g. Mongo Atlas Vector Search) without changing this
// interface - nothing that calls knowledgeRegistry.search() should need
// to change when that happens.
// Backed by MongoDB when available (see services/knowledgeStore.ts), with
// an in-memory index here for fast synchronous search during a request.
// Phase 1 uses word-overlap scoring rather than a full embedding search -
// no extra API keys or services required. If search quality becomes the
// bottleneck later, swap the scoring inside search() for a real vector
// store without changing this interface.
class KnowledgeRegistry {
  private sources: KnowledgeSource[] = [];

  add(source: KnowledgeSource): void {
    this.sources.push(source);
  }

  hydrate(sources: KnowledgeSource[]): void {
    this.sources = sources;
  }

  has(id: string): boolean {
    return this.sources.some(source => source.id === id);
  }

  search(query: string, limit = 3): KnowledgeSource[] {
    const terms = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    if (terms.length === 0) return [];

    const scored = this.sources.map(source => {
      const haystack = `${source.title} ${source.content}`.toLowerCase();
      const score = terms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
      return { source, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.source);
  }

  all(): KnowledgeSource[] {
    return this.sources;
  }
}

export const knowledgeRegistry = new KnowledgeRegistry();
