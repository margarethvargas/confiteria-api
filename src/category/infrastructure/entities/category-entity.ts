import { ProductEntity } from "src/products/infrastructure/entities/product-entity";
import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";

@Entity('categories')
export class CategoryEntity {
@PrimaryColumn('uuid')
  id!: string;

@Column()
  name!: string;

  @OneToMany(() => ProductEntity, (product) => product.category)
  products!: ProductEntity[];
}

