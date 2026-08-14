import { Inject, NotFoundException } from "@nestjs/common";
import { UpdateCategoryDto } from "src/category/application/dto/update-category.dto";
import { Category } from "src/category/domain/entities/category.entity";
import { CATEGORY_REPOSITORY, type CategoryRepository } from "src/category/domain/repository/category.repository";

export class UpdateCategoryUseCase {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly categoryRepository: CategoryRepository,
    ) {}

    async execute(id: string, dto: UpdateCategoryDto): Promise<Category> {
        const category = await this.categoryRepository.findById(id);
        if (!category) {
            throw new NotFoundException(`Category with id ${id} not found`);
        }

        const updatedCategory = new Category(id, dto.name ?? category.name);
        await this.categoryRepository.update(updatedCategory);
        return updatedCategory;
    }
}
