import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CreateCategoryDto } from "src/category/application/dto/create-category.dto";
import { UpdateCategoryDto } from "src/category/application/dto/update-category.dto";
import { CreateCategoryUseCase } from "src/category/application/use-cases/create-category-use-case";
import { DeleteCategoryUseCase } from "src/category/application/use-cases/delete-category-use-case";
import { FindByIdCategoryUseCase } from "src/category/application/use-cases/get-all-by-id-category-use-case";
import { GetAllCategoryUseCase } from "src/category/application/use-cases/get-all-category-use-case";
import { UpdateCategoryUseCase } from "src/category/application/use-cases/update-category-use-case";

@Controller('categories')
export class CategoryController {
    constructor(
        private readonly createCategory: CreateCategoryUseCase,
        private readonly getAllCategory: GetAllCategoryUseCase,
        private readonly getCategoryById: FindByIdCategoryUseCase,
        private readonly updateCategory: UpdateCategoryUseCase,
        private readonly deleteCategory: DeleteCategoryUseCase,
    ) {}

    @Post()
    create(@Body() dto: CreateCategoryDto) {
    return this.createCategory.execute(dto);
    }

    @Get()
    findAll() {
    return this.getAllCategory.execute();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.getCategoryById.execute(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.updateCategory.execute(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.deleteCategory.execute(id);
    }
  }

