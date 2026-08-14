# Plan de desarrollo — API de Confitería

## 1. Objetivo

Construir una API REST para administrar catálogo, inventario, clientes, ventas y usuarios de una confitería. La base actual utiliza NestJS, TypeScript, TypeORM y PostgreSQL, y ya contiene creación y listado de productos.

## 2. Alcance del MVP

El primer lanzamiento debe permitir:

- Gestionar categorías y productos con precio y existencias.
- Consultar el catálogo disponible.
- Registrar clientes.
- Registrar ventas con varios productos.
- Descontar inventario de forma segura al confirmar una venta.
- Consultar ventas y sus detalles.
- Proteger operaciones administrativas con usuarios y roles.

Quedan fuera inicialmente: compras a proveedores, facturación electrónica, promociones complejas, pagos integrados, reportes avanzados y aplicación web.

## 3. Fase 0 — Descubrimiento

### Tareas

1. Identificar roles: administrador, vendedor y, si aplica, almacenero.
2. Acordar reglas: moneda, impuestos, descuentos, anulaciones y stock mínimo.
3. Definir estados de venta, por ejemplo: `PENDING`, `CONFIRMED` y `CANCELLED`.
4. Acordar campos obligatorios para productos, clientes y comprobantes.
5. Determinar requisitos de auditoría, respaldo y despliegue.

### Entregables

- Historias de usuario priorizadas.
- Reglas de negocio aprobadas.
- Criterios de aceptación por módulo.

## 4. Fase 1 — Fundaciones técnicas

1. Separar configuración por entorno y añadir `.env.example`.
2. Validar variables de entorno al iniciar la aplicación.
3. Configurar un `ValidationPipe` global con transformación y rechazo de campos no permitidos.
4. Estandarizar respuestas de error con filtros de excepciones.
5. Configurar migraciones de TypeORM y sustituir `synchronize: true` en producción.
6. Versionar rutas, por ejemplo `/api/v1`.
7. Añadir documentación Swagger y un endpoint de salud.
8. Mantener la convención actual: `domain`, `application`, `infrastructure` e `interfaces`.

**Terminado cuando:** la API inicia con configuración válida, informa errores de configuración claramente y documenta sus rutas.

## 5. Fase 2 — Catálogo e inventario

### Categorías

- Crear, listar, editar y eliminar o desactivar categorías.
- Evitar nombres duplicados.
- Impedir eliminar una categoría con productos, o exigir una reasignación explícita.

### Productos

- Completar CRUD: consultar por ID, actualizar y eliminar o desactivar.
- Validar nombre, descripción, precio positivo, stock entero no negativo y categoría existente.
- Añadir filtros por categoría, disponibilidad y texto, con paginación.
- Usar un tipo decimal para importes y evitar cálculos con `float`.

### Inventario

- Registrar movimientos de entrada, salida, ajuste y venta.
- Guardar motivo, fecha, usuario responsable y documento origen.
- Mantener stock actual coherente con los movimientos.
- Exponer consultas para stock mínimo.

**Terminado cuando:** no hay stock negativo y cada cambio de inventario queda trazable.

## 6. Fase 3 — Clientes, usuarios y seguridad

### Clientes

- Crear, consultar, actualizar y desactivar clientes.
- Validar documento, correo y teléfono según las reglas acordadas.
- Permitir cliente genérico solo si es una política del negocio.

### Usuarios y acceso

- Gestionar usuarios con contraseñas cifradas mediante un algoritmo seguro.
- Implementar inicio de sesión y tokens con expiración.
- Proteger rutas mediante guardas de autenticación.
- Autorizar por roles: administrador, vendedor y almacenero, si corresponde.
- No exponer contraseñas, hashes ni secretos en respuestas o registros.

**Terminado cuando:** cada usuario accede exclusivamente a las operaciones permitidas por su rol.

## 7. Fase 4 — Ventas

### Modelo de datos

- `Sale`: cliente, vendedor, estado, subtotal, descuento, impuesto, total y fechas.
- `SaleItem`: producto, cantidad, precio unitario aplicado y subtotal.
- `InventoryMovement`: salida de inventario vinculada a cada venta confirmada.

### Flujo de confirmación

1. Recibir cliente y líneas de venta.
2. Verificar que los productos existen, están activos y tienen stock.
3. Obtener precios y calcular importes en el servidor.
4. Crear venta y sus detalles.
5. Descontar existencias y registrar movimientos.
6. Confirmar todo en una transacción de base de datos.
7. Devolver la venta confirmada y sus importes finales.

### Reglas críticas

- El cliente no controla precios ni totales.
- No se confirma una venta si alguna línea no tiene stock.
- Una cancelación define explícitamente si repone inventario y queda auditada.
- La confirmación evita duplicados mediante idempotencia o una referencia única.

**Terminado cuando:** venta, detalle y descuento de stock se guardan de forma atómica.

## 8. Fase 5 — Consultas y reportes básicos

1. Historial de ventas por fecha, estado, cliente y vendedor.
2. Detalle de una venta.
3. Productos con bajo stock.
4. Resumen diario: ventas, unidades y total.
5. Paginación, ordenamiento y límites de consulta en listados.

## 9. Pruebas y calidad

### Pruebas unitarias

- Reglas de dominio: precio, stock, descuentos y estados.
- Casos de uso: productos, inventario y ventas.
- Servicios de autenticación y autorización.

### Integración y E2E

- Rutas protegidas y control de roles.
- Validación de DTOs y formato de errores.
- Venta con stock suficiente, insuficiente y cancelación.
- Base de datos de prueba aislada.

### Automatización

Ejecutar `npm run build`, `npm run lint`, `npm run test` y `npm run test:e2e` en integración continua.

## 10. Seguridad y operación

1. Mantener secretos fuera del repositorio y proporcionar `.env.example`.
2. Restringir CORS a orígenes autorizados.
3. Limitar solicitudes en autenticación y rutas sensibles.
4. Registrar eventos relevantes sin datos sensibles.
5. Configurar copias de seguridad y restauración verificada de PostgreSQL.
6. Preparar Docker y ejecutar migraciones de forma controlada al desplegar.
7. Monitorizar salud, errores y capacidad de la base de datos.

## 11. Orden recomendado

1. Fundaciones técnicas y migraciones.
2. Categorías y CRUD completo de productos.
3. Inventario y movimientos.
4. Clientes.
5. Usuarios, autenticación y roles.
6. Ventas transaccionales.
7. Consultas, reportes y endurecimiento operativo.

## 12. Próximo incremento sugerido

Completar el catálogo antes de iniciar ventas:

1. Crear `CategoriesModule` y relacionarlo con productos.
2. Añadir DTOs de actualización, validaciones y `ValidationPipe` global.
3. Implementar obtener, actualizar y desactivar productos.
4. Crear la primera migración para categorías y productos.
5. Añadir pruebas unitarias y E2E para ese flujo.

Este incremento deja una base estable para inventario y ventas.
