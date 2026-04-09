'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EstadoAprobacionKanban, SolicitudAprobacionKanban } from '../lib/aprobaciones-kanban.types';
import {
  COLUMNAS_APROBACION_COLORES,
  COLUMNAS_APROBACION_LABELS,
} from '../lib/aprobaciones-kanban.constants';
import { AprobacionesKanbanCard } from './AprobacionesKanbanCard';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface AprobacionesKanbanColumnProps {
  estado: EstadoAprobacionKanban;
  items: SolicitudAprobacionKanban[];
  /** Total en servidor (badge), no solo los cargados */
  totalCount: number;
  isLoading?: boolean;
  onLoadMore?: () => void | Promise<void>;
  hasNextPage?: boolean;
  onOpenDetalle?: (aprobacionId: string) => void;
}

export function AprobacionesKanbanColumn({
  estado,
  items: itemsIniciales,
  totalCount,
  isLoading = false,
  onLoadMore,
  hasNextPage = false,
  onOpenDetalle,
}: AprobacionesKanbanColumnProps) {
  const [items, setItems] = useState(itemsIniciales);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;
  const onOpenDetalleRef = useRef(onOpenDetalle);
  onOpenDetalleRef.current = onOpenDetalle;

  useEffect(() => {
    setItems(itemsIniciales);
  }, [itemsIniciales]);

  const runLoadMore = useCallback(async () => {
    if (loadingMore || !hasNextPage || !onLoadMoreRef.current) return;
    setLoadingMore(true);
    try {
      await onLoadMoreRef.current();
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasNextPage]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void runLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, runLoadMore]);

  const headerClass = COLUMNAS_APROBACION_COLORES[estado];
  const label = COLUMNAS_APROBACION_LABELS[estado];

  return (
    <div
      className="flex h-full min-h-0 flex-col rounded-lg border shadow-lg"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div
        className={`shrink-0 rounded-t-lg border-b p-3 ${headerClass}`}
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="min-w-6 rounded-full bg-white/80 px-2 py-0.5 text-center text-xs font-bold dark:bg-gray-700 dark:text-white">
            {totalCount}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {isLoading && items.length === 0 && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size={48} showText={false} />
          </div>
        )}

        {items.length === 0 && !isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Sin solicitudes
          </div>
        ) : (
          items.map((solicitud) => (
            <AprobacionesKanbanCard
              key={`${estado}-${solicitud.id}`}
              solicitud={solicitud}
              onOpenDetalle={(id) => onOpenDetalleRef.current?.(id)}
            />
          ))
        )}

        {hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {loadingMore ? <LoadingSpinner size={40} showText={false} /> : null}
          </div>
        )}
      </div>
    </div>
  );
}
