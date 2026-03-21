/**
 * Safe page/limit/skip for Prisma (avoids NaN from empty or invalid query params).
 */
export function parsePageLimit(query, { defaultLimit = 10, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(String(query.page ?? 1), 10) || 1)
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(String(query.limit ?? defaultLimit), 10) || defaultLimit)
  )
  const skip = (page - 1) * limit
  return { page, limit, skip }
}
