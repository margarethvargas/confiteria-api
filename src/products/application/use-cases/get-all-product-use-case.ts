import { Inject } from "@nestjs/common";
import { PRODUCT_REPOSITORY, type ProductRepository } from "src/products/domain/repositories/product.repository";

export class GetAllProductUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: ProductRepository,
    ) {}
    async execute() {
        return await this.productRepository.findAll();
    }
}