import { Inject, NotFoundException } from "@nestjs/common";
import { UpdateProductDto } from "src/products/application/dto/update-product.dto";
import { Product } from "src/products/domain/entities/product";
import { PRODUCT_REPOSITORY, type ProductRepository } from "src/products/domain/repositories/product.repository";
import { CATEGORY_REPOSITORY, type CategoryRepository } from "src/category/domain/repository/category.repository";

export class UpdateProductUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: ProductRepository,
        @Inject(CATEGORY_REPOSITORY)
        private readonly categoryRepository: CategoryRepository,
    ) {}

    async execute(id: string, dto: UpdateProductDto): Promise<Product> {
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new NotFoundException(`Product with id ${id} not found`);
        }

        let category = product.category;
        if (dto.categoryId) {
            const requestedCategory = await this.categoryRepository.findById(dto.categoryId);
            if (!requestedCategory) {
                throw new NotFoundException(`Category with id ${dto.categoryId} not found`);
            }
            category = requestedCategory;
        }

        const updatedProduct = new Product(
            product.id,
            dto.name ?? product.name,
            dto.description ?? product.description,
            dto.price ?? product.price,
            dto.stock ?? product.stock,
            category,
        );

        await this.productRepository.update(updatedProduct);
        return updatedProduct;
    }
}
