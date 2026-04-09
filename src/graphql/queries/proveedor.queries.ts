// ============================================================================
// QUERIES DE PROVEEDORES
// ============================================================================

export const LISTAR_PROVEEDORES_QUERY = `
  query ListarProveedores {
    listProveedor {
      id
      razon_social
      direccion
      nombre_comercial
      ruc
      rubro
      estado
      tipo
      actividad
      correo
      telefono
      estado_sunat
      condicion
      agente_retencion
      sub_contrata
      distrito
      provincia
      departamento
      mediosPago {
        id
        entidad {
          id
          nombre
          abreviatura
        }
        nro_cuenta
        detalles
        titular
        validado
        mostrar
      }
      contactos {
        id
        nombres
        apellidos
        cargo
        telefono
      }
      estadisticasCotizaciones {
        proveedor_id
        razon_social
        totalCotizaciones
        cotizacionesPorEstado {
          estado
          cantidad
          porcentaje
        }
        primeraCotizacion
        ultimaCotizacion
      }
    }
  }
`;

export const OBTENER_PROVEEDOR_POR_ID_QUERY = `
  query ObtenerProveedorPorId($id: ID!) {
    getProveedorById(id: $id) {
      id
      razon_social
      direccion
      nombre_comercial
      ruc
      rubro
      estado
      tipo
      actividad
      correo
      telefono
      estado_sunat
      condicion
      agente_retencion
      sub_contrata
      distrito
      provincia
      departamento
      mediosPago {
        id
        entidad {
          id
          nombre
          abreviatura
        }
        nro_cuenta
        detalles
        titular
        validado
        mostrar
      }
      contactos {
        id
        nombres
        apellidos
        cargo
        telefono
      }
      estadisticasCotizaciones {
        proveedor_id
        razon_social
        totalCotizaciones
        cotizacionesPorEstado {
          estado
          cantidad
          porcentaje
        }
        primeraCotizacion
        ultimaCotizacion
      }
    }
  }
`;

export const BUSCAR_PROVEEDOR_POR_RUC_QUERY = `
  query BuscarProveedorPorRuc($ruc: String!) {
    getProveedorByRuc(ruc: $ruc) {
      id
      razon_social
      direccion
      nombre_comercial
      ruc
      rubro
      estado
      tipo
      actividad
      correo
      telefono
      estado_sunat
      condicion
      agente_retencion
      sub_contrata
      distrito
      provincia
      departamento
      mediosPago {
        id
        entidad {
          id
          nombre
          abreviatura
        }
        nro_cuenta
        detalles
        titular
        validado
        mostrar
      }
      contactos {
        id
        nombres
        apellidos
        cargo
        telefono
      }
      estadisticasCotizaciones {
        proveedor_id
        razon_social
        totalCotizaciones
        cotizacionesPorEstado {
          estado
          cantidad
          porcentaje
        }
        primeraCotizacion
        ultimaCotizacion
      }
    }
  }
`;

export const LISTAR_PROVEEDORES_SUBCONTRATA_QUERY = `
  query ListarProveedoresSubContrata {
    listProveedoresSubContrata {
      id
      razon_social
      direccion
      nombre_comercial
      ruc
      rubro
      estado
      tipo
      actividad
      correo
      telefono
      estado_sunat
      condicion
      agente_retencion
      sub_contrata
      distrito
      provincia
      departamento
    }
  }
`;

export const LISTAR_PROVEEDORES_PAGINATED_QUERY = `
  query ListarProveedoresPaginated($filter: ProveedorPaginationInput) {
    listProveedoresPaginated(filter: $filter) {
      data {
        id
        razon_social
        direccion
        nombre_comercial
        ruc
        rubro
        estado
        tipo
        actividad
        correo
        telefono
        estado_sunat
        condicion
        agente_retencion
        sub_contrata
        distrito
        provincia
        departamento
        mediosPago {
          id
          entidad {
            id
            nombre
            abreviatura
          }
          nro_cuenta
          detalles
          titular
          validado
          mostrar
        }
        contactos {
          id
          nombres
          apellidos
          cargo
          telefono
        }
        estadisticasCotizaciones {
          proveedor_id
          razon_social
          totalCotizaciones
          cotizacionesPorEstado {
            estado
            cantidad
            porcentaje
          }
          primeraCotizacion
          ultimaCotizacion
        }
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const OBTENER_ESTADISTICAS_COTIZACIONES_QUERY = `
  query ObtenerEstadisticasCotizaciones($proveedorId: ID!) {
    getEstadisticasCotizaciones(proveedorId: $proveedorId) {
      proveedor_id
      razon_social
      totalCotizaciones
      cotizacionesPorEstado {
        estado
        cantidad
        porcentaje
      }
      primeraCotizacion
      ultimaCotizacion
    }
  }
`;

// ============================================================================
// MUTATIONS DE PROVEEDORES
// ============================================================================

export const CREAR_PROVEEDOR_MUTATION = `
  mutation CrearProveedor($input: ProveedorInput!) {
    addProveedor(
      razon_social: $input.razon_social
      ruc: $input.ruc
      direccion: $input.direccion
      nombre_comercial: $input.nombre_comercial
      rubro: $input.rubro
      estado: $input.estado
      tipo: $input.tipo
      actividad: $input.actividad
      correo: $input.correo
      telefono: $input.telefono
      estado_sunat: $input.estado_sunat
      condicion: $input.condicion
      agente_retencion: $input.agente_retencion
      sub_contrata: $input.sub_contrata
      distrito: $input.distrito
      provincia: $input.provincia
      departamento: $input.departamento
    ) {
      id
      razon_social
      direccion
      nombre_comercial
      ruc
      rubro
      estado
      tipo
      actividad
      correo
      telefono
      estado_sunat
      condicion
      agente_retencion
      sub_contrata
      distrito
      provincia
      departamento
    }
  }
`;

export const ACTUALIZAR_PROVEEDOR_MUTATION = `
  mutation ActualizarProveedor($id: ID!, $input: ProveedorInput!) {
    updateProveedor(
      id: $id
      razon_social: $input.razon_social
      ruc: $input.ruc
      direccion: $input.direccion
      nombre_comercial: $input.nombre_comercial
      rubro: $input.rubro
      estado: $input.estado
      tipo: $input.tipo
      actividad: $input.actividad
      correo: $input.correo
      telefono: $input.telefono
      estado_sunat: $input.estado_sunat
      condicion: $input.condicion
      agente_retencion: $input.agente_retencion
      sub_contrata: $input.sub_contrata
      distrito: $input.distrito
      provincia: $input.provincia
      departamento: $input.departamento
    ) {
      id
      razon_social
      direccion
      nombre_comercial
      ruc
      rubro
      estado
      tipo
      actividad
      correo
      telefono
      estado_sunat
      condicion
      agente_retencion
      sub_contrata
      distrito
      provincia
      departamento
    }
  }
`;

export const ELIMINAR_PROVEEDOR_MUTATION = `
  mutation EliminarProveedor($id: ID!) {
    deleteProveedor(id: $id) {
      id
      razon_social
      ruc
    }
  }
`;
