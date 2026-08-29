import { toolRegistry } from '../core/registries/toolRegistry';
import path from 'path';
import fs from 'fs/promises';

export function registerFilesConnector() {
  const FILES_DIR = process.env.FILES_DIR || path.join(process.cwd(), 'files');

  toolRegistry.register({
    id: 'files.list',
    description: 'List files in the configured directory',
    handler: async () => {
      try {
        const files = await fs.readdir(FILES_DIR);
        return files.map(f => ({ name: f }));
      } catch (error) {
        return { error: (error as Error).message };
      }
    }
  });

  toolRegistry.register({
    id: 'files.read',
    description: 'Read a file from the configured directory',
    handler: async (input: Record<string, unknown>) => {
      try {
        const params = input as { filename: string };
        const filePath = path.join(FILES_DIR, params.filename);
        const content = await fs.readFile(filePath, 'utf-8');
        return { content };
      } catch (error) {
        return { error: (error as Error).message };
      }
    }
  });
}
