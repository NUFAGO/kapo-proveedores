/**
 * Cliente IndexedDB para almacenamiento offline
 * Versión segura con migraciones y error handling
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Versionado de la base de datos
const DB_NAME = 'activos-fijos-db';
const DB_VERSION = 1;

// Esquema de la base de datos
interface ActivosFijosDB extends DBSchema {
  // Datos de informes (para edición offline)
  informes: {
    key: string;
    value: {
      id: string;
      data: any;
      lastModified: number;
      syncStatus: 'pending' | 'synced' | 'error';
      version: number;
    };
    indexes: {
      syncStatus: string;
      lastModified: number;
    };
  };

  // Queue de sincronización
  syncQueue: {
    key: string;
    value: {
      id: string;
      entityId: string;
      entityType: 'informe' | 'proyecto' | 'maquinaria';
      operation: 'create' | 'update' | 'delete';
      endpoint: string;
      method: 'POST' | 'PUT' | 'DELETE';
      payload: any;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      retryCount: number;
      maxRetries: number;
      createdAt: number;
      updatedAt: number;
      timestamp: number;
      lastAttempt?: number;
      nextRetryAt?: number;
      errorMessage?: string;
      errorCode?: string;
      priority: string;
    };
    indexes: {
      timestamp: number;
      type: string;
    };
  };

  // Cache de datos de referencia (solo lectura)
  referenceData: {
    key: string;
    value: {
      key: string;
      data: any;
      expiresAt: number;
      version: number;
    };
    indexes: {
      expiresAt: number;
    };
  };

  // Configuración de la app
  appConfig: {
    key: string;
    value: {
      key: string;
      value: any;
      updatedAt: number;
    };
  };
}

let dbInstance: IDBPDatabase<ActivosFijosDB> | null = null;

/**
 * Obtener instancia de la base de datos
 * Se inicializa solo una vez (singleton)
 */
export async function getDB(): Promise<IDBPDatabase<ActivosFijosDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    console.log('[IndexedDB] Opening database...');

    dbInstance = await openDB<ActivosFijosDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`[IndexedDB] Upgrading from v${oldVersion} to v${newVersion}`);

        // Migración inicial (v1)
        if (oldVersion < 1) {
          // Tabla de informes
          if (!db.objectStoreNames.contains('informes')) {
            const informesStore = db.createObjectStore('informes', {
              keyPath: 'id'
            });
            informesStore.createIndex('syncStatus', 'syncStatus');
            informesStore.createIndex('lastModified', 'lastModified');
          }

          // Queue de sincronización
          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', {
              keyPath: 'id'
            });
            syncStore.createIndex('timestamp', 'timestamp');
            syncStore.createIndex('type', 'type');
          }

          // Datos de referencia
          if (!db.objectStoreNames.contains('referenceData')) {
            const refStore = db.createObjectStore('referenceData', {
              keyPath: 'key'
            });
            refStore.createIndex('expiresAt', 'expiresAt');
          }

          // Configuración
          if (!db.objectStoreNames.contains('appConfig')) {
            db.createObjectStore('appConfig', {
              keyPath: 'key'
            });
          }
        }

        // Aquí se pueden agregar futuras migraciones
        // if (oldVersion < 2) { ... }
      },

      blocked() {
        console.warn('[IndexedDB] Database blocked - close other tabs');
      },

      blocking() {
        console.warn('[IndexedDB] Database blocking - will close soon');
        // Cerrar la conexión actual
        dbInstance?.close();
        dbInstance = null;
      },

      terminated() {
        console.error('[IndexedDB] Database terminated unexpectedly');
        dbInstance = null;
      },
    });

    console.log('[IndexedDB] Database opened successfully');
    return dbInstance;

  } catch (error) {
    console.error('[IndexedDB] Failed to open database:', error);
    throw new Error(`Database initialization failed: ${error}`);
  }
}

/**
 * Cerrar la base de datos
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('[IndexedDB] Database closed');
  }
}

/**
 * Limpiar toda la base de datos (reset completo)
 */
export async function clearDatabase(): Promise<void> {
  try {
    console.log('[IndexedDB] Clearing entire database...');

    const db = await getDB();
    const stores = Array.from(db.objectStoreNames);

    const transaction = db.transaction(stores, 'readwrite');

    await Promise.all(
      stores.map(storeName => {
        const store = transaction.objectStore(storeName);
        return store.clear();
      })
    );

    await transaction.done;
    console.log('[IndexedDB] Database cleared successfully');

  } catch (error) {
    console.error('[IndexedDB] Failed to clear database:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de la base de datos
 */
export async function getDBStats(): Promise<{
  informes: number;
  syncQueue: number;
  referenceData: number;
  appConfig: number;
  storageEstimate?: { quota?: number; usage?: number };
}> {
  try {
    const db = await getDB();

    const [informesCount, syncQueueCount, referenceDataCount, appConfigCount] = await Promise.all([
      db.count('informes'),
      db.count('syncQueue'),
      db.count('referenceData'),
      db.count('appConfig'),
    ]);

    // Estimación de storage (si está disponible)
    let storageEstimate;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      storageEstimate = await navigator.storage.estimate();
    }

    return {
      informes: informesCount,
      syncQueue: syncQueueCount,
      referenceData: referenceDataCount,
      appConfig: appConfigCount,
      storageEstimate,
    };

  } catch (error) {
    console.error('[IndexedDB] Failed to get stats:', error);
    throw error;
  }
}

/**
 * Verificar si IndexedDB está disponible
 */
export function isIDBAvailable(): boolean {
  try {
    // Verificar soporte básico
    if (!('indexedDB' in window)) {
      return false;
    }

    // Verificar que no esté deshabilitado
    if (!window.indexedDB) {
      return false;
    }

    // Verificar que podemos crear una base de datos de prueba
    const testDB = indexedDB.open('test-db', 1);
    testDB.onerror = () => {
      console.warn('[IndexedDB] IndexedDB blocked or unavailable');
    };
    testDB.onsuccess = () => {
      indexedDB.deleteDatabase('test-db');
    };

    return true;

  } catch (error) {
    console.warn('[IndexedDB] IndexedDB not available:', error);
    return false;
  }
}

// Exportar tipos para uso en otros módulos
export type { ActivosFijosDB };
