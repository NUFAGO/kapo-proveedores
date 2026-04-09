'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column, Button, Select, type SelectOption } from '@/components/ui';
import { Button as ButtonOutline } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useReportesSolicitudPagoPorProveedor,
  type ReporteSolicitudPagoRow,
  type ReporteSolicitudPagoFilter,
} from '@/hooks';
import { useAuthProveedor } from '@/context/auth-proveedor-context';
import { Eye, Search, RotateCcw, User, Plus, Link2, Link2Off } from 'lucide-react';
import ReporteSolicitudPagoForm from './components/reporteSolicitudPagoForm';

const VINCULADO_FILTRO_OPTIONS: SelectOption[] = [
  { value: 'todos', label: 'Todos (vinculación)' },
  { value: 'no', label: 'Sin vincular' },
  { value: 'si', label: 'Vinculados' },
];

function estaReporteVinculado(row: ReporteSolicitudPagoRow): boolean {
  return Boolean(row.solicitudPagoId?.trim() || row.solicitudPago?.id);
}

export default function ReportesProveedorPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthProveedor();
  const [searchInput, setSearchInput] = useState('');
  const [vinculadoSelect, setVinculadoSelect] = useState<'todos' | 'si' | 'no'>('todos');
  const [filters, setFilters] = useState<ReporteSolicitudPagoFilter>({
    page: 1,
    limit: 10,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewReporteId, setViewReporteId] = useState<string | null>(null);

  const { data: listado, isLoading, error, refetch } = useReportesSolicitudPagoPorProveedor(
    user?.proveedor_id || '',
    filters
  );

  useEffect(() => {
    if (user?.proveedor_id && !authLoading) {
      setFilters((prev) => ({ ...prev, page: 1 }));
    }
  }, [user?.proveedor_id, authLoading]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleSearch = (searchTerm: string) => {
    setSearchInput(searchTerm);
    setFilters((prev) => ({
      ...prev,
      searchTerm: searchTerm.trim() || undefined,
      page: 1,
    }));
  };

  const handleClear = () => {
    setSearchInput('');
    setVinculadoSelect('todos');
    setFilters({ page: 1, limit: 10 });
  };

  const handleVinculadoChange = (value: 'todos' | 'si' | 'no') => {
    setVinculadoSelect(value);
    setFilters((prev) => {
      const next: ReporteSolicitudPagoFilter = {
        ...prev,
        page: 1,
      };
      if (value === 'todos') {
        delete next.vinculado;
      } else {
        next.vinculado = value === 'si';
      }
      return next;
    });
  };

  const hasActiveFilters = Boolean(filters.searchTerm) || vinculadoSelect !== 'todos';

  const columns: Column<ReporteSolicitudPagoRow>[] = [
    {
      key: 'codigo',
      header: 'Código',
      className: 'text-left text-xs w-24 font-mono',
      render: (_: unknown, row: ReporteSolicitudPagoRow) => (
        <span className="font-semibold text-text-primary tabular-nums">
          {row.codigo?.trim() || '—'}
        </span>
      ),
    },
    {
      key: 'identificadorSolicitudPago',
      header: 'Referencia',
      className: 'text-left text-xs min-w-[7rem] max-w-[10rem]',
      render: (_: unknown, row: ReporteSolicitudPagoRow) => (
        <span className="font-medium text-text-primary">
          {row.identificadorSolicitudPago?.trim() || '—'}
        </span>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      className: 'text-left text-xs w-24 whitespace-nowrap',
      render: (_: unknown, row: ReporteSolicitudPagoRow) => (
        <span>
          {row.fecha
            ? new Date(row.fecha).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      key: 'maestroResponsable',
      header: 'Maestro / responsable',
      className: 'text-left text-xs min-w-[8rem] max-w-[12rem]',
      render: (value: string) => (
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="w-3.5 h-3.5 shrink-0 text-text-secondary" />
          <span className="truncate">{value || '—'}</span>
        </div>
      ),
    },
    {
      key: 'observacionesGenerales',
      header: 'Observaciones generales',
      className: 'text-left text-xs min-w-[10rem] max-w-md',
      render: (value: string | null | undefined) => (
        <span className="line-clamp-2 text-text-secondary">{value?.trim() ? value : '—'}</span>
      ),
    },
    {
      key: 'vinculado',
      header: 'Vinculado',
      className: 'text-left text-xs w-32',
      render: (_: unknown, row: ReporteSolicitudPagoRow) => {
        const v = estaReporteVinculado(row);
        return (
          <div className="flex items-center gap-1.5">
            {v ? (
              <>
                <Link2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-[10px] font-medium text-emerald-800 dark:text-emerald-300"
                >
                  Sí
                </Badge>
              </>
            ) : (
              <>
                <Link2Off className="w-3.5 h-3.5 shrink-0 text-text-secondary" aria-hidden />
                <Badge variant="outline" className="text-[10px] font-normal text-text-secondary">
                  No
                </Badge>
              </>
            )}
          </div>
        );
      },
    },
    {
      key: 'acciones',
      header: 'Acciones',
      className: 'text-center min-w-[5.5rem]',
      render: (_: unknown, row: ReporteSolicitudPagoRow) => (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <ButtonOutline
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => setViewReporteId(row.id)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Ver
          </ButtonOutline>
        </div>
      ),
    },
  ];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-sm text-text-secondary">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            Reportes de solicitud de pago
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Reportes operativos registrados para tu proveedor
          </p>
        </div>
        <Button
          variant="custom"
          color="blue"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsFormOpen(true)}
        >
          Nuevo reporte
        </Button>
      </div>

      <div className="bg-background backdrop-blur-sm rounded-lg card-shadow p-4">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Buscar por identificador de solicitud, maestro u observaciones..."
              value={searchInput}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs h-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48 shrink-0">
            <Select
              value={vinculadoSelect}
              onChange={(v) => {
                const key: 'todos' | 'si' | 'no' =
                  v === 'si' || v === 'no' ? v : 'todos';
                handleVinculadoChange(key);
              }}
              options={VINCULADO_FILTRO_OPTIONS}
              placeholder="Vinculación"
              className="h-8"
            />
          </div>
          {hasActiveFilters && (
            <ButtonOutline
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-8 text-xs"
              onClick={handleClear}
            >
              <RotateCcw className="w-4 h-4" />
              Limpiar
            </ButtonOutline>
          )}
        </div>
      </div>

      <DataTable
        data={listado?.data ?? []}
        columns={columns}
        subtitle={`${listado?.total ?? 0} reportes`}
        loading={isLoading}
        emptyMessage="No hay reportes registrados"
        serverPagination={
          listado
            ? {
                currentPage: listado.page,
                totalPages: listado.totalPages,
                totalCount: listado.total,
                onPageChange: handlePageChange,
              }
            : undefined
        }
        rowsPerPage={10}
        showPagination
        className="shadow-lg"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 font-medium">Error al cargar reportes</p>
          <p className="text-sm text-red-600 mt-1">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
        </div>
      )}

      <ReporteSolicitudPagoForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          void refetch();
        }}
      />
      <ReporteSolicitudPagoForm
        isOpen={Boolean(viewReporteId)}
        mode="view"
        reporteId={viewReporteId}
        onClose={() => setViewReporteId(null)}
      />
    </div>
  );
}
