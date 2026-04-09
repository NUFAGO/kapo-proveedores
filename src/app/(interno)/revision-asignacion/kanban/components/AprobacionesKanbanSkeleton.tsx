'use client';

/** Columna en estado de carga (misma estructura visual que reclutamiento). */
export function AprobacionesKanbanSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 flex-col rounded-lg border shadow-lg animate-pulse"
      style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
    >
      <div className="shrink-0 rounded-t-lg border-b p-3" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 h-4 w-32 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
            <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
          </div>
          <div className="h-6 w-8 rounded-full" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border p-4"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="flex flex-1 items-center gap-2">
                <div className="h-8 w-8 rounded-full" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                <div className="flex-1">
                  <div className="mb-1 h-4 w-32 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                  <div className="h-3 w-40 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                </div>
              </div>
            </div>

            <div className="mb-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                <div className="h-3 w-24 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                <div className="h-3 w-16 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
              </div>
            </div>

            <div
              className="flex items-center justify-between border-t pt-2"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
                <div className="h-3 w-12 rounded" style={{ backgroundColor: 'var(--skeleton-bg)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
