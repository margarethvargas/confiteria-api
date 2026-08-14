# Diagrama de solución — API de Confitería

> Los bloques marcados como **MVP pendiente** representan los módulos planificados; Productos es el módulo que ya tiene una primera implementación.

## Arquitectura de la API

```mermaid
flowchart TB
    Client[Cliente web / móvil / POS] --> API[NestJS API<br/>/api/v1]

    API --> Cross[Elementos transversales]
    Cross --> Validation[ValidationPipe y DTOs]
    Cross --> Auth[Autenticación JWT<br/>y autorización por roles]
    Cross --> Errors[Filtros de errores]
    Cross --> Docs[Swagger y Health Check]

    API --> Products[Módulo Productos<br/>implementación inicial]
    API --> Categories[Módulo Categorías<br/>MVP pendiente]
    API --> Inventory[Módulo Inventario<br/>MVP pendiente]
    API --> Customers[Módulo Clientes<br/>MVP pendiente]
    API --> Sales[Módulo Ventas<br/>MVP pendiente]
    API --> Users[Módulo Usuarios<br/>MVP pendiente]

    Products --> ProductUseCases[Casos de uso]
    Products --> ProductRepository[Repositorio de productos]
    ProductRepository --> DB[(PostgreSQL)]

    Categories --> DB
    Inventory --> DB
    Customers --> DB
    Sales --> DB
    Users --> DB

    Sales --> Inventory
    Sales --> Products
    Sales --> Customers
    Sales --> Users
    Inventory --> Products
    Products --> Categories
```

## Capas dentro de cada módulo

```mermaid
flowchart LR
    Controller[Interfaces<br/>Controller HTTP] --> DTO[Application<br/>DTO y casos de uso]
    DTO --> Domain[Domain<br/>Entidades y reglas]
    DTO --> Port[Domain<br/>Contrato de repositorio]
    Infrastructure[Infrastructure<br/>TypeORM] --> Port
    Infrastructure --> DB[(PostgreSQL)]

    Controller -->|POST /products| DTO
```

## Flujo seguro de una venta

```mermaid
sequenceDiagram
    actor Seller as Vendedor / POS
    participant API as API NestJS
    participant Sales as Caso de uso de venta
    participant Products as Productos
    participant Inventory as Inventario
    participant DB as PostgreSQL

    Seller->>API: POST /sales con cliente y líneas
    API->>API: Autenticar, autorizar y validar DTO
    API->>Sales: Confirmar venta
    Sales->>DB: Iniciar transacción
    Sales->>Products: Verificar producto, estado y precio
    Products-->>Sales: Productos válidos
    Sales->>Inventory: Verificar stock disponible
    Inventory-->>Sales: Stock suficiente
    Sales->>DB: Guardar venta y detalles
    Sales->>Inventory: Descontar stock y registrar movimiento
    Inventory->>DB: Persistir movimiento
    Sales->>DB: Confirmar transacción
    Sales-->>API: Venta confirmada
    API-->>Seller: 201 Created con total calculado

    Note over Sales,DB: Si falla una validación, se revierte toda la transacción.
```

## Modelo de datos inicial

```mermaid
erDiagram
    CATEGORY ||--o{ PRODUCT : clasifica
    CUSTOMER ||--o{ SALE : realiza
    USER ||--o{ SALE : registra
    SALE ||--|{ SALE_ITEM : contiene
    PRODUCT ||--o{ SALE_ITEM : vendido_en
    PRODUCT ||--o{ INVENTORY_MOVEMENT : genera
    SALE ||--o{ INVENTORY_MOVEMENT : origina

    CATEGORY {
        uuid id PK
        varchar name UK
    }

    PRODUCT {
        uuid id PK
        varchar name
        text description
        decimal price
        integer stock
        uuid category_id FK
    }

    CUSTOMER {
        uuid id PK
        varchar name
        varchar document UK
        varchar email
    }

    USER {
        uuid id PK
        varchar name
        varchar email UK
        varchar password_hash
        varchar role
    }

    SALE {
        uuid id PK
        uuid customer_id FK
        uuid user_id FK
        varchar status
        decimal subtotal
        decimal discount
        decimal tax
        decimal total
        timestamptz created_at
    }

    SALE_ITEM {
        uuid id PK
        uuid sale_id FK
        uuid product_id FK
        integer quantity
        decimal unit_price
        decimal subtotal
    }

    INVENTORY_MOVEMENT {
        uuid id PK
        uuid product_id FK
        uuid sale_id FK
        varchar type
        integer quantity
        varchar reason
        timestamptz created_at
    }
```

