import { Inject, NotFoundException } from "@nestjs/common";
import { PRODUCT_REPOSITORY, type ProductRepository } from "src/products/domain/repositories/product.repository";

export class DeleteProductUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepository: ProductRepository,
    ) {}

    async execute (id: string): Promise<void>{
        const product = await this.productRepository.findById(id);
        if(!product){
            throw new NotFoundException(`Product with id ${id} not found`);
        }
        return this.productRepository.delete(id);

    }
}
