import { Category } from 'src/category/domain/entities/category.entity';

export class Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: Category;

  constructor(
    id: string,
    name: string,
    description: string,
    price: number,
    stock: number,
    category: Category,
  ) {
    if (!name.trim()) {
      throw new Error('Product name cannot be empty');
    }

    if (!description.trim()) {
      throw new Error('Product description cannot be empty');
    }

    if (price < 0) {
      throw new Error('Price cannot be negative');
    }

    if (stock < 0) {
      throw new Error('Stock cannot be negative');
    }

    if (!category) {
      throw new Error('Product category is required');
    }

    this.id = id;
    this.name = name;
    this.description = description;
    this.price = price;
    this.stock = stock;
    this.category = category;
  }

  get categoryId(): string {
    return this.category.id;
  }

  decreaseStock(quantity: number): void {
    if (quantity > this.stock) {
      throw new Error('Insufficient stock');
    }
    this.stock -= quantity;
  }
}
