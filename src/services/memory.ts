import { getDb } from './db';
import { ChatMessage } from './llm';

const MAX_TURNS = 40; // Mc'Gyver can afford a much longer window than Mc'Gy -
                       // it's one conversation thread with one person, not
                       // thousands of concurrent app users.

let fallback: ChatMessage[] = [];

export async function loadMemory(): Promise<ChatMessage[]> {
  try {
    const db = getDb();
    const doc = await db.collection('memory').findOne({ _id: 'owner' as any });
    if (doc && Array.isArray(doc.messages)) return doc.messages;
    return [];
  } catch (e) {
    console.warn('[MCGYVER] Memory load falling back to in-process store:', (e as Error).message);
    return fallback;
  }
}

export async function saveMemory(messages: ChatMessage[]): Promise<void> {
  const trimmed = messages.slice(-MAX_TURNS * 2);
  try {
    const db = getDb();
    await db.collection('memory').updateOne(
      { _id: 'owner' as any },
      { $set: { messages: trimmed, updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (e) {
    console.warn('[MCGYVER] Memory save falling back to in-process store:', (e as Error).message);
    fallback = trimmed;
  }
}

export async function clearMemory(): Promise<void> {
  fallback = [];
  try {
    const db = getDb();
    await db.collection('memory').deleteOne({ _id: 'owner' as any });
  } catch {
    // fallback already cleared above
  }
}
