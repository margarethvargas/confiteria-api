import { CategoryEntity } from "src/category/infrastructure/entities/category-entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";

@Entity('products')
export class ProductEntity {
@PrimaryColumn('uuid')
  id!: string;

@Column()
  name!: string;

@Column()
  description!: string;

@Column({ type: 'numeric', precision: 10, scale: 2, transformer: {
  to: (value: number) => value,
  from: (value: string) => Number(value),
} })
  price!: number;

@Column()
  stock!: number;

@Column()
  categoryId!: string;

  @ManyToOne(() => CategoryEntity, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'categoryId' })
  category!: CategoryEntity;
  
}
