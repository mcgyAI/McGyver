import fs from 'fs/promises';
import path from 'path';
import { toolRegistry } from '../../core/registries/toolRegistry';

// Zero-setup example connector: gives Mc'Gyver read access to one local
// folder. Point FILES_DIR at wherever you keep notes/documents; defaults
// to a "files" folder inside this project so it works with no config.
const FILES_DIR = process.env.FILES_DIR || path.join(process.cwd(), 'files');

async function ensureDir(): Promise<void> {
  await fs.mkdir(FILES_DIR, { recursive: true });
}

// Resolves a user-supplied relative path and refuses anything that would
// escape FILES_DIR (e.g. "../../etc/passwd") - the LLM decides what path
// to pass, so this boundary can't depend on the LLM behaving.
function safePath(relPath: string): string {
  const resolved = path.resolve(FILES_DIR, relPath);
  const root = path.resolve(FILES_DIR);
  if (!resolved.startsWith(root)) {
    throw new Error('That path is outside the allowed files directory');
  }
  return resolved;
}

export function registerFilesConnector(): void {
  toolRegistry.register({
    id: 'files.list',
    description: "List files in your local Mc'Gyver files folder",
    handler: async () => {
      await ensureDir();
      const entries = await fs.readdir(FILES_DIR, { withFileTypes: true });
      return entries.filter(e => e.isFile() && !e.name.startsWith('.')).map(e => e.name);
    },
  });

  toolRegistry.register({
    id: 'files.read',
    description: 'Read the contents of a file by name from your files folder. Input: { path: string }',
    handler: async (input) => {
      await ensureDir();
      const name = String(input.path || input.name || '');
      if (!name) throw new Error('No filename provided');
      const full = safePath(name);
      const content = await fs.readFile(full, 'utf-8');
      return content.slice(0, 6000); // keep tool results a reasonable size
    },
  });
}
