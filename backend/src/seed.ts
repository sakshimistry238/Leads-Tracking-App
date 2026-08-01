/**
 * Seed script – populates the SQLite DB with rich sample leads and notes.
 * Run with: npm run seed
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LeadsService } from './leads/leads.service';
import { NotesService } from './notes/notes.service';
import { LeadPriority, LeadSource, LeadStatus } from './leads/lead.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leadsService = app.get(LeadsService);
  const notesService = app.get(NotesService);

  const seedLeads = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1-555-0101',
      status: LeadStatus.NEW,
      priority: LeadPriority.HIGH,
      source: LeadSource.WEBSITE,
      score: 85,
      dealValue: 12000,
      tags: ['enterprise', 'hot'],
      pinned: true,
    },
    {
      name: 'Bob Williams',
      email: 'bob@example.com',
      phone: '+1-555-0102',
      status: LeadStatus.CONTACTED,
      priority: LeadPriority.MEDIUM,
      source: LeadSource.LINKEDIN,
      score: 60,
      dealValue: 5000,
      tags: ['referral'],
      pinned: false,
    },
    {
      name: 'Carol Martinez',
      email: 'carol@example.com',
      phone: '+1-555-0103',
      status: LeadStatus.QUALIFIED,
      priority: LeadPriority.URGENT,
      source: LeadSource.REFERRAL,
      score: 92,
      dealValue: 25000,
      tags: ['enterprise', 'q4'],
      pinned: true,
    },
    {
      name: 'David Lee',
      email: 'david@example.com',
      phone: '+1-555-0104',
      status: LeadStatus.LOST,
      priority: LeadPriority.LOW,
      source: LeadSource.COLD_CALL,
      score: 20,
      dealValue: 2000,
      tags: [],
      pinned: false,
    },
    {
      name: 'Eva Chen',
      email: 'eva@example.com',
      phone: '+1-555-0105',
      status: LeadStatus.CONTACTED,
      priority: LeadPriority.HIGH,
      source: LeadSource.EVENT,
      score: 74,
      dealValue: 8500,
      tags: ['event', 'warm'],
      pinned: false,
    },
    {
      name: 'Frank Rivera',
      email: 'frank@example.com',
      phone: '+1-555-0106',
      status: LeadStatus.NEW,
      priority: LeadPriority.MEDIUM,
      source: LeadSource.EMAIL,
      score: 45,
      dealValue: 3200,
      tags: ['newsletter'],
      pinned: false,
    },
  ];

  console.log('🌱 Seeding database...');

  for (const leadData of seedLeads) {
    try {
      const lead = await leadsService.create(leadData);
      console.log(
        `  ✅ Created lead: ${lead.name} (id=${lead.id}, status=${lead.status}, priority=${lead.priority})`,
      );

      // Add sample notes to the first three leads
      if (lead.id <= 3) {
        await notesService.create(lead.id, {
          content: `Initial contact made with ${lead.name}. They expressed interest in our enterprise plan.`,
        });
        await notesService.create(lead.id, {
          content: `Follow-up scheduled for next week. Requested a product demo.`,
        });
        if (lead.id === 1) {
          await notesService.create(lead.id, {
            content: `Demo completed. Decision expected by end of month. Budget confirmed at $${lead.dealValue?.toLocaleString()}.`,
          });
        }
        console.log(`     📝 Added notes to ${lead.name}`);
      }
    } catch (err: any) {
      if (err?.status === 409) {
        console.log(`  ⚠️  Skipped (already exists): ${leadData.email}`);
      } else {
        throw err;
      }
    }
  }

  console.log('\n✔ Seed complete! 6 leads added.\n');
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
