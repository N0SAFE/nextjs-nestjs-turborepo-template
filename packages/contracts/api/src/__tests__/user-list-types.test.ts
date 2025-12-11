import { userSchema } from '@/common/user';
import { createSortingConfigSchema, standard } from '@repo/orpc-utils';
import { describe, it, expectTypeOf } from 'vitest';
import { z } from 'zod/v4';


// Define pagination configuration schema using Zod
const paginationConfigSchema = z.object({
  defaultLimit: z.number().default(20),
  maxLimit: z.number().default(100),
  includeOffset: z.boolean().default(true),
});

// Define sorting configuration schema for user fields
const sortingFieldsArray = ["createdAt", "name", "email", "updatedAt"] as const;
const sortingConfigSchema = createSortingConfigSchema(sortingFieldsArray);

// Define filtering configuration schema
const filteringConfigSchema = z.object({
  fields: z.object({
    id: z.custom<typeof userSchema.shape.id>(() => true),
    email: z.object({
      schema: z.custom<typeof userSchema.shape.email>(() => true),
      operators: z.array(z.enum(["eq", "like", "ilike"])),
    }),
    name: z.object({
      schema: z.custom<typeof userSchema.shape.name>(() => true),
      operators: z.array(z.enum(["eq", "like", "ilike"])),
    }),
    emailVerified: z.custom<typeof userSchema.shape.emailVerified>(() => true),
    createdAt: z.object({
      schema: z.custom<typeof userSchema.shape.createdAt>(() => true),
      operators: z.array(z.enum(["gt", "gte", "lt", "lte", "between"])),
    }),
  }),
});

// Create standard operations builder for users
const userOps = standard(userSchema, "user");

// Create enhanced list contract - pass Zod schemas directly
export const userListContract = userOps.list({
  pagination: paginationConfigSchema,
  sorting: sortingConfigSchema,
  filtering: filteringConfigSchema,
})

describe('userListContract Type Inference', () => {
  it('should have properly typed input schema', () => {
    // Extract input type from the contract
    type InputType = z.infer<typeof userListContract.inputSchema>;

    // Pagination fields should be present and typed
    expectTypeOf<InputType>().toHaveProperty('limit');
    expectTypeOf<InputType['limit']>().toEqualTypeOf<number | undefined>();
    
    expectTypeOf<InputType>().toHaveProperty('offset');
    expectTypeOf<InputType['offset']>().toEqualTypeOf<number | undefined>();
    
    expectTypeOf<InputType>().toHaveProperty('page');
    expectTypeOf<InputType['page']>().toEqualTypeOf<number | undefined>();

    // Sorting fields should be present and typed
    expectTypeOf<InputType>().toHaveProperty('sortBy');
    expectTypeOf<InputType['sortBy']>().toEqualTypeOf<'createdAt' | 'name' | 'email' | 'updatedAt' | undefined>();
    
    expectTypeOf<InputType>().toHaveProperty('sortDirection');
    expectTypeOf<InputType['sortDirection']>().toEqualTypeOf<'asc' | 'desc' | undefined>();

    // Filtering fields should be present and typed
    expectTypeOf<InputType>().toHaveProperty('email');
    expectTypeOf<InputType['email']>().toEqualTypeOf<string | undefined>();
    
    expectTypeOf<InputType>().toHaveProperty('name');
    expectTypeOf<InputType['name']>().toEqualTypeOf<string | undefined>();
    
    expectTypeOf<InputType>().toHaveProperty('name_like');
    expectTypeOf<InputType['name_like']>().toEqualTypeOf<string | undefined>();
    
    expectTypeOf<InputType>().toHaveProperty('email_like');
    expectTypeOf<InputType['email_like']>().toEqualTypeOf<string | undefined>();

    // Search fields should be present and typed
    expectTypeOf<InputType>().toHaveProperty('search');
    expectTypeOf<InputType['search']>().toEqualTypeOf<string | undefined>();
  });

  it('should have properly typed output schema with data and meta', () => {
    // Extract output type from the contract
    type OutputType = z.infer<typeof userListContract.outputSchema>;

    // Should have data property
    expectTypeOf<OutputType>().toHaveProperty('data');
    expectTypeOf<OutputType['data']>().toBeArray();

    // Data items should have user structure
    type DataItem = OutputType['data'][number];
    expectTypeOf<DataItem>().toHaveProperty('id');
    expectTypeOf<DataItem>().toHaveProperty('email');
    expectTypeOf<DataItem>().toHaveProperty('name');
    expectTypeOf<DataItem>().toHaveProperty('emailVerified');
    expectTypeOf<DataItem>().toHaveProperty('image');
    expectTypeOf<DataItem>().toHaveProperty('createdAt');
    expectTypeOf<DataItem>().toHaveProperty('updatedAt');

    // Should have meta property
    expectTypeOf<OutputType>().toHaveProperty('meta');
    
    // Meta should NOT be Record<string, never>
    type MetaType = OutputType['meta'];
    expectTypeOf<MetaType>().not.toEqualTypeOf<Record<string, never>>();
    
    // Meta should have pagination fields
    expectTypeOf<MetaType>().toHaveProperty('total');
    expectTypeOf<MetaType['total']>().toEqualTypeOf<number>();
    
    expectTypeOf<MetaType>().toHaveProperty('limit');
    expectTypeOf<MetaType['limit']>().toEqualTypeOf<number>();
    
    expectTypeOf<MetaType>().toHaveProperty('offset');
    expectTypeOf<MetaType['offset']>().toEqualTypeOf<number>();
    
    expectTypeOf<MetaType>().toHaveProperty('page');
    expectTypeOf<MetaType['page']>().toEqualTypeOf<number>();
    
    expectTypeOf<MetaType>().toHaveProperty('totalPages');
    expectTypeOf<MetaType['totalPages']>().toEqualTypeOf<number>();
    
    expectTypeOf<MetaType>().toHaveProperty('hasMore');
    expectTypeOf<MetaType['hasMore']>().toEqualTypeOf<boolean>();

    // Meta should have sorting fields
    expectTypeOf<MetaType>().toHaveProperty('sortBy');
    expectTypeOf<MetaType['sortBy']>().toEqualTypeOf<'createdAt' | 'name' | 'email' | 'updatedAt' | null>();
    
    expectTypeOf<MetaType>().toHaveProperty('sortDirection');
    expectTypeOf<MetaType['sortDirection']>().toEqualTypeOf<'asc' | 'desc' | null>();

    // Meta should have filtering fields
    expectTypeOf<MetaType>().toHaveProperty('appliedFilters');
    expectTypeOf<MetaType>().toHaveProperty('filterCount');
    expectTypeOf<MetaType['filterCount']>().toEqualTypeOf<number>();

    // Meta should have search fields
    expectTypeOf<MetaType>().toHaveProperty('searchQuery');
    expectTypeOf<MetaType['searchQuery']>().toEqualTypeOf<string | null>();
  });

  it('should NOT have Record<string, unknown> as input type', () => {
    type InputType = z.infer<typeof userListContract.inputSchema>;
    
    // Input should NOT be Record<string, unknown>
    expectTypeOf<InputType>().not.toEqualTypeOf<Record<string, unknown>>();
    
    // Input should NOT be unique symbol
    expectTypeOf<InputType>().not.toEqualTypeOf<symbol>();
  });

  it('should NOT have Record<string, never> as meta type', () => {
    type OutputType = z.infer<typeof userListContract.outputSchema>;
    type MetaType = OutputType['meta'];
    
    // Meta should NOT be empty Record
    expectTypeOf<MetaType>().not.toEqualTypeOf<Record<string, never>>();
    
    // Meta should have at least one property
    expectTypeOf<keyof MetaType>().not.toEqualTypeOf<never>();
  });

  it('should allow creating valid input', () => {
    // Should compile without errors
    const validInput: z.infer<typeof userListContract.inputSchema> = {
      limit: 20,
      offset: 0,
      page: 1,
      sortBy: 'name',
      sortDirection: 'asc',
      email: 'test@example.com',
      name_like: 'John',
      search: 'test',
    };

    expectTypeOf(validInput).toMatchTypeOf<{
      limit?: number;
      offset?: number;
      page?: number;
      sortBy?: 'createdAt' | 'name' | 'email' | 'updatedAt';
      sortDirection?: 'asc' | 'desc';
      email?: string;
      name?: string;
      name_like?: string;
      email_like?: string;
      search?: string;
    }>();
  });

  it('should allow creating valid output', () => {
    // Should compile without errors
    const validOutput: z.infer<typeof userListContract.outputSchema> = {
      data: [
        {
          id: '1',
          email: 'user@example.com',
          name: 'John Doe',
          emailVerified: false,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      meta: {
        total: 1,
        limit: 20,
        offset: 0,
        page: 1,
        totalPages: 1,
        hasMore: false,
        sortBy: 'name',
        sortDirection: 'asc',
        appliedFilters: { email: 'user@example.com' },
        filterCount: 1,
        searchQuery: null,
      },
    };

    expectTypeOf(validOutput).toMatchTypeOf<{
      data: Array<{
        id: string;
        email: string;
        name: string | null;
        emailVerified: boolean;
        image: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>;
      meta: {
        total: number;
        limit: number;
        offset: number;
        page: number;
        totalPages: number;
        hasMore: boolean;
        sortBy: 'createdAt' | 'name' | 'email' | 'updatedAt' | null;
        sortDirection: 'asc' | 'desc' | null;
        appliedFilters: Record<string, unknown>;
        filterCount: number;
        searchQuery: string | null;
      };
    }>();
  });
});
