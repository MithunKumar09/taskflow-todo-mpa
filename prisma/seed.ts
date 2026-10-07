import { loadEnvironment, readEnvironment } from '../apps/api/src/config/env.js';
import { createDatabase } from '../apps/api/src/plugins/database.js';

loadEnvironment();
const database = createDatabase(readEnvironment().DATABASE_URL);
const titles = [
  'Prepare assignment walkthrough',
  'Review API validation',
  'Plan the next release',
  'Read about PostgreSQL indexes',
  'Improve keyboard navigation',
  'Verify mobile layouts',
  'Write the release notes',
  'Review migration history',
];
try {
  for (let index = 0; index < titles.length; index++) {
    const id = `d6c8a521-9000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    const status = index % 3 === 0 ? 'COMPLETED' : index % 3 === 1 ? 'IN_PROGRESS' : 'PENDING';
    await database.todo.upsert({
      where: { id },
      update: {},
      create: {
        id,
        title: titles[index]!,
        description: 'Keep the work focused, clear, and ready to share.',
        status,
        priority: index % 3 === 0 ? 'HIGH' : index % 3 === 1 ? 'MEDIUM' : 'LOW',
        completedAt: status === 'COMPLETED' ? new Date('2026-10-07T09:00:00Z') : null,
        dueAt: index % 2 === 0 ? new Date('2026-10-15T12:00:00Z') : null,
      },
    });
  }
  console.log('Demo seed applied; existing records were preserved.');
} finally {
  await database.$disconnect();
}
