/**
 * Base Repository Implementation using Prisma ORM
 * 
 * Provides common database operations that can be extended by specific repositories.
 * This implementation uses Prisma Client but can be replaced with any other ORM.
 */

import { PrismaClient } from '@prisma/client';
import { IBaseRepository, FindManyOptions, PaginatedResult } from '../interfaces/IBaseRepository';

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  /**
   * Get the Prisma model delegate
   */
  protected getModel(): any {
    return (this.prisma as any)[this.modelName];
  }

  async create(data: Partial<T>): Promise<T> {
    return await this.getModel().create({ data });
  }

  async findById(id: string): Promise<T | null> {
    return await this.getModel().findUnique({ where: { id } });
  }

  async findMany(where: any, options?: FindManyOptions): Promise<T[]> {
    return await this.getModel().findMany({
      where,
      ...options,
    });
  }

  async findFirst(where: any): Promise<T | null> {
    return await this.getModel().findFirst({ where });
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return await this.getModel().update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return await this.getModel().delete({ where: { id } });
  }

  async count(where: any): Promise<number> {
    return await this.getModel().count({ where });
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  async transaction<R>(fn: (repo: this) => Promise<R>): Promise<R> {
    return await this.prisma.$transaction(async (tx) => {
      const txRepo = Object.create(this);
      txRepo.prisma = tx;
      return await fn(txRepo);
    });
  }

  /**
   * Helper method for offset-based pagination
   */
  async paginate(
    where: any,
    page: number = 1,
    limit: number = 10,
    options?: FindManyOptions
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.findMany(where, { ...options, skip, take: limit }),
      this.count(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Soft delete implementation (if entity has deleted_at field)
   */
  async softDelete(id: string): Promise<T> {
    return await this.update(id, { deleted_at: new Date() } as any);
  }

  /**
   * Restore soft deleted entity
   */
  async restore(id: string): Promise<T> {
    return await this.update(id, { deleted_at: null } as any);
  }
}
