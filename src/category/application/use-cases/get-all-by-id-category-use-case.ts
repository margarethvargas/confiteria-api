import { Inject, NotFoundException } from "@nestjs/common";
import { CATEGORY_REPOSITORY, type CategoryRepository } from "src/category/domain/repository/category.repository";

export class FindByIdCategoryUseCase {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly categoryRepository: CategoryRepository,
    ) {}

    async execute(id: string) {
        const category = await this.categoryRepository.findById(id);

        if (!category) {
            throw new NotFoundException(`Category with id ${id} not found`);
        }   
        return category;
    }
}
