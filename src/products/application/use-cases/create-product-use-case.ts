import { CATEGORY_REPOSITORY, type CategoryRepository } from "src/category/domain/repository/category.repository";
import { PRODUCT_REPOSITORY, type ProductRepository } from "src/products/domain/repositories/product.repository";
import { v4 as uuidv4 } from 'uuid';
import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "src/products/domain/entities/product";
import { Inject, NotFoundException } from "@nestjs/common";

export class CreateProductUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: ProductRepository,
        @Inject(CATEGORY_REPOSITORY)
        private readonly categoryRepository: CategoryRepository,
    ) {}

    async execute(dto: CreateProductDto) {
    const category = await this.categoryRepository.findById(dto.categoryId);
    if (!category) {
        throw new NotFoundException(`Category with id ${dto.categoryId} not found`);
    }

    const product = new Product(
        uuidv4(),
        dto.name,
        dto.description,
        dto.price,
        dto.stock,
        category
    );
    return await this.productRepository.create(product);
    }
}
