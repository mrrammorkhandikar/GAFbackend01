import './lib/loadEnv.js'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

async function checkData() {
  try {
    const campaigns = await prisma.campaign.findMany();
    console.log('Campaigns:', JSON.stringify(campaigns, null, 2));
    
    const events = await prisma.event.findMany();
    console.log('Events:', JSON.stringify(events, null, 2));

    const volunteerOpportunities = await prisma.volunteerOpportunity.findMany();
    console.log('Volunteer Opportunities:', JSON.stringify(volunteerOpportunities, null, 2));

    const careers = await prisma.career.findMany();
    console.log('Careers:', JSON.stringify(careers, null, 2));
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
