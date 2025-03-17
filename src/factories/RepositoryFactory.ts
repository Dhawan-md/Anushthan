import { Service } from "typedi";
import { ObjectLiteral, Repository } from "typeorm";

import { AppDataSource } from "../config/database";

@Service()
export class RepositoryFactory {
  private cache = new Map<string, Repository<any>>();

  getRepository<T extends ObjectLiteral>(entity: new () => T): Repository<T> {
    const entityName = entity.name;

    if (this.cache.has(entityName)) {
      return this.cache.get(entityName) as Repository<T>;
    }

    const repository = AppDataSource.getRepository(entity);
    this.cache.set(entityName, repository);

    return repository;
  }
}
