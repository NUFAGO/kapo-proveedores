/**

 * 🔗 GRAPHQL - QUERIES Y MUTATIONS

 *

 * Responsabilidad: Definir contratos GraphQL para comunicación con backend

 * Flujo: Importado por hooks → Define qué datos pedir al backend

 *

 * Estructura:

 * - queries/: Consultas de lectura (GET)

 * - mutations/: Operaciones de escritura (CREATE, UPDATE, DELETE)

 *

 * [Futuro] Contendrá:

 * - Queries: getActivos, getCategorias, getDashboardData

 * - Mutations: createActivo, updateActivo, deleteActivo

 */



// Exportar queries y mutations
export * from './queries';
export * from './mutations';

