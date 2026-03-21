import { PrismaClient } from '@prisma/client'

// Reuse one client per serverless isolate / dev HMR. DATABASE_URL must use
// ?pgbouncer=true when using Supabase transaction pooler (port 6543).
const globalForPrisma = globalThis
const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
