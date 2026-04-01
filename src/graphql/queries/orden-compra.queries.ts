/**
 * 📄 QUERY PARA ÓRDENES DE COMPRA
 */

export const LISTAR_ORDENES_COMPRA_QUERY = `
  query ListarOrdenesCompra($filter: OrdenCompraPaginationInput) {
    listOrdenComprasPaginated(filter: $filter) {
      data {
        id
        codigo_orden
        estado
        descripcion
        fecha_ini
        fecha_fin
        tipo
        total
        obra_id
        req_usuario_id
        codigo_rq
        proveedor_id
        divisa_id
        estado_almacen
        estado_comprobante
        cantidad_cierre
        tiene_expediente
        proveedor {
          id
          nombre_comercial
          ruc
          razon_social
          telefono
          correo
          direccion
          rubro
          estado
          tipo
          actividad
          estado_sunat
          condicion
          agente_retencion
          sub_contrata
          distrito
          provincia
          departamento
        }
        obra {
          id
          titulo
          nombre
          descripcion
          direccion
          estado
        }
        cotizacion_id {
          id
          codigo_cotizacion
          aprobacion
          estado
          fecha
          usuario_id {
            id
            nombres
            apellidos
            dni
          }
        }
        pagos {
          monto_solicitado
          estado
        }
        comprobantes {
          _id
          serie
          numeracion
          monto
          estado
          comentario_aprobacion
          archivo_url
        }
      }
      total
      page
      limit
      totalPages
    }
  }
`;
