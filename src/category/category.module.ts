import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { CategoryEntity } from './infrastructure/entities/category-entity';
import { CategoryController } from './interfaces/controller/category.controller';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category-use-case';
import { GetAllCategoryUseCase } from './application/use-cases/get-all-category-use-case';
import { CreateCategoryUseCase } from './application/use-cases/create-category-use-case';
import { CATEGORY_REPOSITORY } from './domain/repository/category.repository';
import { TypeOrmCategoryRepository } from './infrastructure/repository/category-repository';
import { UpdateCategoryUseCase } from './application/use-cases/update-category-use-case';
import { FindByIdCategoryUseCase } from './application/use-cases/get-all-by-id-category-use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity])
],
  controllers: [
    CategoryController
],
  providers: [
    CreateCategoryUseCase,
    GetAllCategoryUseCase,
    DeleteCategoryUseCase,
    FindByIdCategoryUseCase,
    UpdateCategoryUseCase,

    { 
      provide: CATEGORY_REPOSITORY, 
      useClass: TypeOrmCategoryRepository 
    },
  ],
  exports: [CATEGORY_REPOSITORY],
})
export class CategoriesModule {}
