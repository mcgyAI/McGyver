// Thin re-export so other modules import memory through core/, keeping
// services/memory.ts as the one place that actually touches the database.
export { loadMemory, saveMemory, clearMemory } from '../../services/memory';
