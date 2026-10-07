import { z } from 'zod';
import { AppError } from '../../errors/app-error.js';

export const statusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);
export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
const title = z.string().trim().min(1, 'Enter a title.').max(160, 'Use 160 characters or fewer.');
const description = z
  .string()
  .trim()
  .max(5000)
  .transform((value) => value || null)
  .nullable();
const dueAt = z.iso
  .datetime({ offset: true })
  .transform((value) => new Date(value))
  .nullable();
export const idSchema = z.strictObject({ id: z.uuid() });
export const createTodoSchema = z.strictObject({
  title,
  description: description.optional(),
  priority: prioritySchema.default('MEDIUM'),
  dueAt: dueAt.optional(),
});
export const updateTodoSchema = z
  .strictObject({
    title: title.optional(),
    description: description.optional(),
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    dueAt: dueAt.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Supply at least one mutable field.');
export const listTodosSchema = z
  .strictObject({
    q: z.string().trim().max(160).default(''),
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    sort: z
      .enum(['createdAt_desc', 'createdAt_asc', 'dueAt', 'priority_desc'])
      .default('createdAt_desc'),
    page: z.coerce.number().int().min(1).max(2147483647).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    ({ page, limit }) =>
      Number.isSafeInteger((page - 1) * limit) && (page - 1) * limit <= 2147483647,
    'Pagination offset is too large.',
  );
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
export type ListTodosInput = z.infer<typeof listTodosSchema>;

export function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new AppError(
      'VALIDATION_ERROR',
      'Request validation failed.',
      result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    );
  return result.data;
}
