# 🚀 KAPO Proveedores

Sistema integral de gestión de proveedores, órdenes de compra y solicitudes de pago para la plataforma **KAPO**.

---

## 🧩 Descripción

**KAPO Proveedores** es una solución robusta diseñada para centralizar y eficientizar la relación operativa y financiera con proveedores. El sistema separa claramente el **Portal de Proveedores** del **Panel Administrativo**, facilitando la gestión operativa y financiera en un solo ecosistema.

* **Proveedores:** Registro y perfiles detallados.
* **Órdenes de Compra:** Seguimiento desde la creación hasta la entrega.
* **Solicitudes de Pago:** Automatización de flujos financieros.
* **Documentación:** Validación de archivos y cumplimiento normativo.
* **Flujos Operativos:** Procesos configurables de revisión, aprobación y ejecución.

---

## ⚙️ Características Principales

### 🧾 Gestión Documental

* Tipos de documento 100% configurables.
* Plantillas personalizadas con soporte para carga de archivos.
* Validación de documentos integrada en los flujos de trabajo.

### 💰 Solicitudes de Pago

* Configuración dinámica de tipos de pago.
* Vinculación directa con Órdenes de Compra (OC).
* Flujo de aprobación multinivel.

### 🏗️ Órdenes de Compra

* Registro, seguimiento y trazabilidad completa.
* Asociación inteligente con la base de datos de proveedores.
* Validación estricta por el área de operaciones.

### 👤 Portal de Proveedores

* **Dashboard Personalizado:** Vista rápida de estados y tareas pendientes.
* **Self-Service:** Subida de documentación y seguimiento de órdenes.
* **Transparencia:** Consulta de estados de pago y notificaciones en tiempo real.

### 🛡️ Seguridad

* Autenticación mediante **JWT (JSON Web Tokens)**.
* Implementación de **Refresh Tokens** para sesiones seguras.
* Control de acceso basado en roles (**RBAC**).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| **Backend** | Node.js, GraphQL, Apollo Server |
| **Base de Datos** | MongoDB |
| **Infraestructura** | Google Cloud Storage (Archivos) |
| **Gestor de Paquetes** | pnpm |

---

## 🧱 Arquitectura del Proyecto

```text
kapo-proveedores/
├── src/
│   ├── app/
│   │   ├── (interno)/       # Panel administrativo (Admin/Staff)
│   │   ├── (portal)/        # Portal de proveedores (Externo)
│   │   └── api/             # Endpoints y GraphQL Handlers
│   ├── components/          # Componentes UI reutilizables
│   ├── hooks/               # Custom React hooks
│   ├── graphql/             # Queries, Mutations y Schemas
│   ├── services/            # Lógica de negocio (Business Logic)
│   ├── repositories/        # Capa de acceso a datos (Data Access)
│   ├── middleware/          # Auth, RBAC y validaciones
│   ├── lib/                 # Utilidades (JWT, helpers, configs)
│   └── types/               # Definiciones de TypeScript globales
├── public/                  # Assets estáticos
├── docs/                    # Documentación técnica adicional
└── README.md


## Flujo Principal del Sistema
Plaintext
[ Orden de Compra ] 
        │
        ▼
[ Asignación a Proveedor ]
        │
        ▼
[ Ejecución del Servicio / Entrega ]
        │
        ▼
[ Validación por Operaciones ] ───┐
                                  │ (Rechazo)
        ▼                         │
[ Solicitud de Pago ] <───────────┘
        │
        ▼
[ Aprobación Administrativa ]
        │
        ▼
[ Ejecución de Pago (FIN) ]
```
---
## Módulos del Sistema
Proveedores: Directorio y gestión de maestros.

Órdenes de Compra: Control de suministros y servicios.

Solicitudes de Pago: Gestión de tesorería y facturación.

Tipos de Documento & Plantillas: Motor de reglas documentales.

Configuraciones: Parámetros globales del sistema.
---
## 🔐 Seguridad y Cumplimiento
JWT: Expiración controlada y rotación de tokens.

Middleware: Capas de protección de rutas y validación de sesión.

RBAC: Control granular de permisos según el tipo de usuario.

Sanitización: Validación de inputs para prevenir vulnerabilidades comunes.
