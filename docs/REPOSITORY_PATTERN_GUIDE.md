# Repository Pattern Implementation Guide

## Overview

The repository pattern has been implemented to abstract data access logic from business logic. This provides better separation of concerns, testability, and maintainability.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Controllers (HTTP Layer)                       │
│  - Handle HTTP requests/responses               │
│  - Validate input                               │
│  - Call services                                │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Services (Business Logic Layer)                │
│  - Implement business rules                     │
│  - Orchestrate operations                       │
│  - Call repositories                            │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Repositories (Data Access Layer)               │
│  - Abstract database operations                 │
│  - Implement queries                            │
│  - Handle data transformations                  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Database (PostgreSQL via Prisma)               │
└─────────────────────────────────────────────────┘
```

## Benefits

### 1. Testability
```typescript
// Easy to mock repositories in tests
const mockCustomerRepo = {
  findById: jest.fn().mockResolvedValue(mockCustomer),
  create: jest.fn().mockResolvedValue(mockCustomer),
};

const service = new CustomerService(mockCustomerRepo);
```

### 2. Maintainability
- Database logic centralized in repositories
- Easy to switch ORMs or databases
- Consistent data access patterns

### 3. Reusability
- Common queries defined once
- Used across multiple services
- Reduces code duplication

### 4. Type Safety
- Full TypeScript support
- Interface-based contracts
- Compile-time error checking

## Structure

```
src/
└── repositories/
    ├── interfaces/           # Repository contracts
    │   ├── IBaseRepository.ts
    │   ├── ICustomerRepository.ts
    │   └── IProductRepository.ts
    ├── implementations/      # Concrete implementations
    │   ├── BaseRepository.ts
    │   ├── CustomerRepository.ts
    │   └── ProductRepository.ts
    └── index.ts              # Export all repositories
```

## Usage

### Service Layer (NEW)

```typescript
import { customerRepository } from '../repositories';
import ApiError from '../utils/ApiError';

export class CustomerService {
  constructor(
    private customerRepo = customerRepository // Dependency injection
  ) {}

  async create(data: any) {
    // Check for existing customer
    const existing = await this.customerRepo.findByEmail(
      data.org_id, 
      data.email
    );

    if (existing) {
      throw ApiError.conflict('Customer already exists');
    }

    // Create customer
    return await this.customerRepo.create({
      ...data,
      status: data.status || 'active',
    });
  }

  async getById(id: string) {
    const customer = await this.customerRepo.findByIdWithRelations(id);
    
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    return customer;
  }

  async list(orgId: string, options: any) {
    return await this.customerRepo.findWithCursor(orgId, options);
  }
}

export default new CustomerService();
```

### Service Layer (OLD - Direct Prisma)

```typescript
import prisma from '../config/database';

export class CustomerService {
  async create(data: any) {
    return await prisma.customers.create({ data }); // Direct DB access
  }

  async getById(id: string) {
    return await prisma.customers.findUnique({ where: { id } });
  }
}
```

## Creating a New Repository

### Step 1: Define Interface

```typescript
// src/repositories/interfaces/IProductRepository.ts
import { IBaseRepository } from './IBaseRepository';
import { products } from '@prisma/client';

export interface IProductRepository extends IBaseRepository<products> {
  findByOrganization(orgId: string): Promise<products[]>;
  findActiveProducts(orgId: string): Promise<products[]>;
  updatePrice(id: string, price: number): Promise<products>;
}
```

### Step 2: Implement Repository

```typescript
// src/repositories/implementations/ProductRepository.ts
import { PrismaClient, products } from '@prisma/client';
import { BaseRepository } from './BaseRepository';
import { IProductRepository } from '../interfaces/IProductRepository';

export class ProductRepository 
  extends BaseRepository<products> 
  implements IProductRepository 
{
  constructor(prisma: PrismaClient) {
    super(prisma, 'products');
  }

  async findByOrganization(orgId: string): Promise<products[]> {
    return await this.findMany({ org_id: orgId });
  }

  async findActiveProducts(orgId: string): Promise<products[]> {
    return await this.findMany({ 
      org_id: orgId, 
      status: 'active' 
    });
  }

  async updatePrice(id: string, price: number): Promise<products> {
    return await this.update(id, { base_price: price } as any);
  }
}
```

### Step 3: Register in Index

```typescript
// src/repositories/index.ts
import { ProductRepository } from './implementations/ProductRepository';

export const productRepository = new ProductRepository(prisma);
export { ProductRepository } from './implementations/ProductRepository';
export * from './interfaces/IProductRepository';
```

### Step 4: Update Service

```typescript
// src/services/product.service.ts
import { productRepository } from '../repositories';

export class ProductService {
  constructor(private productRepo = productRepository) {}

  async getActiveProducts(orgId: string) {
    return await this.productRepo.findActiveProducts(orgId);
  }
}
```

## Base Repository Methods

All repositories inherit these methods from `BaseRepository`:

| Method | Description | Example |
|--------|-------------|---------|
| `create(data)` | Create new entity | `repo.create({ name: 'Test' })` |
| `findById(id)` | Find by ID | `repo.findById('uuid')` |
| `findMany(where, options)` | Find multiple | `repo.findMany({ status: 'active' })` |
| `findFirst(where)` | Find first match | `repo.findFirst({ email: 'test@example.com' })` |
| `update(id, data)` | Update entity | `repo.update('uuid', { name: 'Updated' })` |
| `delete(id)` | Delete entity | `repo.delete('uuid')` |
| `count(where)` | Count entities | `repo.count({ status: 'active' })` |
| `exists(where)` | Check existence | `repo.exists({ email: 'test@example.com' })` |
| `paginate(where, page, limit)` | Paginated list | `repo.paginate({}, 1, 10)` |
| `transaction(fn)` | Execute in transaction | `repo.transaction(async (tx) => {...})` |

## Testing with Repositories

### Unit Test Example

```typescript
import { CustomerService } from '../services/customer.service';
import { CustomerRepository } from '../repositories';

describe('CustomerService', () => {
  let service: CustomerService;
  let mockRepo: jest.Mocked<CustomerRepository>;

  beforeEach(() => {
    mockRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    } as any;

    service = new CustomerService(mockRepo);
  });

  it('should create customer', async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ id: '1', name: 'Test' } as any);

    const result = await service.create({
      org_id: 'org-1',
      email: 'test@example.com',
      name: 'Test',
    });

    expect(mockRepo.findByEmail).toHaveBeenCalledWith('org-1', 'test@example.com');
    expect(mockRepo.create).toHaveBeenCalled();
    expect(result.name).toBe('Test');
  });

  it('should throw error if customer exists', async () => {
    mockRepo.findByEmail.mockResolvedValue({ id: '1' } as any);

    await expect(
      service.create({ org_id: 'org-1', email: 'test@example.com' })
    ).rejects.toThrow('Customer already exists');
  });
});
```

### Integration Test Example

```typescript
import { customerRepository } from '../repositories';
import prisma from '../config/database';

describe('CustomerRepository Integration', () => {
  beforeEach(async () => {
    await prisma.customers.deleteMany();
  });

  it('should create and retrieve customer', async () => {
    const customer = await customerRepository.create({
      org_id: 'test-org',
      email: 'test@example.com',
      name: 'Test Customer',
    });

    expect(customer.id).toBeDefined();

    const retrieved = await customerRepository.findById(customer.id);
    expect(retrieved?.email).toBe('test@example.com');
  });
});
```

## Migration Strategy

### Phase 1: Add Repositories (Current)
- ✅ Repository layer implemented
- ✅ Example repository created (CustomerRepository)
- ⏳ Services still use direct Prisma calls

### Phase 2: Update Services Gradually
1. Refactor high-traffic services first
2. Update CustomerService to use CustomerRepository
3. Add tests for new implementation
4. Deploy and monitor

### Phase 3: Complete Migration
1. Create repositories for all entities
2. Update all services to use repositories
3. Remove direct Prisma imports from services
4. Update documentation

### Phase 4: Testing & Optimization
1. Add comprehensive unit tests
2. Add integration tests
3. Optimize frequently used queries
4. Add query result caching

## Best Practices

### DO ✅
- Keep repositories focused on data access only
- Use repositories in services, not controllers
- Write tests for custom repository methods
- Use transactions for multi-step operations
- Cache frequently accessed data in repositories

### DON'T ❌
- Don't put business logic in repositories
- Don't call repositories directly from controllers
- Don't expose Prisma client outside repositories
- Don't skip the interface definition
- Don't bypass repositories with direct Prisma calls

## Performance Considerations

### Query Optimization
```typescript
// Good: Select only needed fields
async findBasicInfo(id: string) {
  return await this.getModel().findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

// Bad: Fetch all fields
async findBasicInfo(id: string) {
  return await this.findById(id); // Gets all fields including relations
}
```

### Batch Operations
```typescript
// Good: Single query
async findByIds(ids: string[]): Promise<customers[]> {
  return await this.findMany({
    id: { in: ids },
  });
}

// Bad: Multiple queries
async findByIds(ids: string[]): Promise<customers[]> {
  return await Promise.all(
    ids.map(id => this.findById(id))
  );
}
```

## Future Enhancements

- [ ] Add query result caching in repositories
- [ ] Implement read replicas for read-heavy queries
- [ ] Add query performance monitoring
- [ ] Create generic search functionality
- [ ] Add audit logging at repository level
- [ ] Implement soft delete globally

## References

- [Repository Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
