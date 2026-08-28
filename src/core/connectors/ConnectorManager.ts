// Registers every connector's tools into toolRegistry at boot. Adding a
// real connector later (calendar, email, home automation) means writing
// one file like filesConnector.ts and adding one line here - nothing
// else in the system needs to change.

import { toolRegistry } from '../registries/toolRegistry';
import { registerFilesConnector } from '../../domains/automation/filesConnector';

export class ConnectorManager {
  registerAll(): void {
    registerFilesConnector();
    // Next connector goes here, e.g.:
    // registerCalendarConnector();
    const ids = toolRegistry.list().map(t => t.id).join(', ');
    console.log(`[MCGYVER] Connectors registered: ${ids || 'none'}`);
  }
}

export const connectorManager = new ConnectorManager();
