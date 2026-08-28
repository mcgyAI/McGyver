import { getDb } from './db';
import { KnowledgeSource } from '../core/registries/knowledgeRegistry';

let fallback: KnowledgeSource[] = [];

export async function loadAllKnowledge(): Promise<KnowledgeSource[]> {
  try {
    const db = getDb();
    const docs = await db.collection('knowledge').find({}).toArray();
    return docs.map((d: any) => ({
      id: d.id,
      type: d.type,
      title: d.title,
      content: d.content,
      addedAt: d.addedAt,
    }));
  } catch (e) {
    console.warn('[MCGYVER] Knowledge load falling back to in-process store:', (e as Error).message);
    return fallback;
  }
}

export async function persistKnowledge(source: KnowledgeSource): Promise<void> {
  try {
    const db = getDb();
    await db.collection('knowledge').updateOne(
      { id: source.id },
      { $set: source as any },
      { upsert: true }
    );
  } catch (e) {
    console.warn('[MCGYVER] Knowledge save falling back to in-process store:', (e as Error).message);
    fallback = [...fallback.filter(s => s.id !== source.id), source];
  }
}
