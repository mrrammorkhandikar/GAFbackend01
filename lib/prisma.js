import { PrismaClient } from '@prisma/client'

// One client per Vercel isolate / Node process. Without this, serverless can
// open too many DB connections and hit pooler limits → random 500s.
// DATABASE_URL (Supabase pooler :6543) must include ?pgbouncer=true and ideally
// &connection_limit=1 for serverless — see backend/.env.example
const globalForPrisma = globalThis
const prisma = globalForPrisma.prisma ?? new PrismaClient()
globalForPrisma.prisma = prisma

export default prisma
