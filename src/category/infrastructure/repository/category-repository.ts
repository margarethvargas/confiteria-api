import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryRepository } from 'src/category/domain/repository/category.repository';
import { CategoryEntity } from '../entities/category-entity';
import { Repository } from 'typeorm';
import { Category } from 'src/category/domain/entities/category.entity';

@Injectable()
export class TypeOrmCategoryRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(category: Category): Promise<Category> {
    const orm = new CategoryEntity();

    orm.id = category.id;
    orm.name = category.name;

    await this.categoryRepository.save(orm);

    return category;
  }

  async findAll(): Promise<Category[]> {
    const orms = await this.categoryRepository.find();
    return orms.map(orm => {
        return new Category(
            orm.id,
            orm.name
        );
    });
    }

    async findById(id: string): Promise<Category | null> {
        const orm = await this.categoryRepository.findOne({ where: { id } });
        if (!orm) {
            return null;
        }
        return new Category(orm.id, orm.name);
    }

    async update(category: Category): Promise<void>{
      await this.categoryRepository.update(category.id, {
        name: category.name
      });
    }

    async delete(id: string): Promise<void>{
      await this.categoryRepository.delete(id);
    }
}
