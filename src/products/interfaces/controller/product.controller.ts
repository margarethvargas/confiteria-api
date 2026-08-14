import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CreateProductDto } from "src/products/application/dto/create-product.dto";
import { UpdateProductDto } from "src/products/application/dto/update-product.dto";
import { CreateProductUseCase } from "src/products/application/use-cases/create-product-use-case";
import { DeleteProductUseCase } from "src/products/application/use-cases/delete-product-use-case";
import { FindByIdProductUseCase } from "src/products/application/use-cases/get-all-by-id-product-use-case";
import { GetAllProductUseCase } from "src/products/application/use-cases/get-all-product-use-case";
import { UpdateProductUseCase } from "src/products/application/use-cases/update-product-use-case";

@Controller('products')
export class ProductController {
    constructor(
        private readonly createProduct: CreateProductUseCase,
        private readonly getAllProduct: GetAllProductUseCase,
        private readonly getProductById: FindByIdProductUseCase,
        private readonly updateProduct: UpdateProductUseCase,
        private readonly deleteProduct: DeleteProductUseCase,
    ) {}

    @Post()
    create(@Body() dto: CreateProductDto) {
    return this.createProduct.execute(dto);
    }

    @Get()
    findAll() {
    return this.getAllProduct.execute();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.getProductById.execute(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
        return this.updateProduct.execute(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.deleteProduct.execute(id);
    }
  }



