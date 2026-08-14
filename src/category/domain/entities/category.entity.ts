export class Category {
  id: string;
  name: string;

  constructor(id: string, name: string) {
    if (!name.trim()) {
      throw new Error('Category name cannot be empty');
    }

    this.id = id;
    this.name = name;
  }
}
