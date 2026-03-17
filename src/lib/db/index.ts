/**
 * Utilidades de base de datos IndexedDB
 */

// Cliente principal
export {
  getDB,
  closeDB,
  clearDatabase,
  getDBStats,
  isIDBAvailable,
  type ActivosFijosDB,
} from './client';

// Esquemas y tipos
export type {
  BaseEntity,
  SyncStatus,
  OfflineInforme,
  SyncQueueItem,
  ReferenceData,
  AppConfig,
  DBStats,
  SyncOperation,
  SyncResult,
  ConflictResolution,
  SyncConfig,
  ConnectionStatus,
  ConnectionInfo,
} from './schema';

// Queue de sincronización
export {
  SyncQueueManager,
  getSyncQueueManager,
} from './sync-queue';
