# Repaso del módulo Products

Este documento explica el código actual de `products` en la API de confitería. El módulo está organizado con una separación inspirada en arquitectura limpia:

```text
HTTP -> Interfaces (controller) -> Aplicación (casos de uso) -> Dominio (reglas y contrato)
                                                          -> Infraestructura (TypeORM/PostgreSQL)
```

La idea principal es que el dominio no conoce NestJS ni TypeORM. Las partes externas se conectan mediante la interfaz `ProductRepository`.

## Qué representa un producto

Un producto tiene los datos `id`, `name`, `description`, `price`, `stock` y una `category`. En la base de datos, la categoría se guarda mediante `categoryId`, que es una llave foránea hacia la tabla de categorías.

Los endpoints disponibles son:

| Método | Ruta | Acción |
| --- | --- | --- |
| POST | `/products` | Crea un producto. |
| GET | `/products` | Lista todos los productos. |
| GET | `/products/:id` | Busca un producto por UUID. |
| PATCH | `/products/:id` | Actualiza parcialmente un producto. |
| DELETE | `/products/:id` | Elimina un producto. |

## Configuración que afecta al módulo

### `src/main.ts`

Es el punto de arranque de NestJS. `NestFactory.create(AppModule)` crea la aplicación usando el módulo raíz. Después registra un `ValidationPipe` global; por eso los DTO de products se validan automáticamente antes de que el controlador reciba los datos.

- `whitelist: true`: elimina propiedades que no estén declaradas en el DTO.
- `forbidNonWhitelisted: true`: además de eliminarlas, responde con error si el cliente envía propiedades no permitidas.
- `transform: true`: transforma los datos según los tipos y decoradores disponibles.
- `app.listen(process.env.PORT ?? 3000)`: inicia el servidor en el puerto indicado por `PORT`, o en el 3000 si no existe.

### `src/app.module.ts`

Es el módulo raíz. Carga el archivo `.env` con `ConfigModule` y configura TypeORM para PostgreSQL de forma asíncrona, leyendo `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS` y `DB_NAME`.

- `autoLoadEntities: true` detecta entidades registradas por los módulos, incluida `ProductEntity`.
- `synchronize: true` ajusta el esquema de la base de datos según las entidades. Es práctico en desarrollo, pero no conviene usarlo en producción porque puede alterar tablas sin migraciones controladas.
- Importa `ProductsModule`, que hace disponibles sus rutas y dependencias.

## Módulo y ensamblaje de dependencias

### `src/products/product.module.ts`

Este archivo reúne las piezas de products y le indica a NestJS cómo crearlas.

- `TypeOrmModule.forFeature([ProductEntity])` registra el repositorio TypeORM de la entidad `ProductEntity` dentro de este módulo.
- `CategoriesModule` se importa porque crear o cambiar un producto necesita consultar categorías y, por tanto, usar `CATEGORY_REPOSITORY`.
- `controllers: [ProductController]` publica las rutas HTTP.
- `providers` registra los cinco casos de uso para que NestJS pueda inyectarlos en el controlador.
- La asociación `{ provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository }` es la inyección de dependencias clave: cuando un caso de uso pide el token `PRODUCT_REPOSITORY`, NestJS entrega una instancia de `TypeOrmProductRepository`.

Así, los casos de uso dependen del contrato del dominio y no directamente de TypeORM.

## Capa de dominio

La capa de dominio describe qué es un producto y qué operaciones de persistencia necesita. No contiene controladores, DTO, decoradores de Nest ni columnas de base de datos.

### `src/products/domain/entities/product.ts`

Define la clase de negocio `Product`. Su constructor recibe todos los valores necesarios y protege invariantes:

- el nombre no puede quedar vacío tras aplicar `trim()`;
- la descripción tampoco puede quedar vacía;
- `price` y `stock` no pueden ser negativos;
- siempre debe existir una categoría.

Si una regla falla, lanza un `Error`. Esto es una segunda barrera después de los DTO: incluso si un producto se construyera desde otro lugar que no fuera HTTP, no debería existir en un estado inválido.

La propiedad `category` almacena una instancia del dominio `Category`. El getter `categoryId` simplifica obtener el identificador para guardarlo en la base de datos sin exponer una lógica distinta en cada repositorio.

El método `decreaseStock(quantity)` descuenta existencias. Si la cantidad supera el stock actual, lanza `Insufficient stock`. Actualmente ningún caso de uso de products lo utiliza; queda preparado para un futuro flujo de venta o pedido. Como mejora futura, debería validarse también que `quantity` sea positiva.

### `src/products/domain/repositories/product.repository.ts`

Define la interfaz `ProductRepository`, es decir, el contrato que necesita la aplicación para persistir productos:

- `create(product)`: crea y devuelve el producto.
- `findById(id)`: busca uno y devuelve `null` si no existe.
- `findAll()`: devuelve todos los productos.
- `update(product)`: persiste cambios sin devolver contenido.
- `delete(id)`: elimina por identificador.

El contrato usa solamente `Product`, no `ProductEntity`. De ese modo puede implementarse con TypeORM, memoria, otro ORM o un servicio externo sin cambiar los casos de uso.

`PRODUCT_REPOSITORY` es un token de texto usado por NestJS para inyectar la implementación correcta. Una interfaz de TypeScript no existe durante la ejecución, por eso no puede inyectarse directamente.

## Capa de aplicación

Esta capa organiza las acciones que puede ejecutar el sistema. Cada caso de uso coordina reglas y repositorios, pero no sabe cómo llegan los datos por HTTP ni cómo se escriben las consultas SQL.

### DTO: `src/products/application/dto/create-product.dto.ts`

`CreateProductDto` representa el cuerpo esperado para `POST /products`:

```json
{
  "name": "Torta de chocolate",
  "description": "Torta para seis porciones",
  "price": 45.5,
  "stock": 12,
  "categoryId": "uuid-de-una-categoria-existente"
}
```

Sus decoradores se ejecutan mediante el `ValidationPipe` global:

- `@IsString()` y `@IsNotEmpty()` exigen texto no vacío para nombre y descripción.
- `@IsNumber()` y `@Min(0)` exigen un número igual o mayor que cero para precio y stock.
- `@IsUUID()` exige que `categoryId` tenga formato UUID.

El DTO verifica la forma y los tipos de la petición. La existencia real de la categoría se comprueba después, en el caso de uso.

### DTO: `src/products/application/dto/update-product.dto.ts`

`UpdateProductDto` define los campos que puede recibir `PATCH /products/:id`. Tiene los mismos criterios de validez que el DTO de creación, pero cada propiedad usa `@IsOptional()`.

Eso permite enviar solo los campos que se quieren cambiar. Por ejemplo:

```json
{ "stock": 20 }
```

Si se incluye una propiedad, sí debe cumplir sus demás validaciones. Por ejemplo, `{ "price": -1 }` es inválido, igual que al crear.

### `src/products/application/use-cases/create-product-use-case.ts`

`CreateProductUseCase` implementa la creación. Recibe dos dependencias por token:

- `PRODUCT_REPOSITORY` para guardar productos.
- `CATEGORY_REPOSITORY` para comprobar la categoría solicitada.

En `execute(dto)` primero ejecuta `categoryRepository.findById(dto.categoryId)`. Si la categoría no existe, lanza `NotFoundException`, y NestJS la convierte en una respuesta HTTP 404.

Si existe, genera el UUID del producto con `uuidv4()`, construye el objeto de dominio `Product` y lo guarda con `productRepository.create(product)`. Construir `Product` vuelve a aplicar las reglas de negocio de nombre, descripción, precio, stock y categoría.

### `src/products/application/use-cases/get-all-product-use-case.ts`

`GetAllProductUseCase` inyecta `PRODUCT_REPOSITORY`. Su método `execute()` delega en `findAll()` y devuelve la lista. No añade reglas adicionales porque listar no requiere validación de negocio extra.

### `src/products/application/use-cases/get-all-by-id-product-use-case.ts`

Aunque el archivo se llama `get-all-by-id...`, su clase `FindByIdProductUseCase` busca un único producto. En `execute(id)` consulta `findById(id)`.

Si el repositorio devuelve `null`, lanza `NotFoundException`, que da un 404 con el mensaje correspondiente. Si existe, retorna el producto.

Una mejora de legibilidad sería renombrar el archivo a `find-by-id-product-use-case.ts`, para que coincida con lo que hace y con el nombre de la clase.

### `src/products/application/use-cases/update-product-use-case.ts`

`UpdateProductUseCase` implementa la actualización parcial de un producto:

1. Busca el producto actual; si falta, responde 404.
2. Toma la categoría actual como valor por defecto.
3. Si llegó `dto.categoryId`, busca esa categoría. Si no existe, responde 404; si existe, la usa como nueva categoría.
4. Crea un nuevo `Product` con el mismo `id` y los valores del DTO cuando existan. Para los campos omitidos usa los valores actuales con `??`.
5. Llama a `productRepository.update(updatedProduct)` y devuelve el producto actualizado.

El operador `??` es importante: usa el valor de la derecha solo si el valor de la izquierda es `null` o `undefined`. Por tanto, no confunde el número `0` con un campo ausente; permite actualizar precio o stock a cero.

Crear un nuevo objeto `Product` hace que también se vuelvan a verificar las reglas del dominio antes de guardar.

### `src/products/application/use-cases/delete-product-use-case.ts`

`DeleteProductUseCase` busca primero el producto. Si no existe, lanza 404. Si existe, ejecuta `productRepository.delete(id)`.

La comprobación previa evita que una eliminación de un id inexistente parezca exitosa. El método está tipado como `Promise<void>`, por lo que la respuesta HTTP exitosa no tiene cuerpo; NestJS responde normalmente con 200 si el controlador no define otro código.

## Capa de infraestructura

Esta capa sabe cómo se persisten y recuperan los datos con TypeORM y PostgreSQL. Convierte entre el modelo de base de datos y el modelo de dominio.

### `src/products/infrastructure/entities/product-entity.ts`

`ProductEntity` describe la tabla `products` para TypeORM:

- `@Entity('products')` asigna la clase a esa tabla.
- `@PrimaryColumn('uuid') id` es la clave primaria; el UUID se genera antes, en el caso de uso.
- `@Column()` en nombre, descripción, stock y categoryId crea columnas simples.
- `price` es `numeric(10,2)`: hasta 10 dígitos en total y 2 decimales. PostgreSQL devuelve los valores `numeric` como texto con frecuencia; el `transformer.from` los convierte a `number` al leerlos.

La relación:

```ts
@ManyToOne(() => CategoryEntity, (category) => category.products, {
  onDelete: 'RESTRICT',
})
@JoinColumn({ name: 'categoryId' })
category!: CategoryEntity;
```

expresa que muchos productos pertenecen a una categoría. `@JoinColumn` indica que la columna de unión es `categoryId`. `onDelete: 'RESTRICT'` impide eliminar una categoría que aún tiene productos asociados, para no dejar productos sin categoría.

### `src/products/infrastructure/repository/product.repository.ts`

`TypeOrmProductRepository` es la implementación concreta del contrato del dominio. `@Injectable()` permite que NestJS la cree e `@InjectRepository(ProductEntity)` inyecta el repositorio TypeORM para la tabla `products`.

Sus métodos hacen el mapeo entre `Product` y `ProductEntity`:

- `create`: copia los valores desde el dominio a un `ProductEntity`, guarda con `save()` y devuelve el objeto de dominio original.
- `findById`: usa `findOne` con `relations: { category: true }`. Cargar la relación es necesario porque el constructor de `Product` exige una categoría. Si no hay fila retorna `null`; si la hay, crea un `Product` y una `Category` de dominio.
- `findAll`: consulta todos los registros, también con su categoría, y transforma cada fila a `Product`.
- `update`: usa `save()` con el `id` y todos los campos actuales. TypeORM actualiza la fila existente porque el identificador ya existe.
- `delete`: ejecuta `delete(id)` sobre la base de datos.

El repositorio no devuelve directamente `ProductEntity`. Eso evita que detalles como decoradores TypeORM o el nombre de columnas salgan de infraestructura.

## Capa de interfaces

### `src/products/interfaces/controller/product.controller.ts`

`ProductController` adapta HTTP a los casos de uso. `@Controller('products')` agrega el prefijo `/products` a todas sus rutas. NestJS inyecta los cinco casos de uso mediante el constructor.

Cada decorador de método indica el verbo HTTP y cada decorador de parámetro extrae los datos:

- `@Post()` + `@Body()` llama a creación con un `CreateProductDto`.
- `@Get()` llama al listado.
- `@Get(':id')` + `@Param('id')` obtiene el id de la URL y busca uno.
- `@Patch(':id')` + `@Body()` actualiza parcialmente con `UpdateProductDto`.
- `@Delete(':id')` elimina el recurso indicado.

El controlador no contiene reglas de negocio ni consultas de base de datos; solo dirige la petición al caso de uso adecuado. Si un DTO falla, el controlador ni siquiera llega a ejecutarse porque el `ValidationPipe` ya respondió con 400. Si un caso de uso lanza `NotFoundException`, NestJS responde 404.

## Recorrido de una petición

Ejemplo: `POST /products`.

```text
Cliente
  -> ProductController.create(dto)
  -> CreateProductUseCase.execute(dto)
  -> CategoryRepository.findById(categoryId)
  -> new Product(...)  [reglas de negocio]
  -> TypeOrmProductRepository.create(product)
  -> ProductEntity / PostgreSQL
  -> respuesta JSON
```

Antes del controlador, `ValidationPipe` valida el cuerpo contra `CreateProductDto`. Si el cuerpo es válido pero la categoría no existe, el caso de uso devuelve el 404. En una lectura, el recorrido se invierte: TypeORM obtiene `ProductEntity`, el repositorio la transforma a `Product` y el controlador devuelve ese objeto como JSON.

## Resumen por responsabilidades

| Capa | Archivos | Responsabilidad |
| --- | --- | --- |
| Dominio | `product.ts`, `product.repository.ts` | Reglas del producto y contrato de persistencia. |
| Aplicación | DTO y `use-cases/*` | Valida el formato de entrada y orquesta operaciones. |
| Infraestructura | `product-entity.ts`, `product.repository.ts` | Mapea y persiste datos con TypeORM/PostgreSQL. |
| Interfaces | `product.controller.ts` | Expone la API HTTP y delega a aplicación. |
| Composición | `product.module.ts` | Conecta implementaciones, casos de uso y controlador. |

La dependencia ideal siempre apunta hacia el centro: interfaz e infraestructura dependen del dominio/aplicación; el dominio no depende de ellas. Por eso sería posible reemplazar TypeORM por otra forma de almacenamiento sin reescribir los casos de uso de products.
