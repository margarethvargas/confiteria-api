import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './infrastructure/entities/product-entity';
import { Module } from '@nestjs/common';
import { ProductController } from './interfaces/controller/product.controller';
import { PRODUCT_REPOSITORY } from 'src/products/domain/repositories/product.repository';
import { TypeOrmProductRepository } from './infrastructure/repository/product.repository';
import { CreateProductUseCase } from './application/use-cases/create-product-use-case';
import { GetAllProductUseCase } from './application/use-cases/get-all-product-use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product-use-case';
import { FindByIdProductUseCase } from './application/use-cases/get-all-by-id-product-use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product-use-case';
import { CategoriesModule } from 'src/category/category.module';
import { S3Module } from 'infrastructure/aws/s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductEntity]),
    CategoriesModule,
    S3Module
],
  controllers: [
    ProductController
],
  providers: [
    CreateProductUseCase,
    GetAllProductUseCase,
    DeleteProductUseCase,
    FindByIdProductUseCase,
    UpdateProductUseCase,

    { 
      provide: PRODUCT_REPOSITORY, 
      useClass: TypeOrmProductRepository 
    },
  ],
})
export class ProductsModule {}
