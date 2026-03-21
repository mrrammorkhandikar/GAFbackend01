import { PrismaClient } from '@prisma/client'

// Single shared PrismaClient instance for the whole app.
// Prevents multiple connection pools and pooler issues (e.g. Supabase).
const prisma = new PrismaClient()

export default prisma
