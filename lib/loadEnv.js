/**
 * Loads environment variables from backend/.env only.
 * Import this module before any code that reads process.env (e.g. Prisma, Supabase).
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { warnIfVercelNeedsPooler } from './checkVercelDatabaseUrl.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env')

dotenv.config({ path: envPath })
warnIfVercelNeedsPooler()
