import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductRepository } from 'src/products/domain/repositories/product.repository';
import { Product } from 'src/products/domain/entities/product';
import { ProductEntity } from '../entities/product-entity';
import { Category } from 'src/category/domain/entities/category.entity';

@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async create(product: Product): Promise<Product> {
    const orm = new ProductEntity();

    orm.id = product.id;
    orm.name = product.name;
    orm.description = product.description;
    orm.price = product.price;
    orm.stock = product.stock;
    orm.categoryId = product.categoryId;

    await this.productRepository.save(orm);

    return product;
  }

  async findById(id: string): Promise<Product | null> {
    const orm = await this.productRepository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!orm) {
      return null;
    }
    return new Product(
      orm.id,
      orm.name,
      orm.description,
      orm.price,
      orm.stock,
      new Category(orm.category.id, orm.category.name),
    );
  }

  async findAll(): Promise<Product[]> {
    const orms = await this.productRepository.find({ relations: { category: true } });
    return orms.map(orm => {
        return new Product(
            orm.id,
            orm.name,
            orm.description,
            orm.price,
            orm.stock,
            new Category(orm.category.id, orm.category.name)
        );
    });
  }

  async update(product: Product): Promise<void> {
    await this.productRepository.save({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        categoryId: product.categoryId
    });
  } 
  async delete(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }
}
