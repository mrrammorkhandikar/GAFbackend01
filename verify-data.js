
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.volunteerOpportunity.count();
  console.log(`Volunteer Opportunities count: ${count}`);
  const opportunities = await prisma.volunteerOpportunity.findMany();
  console.log(JSON.stringify(opportunities, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
