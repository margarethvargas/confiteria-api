import { Inject } from "@nestjs/common";
import { CATEGORY_REPOSITORY, type CategoryRepository } from "src/category/domain/repository/category.repository";

export class CreateCategoryUseCase {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly categoryRepository: CategoryRepository,
    ) {}

    async execute(dto: { name: string }) {
        const category = {
            id: crypto.randomUUID(),
            name: dto.name,
        };
        return this.categoryRepository.create(category);
    }
}
