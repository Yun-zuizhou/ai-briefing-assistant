export async function queryOne<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const stmt = db.prepare(sql).bind(...params)
  const result = await stmt.first()
  return result as T | null
}

export async function queryAll<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const stmt = db.prepare(sql).bind(...params)
  const result = await stmt.all()
  return result.results as T[]
}

export async function execute(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result> {
  const stmt = db.prepare(sql).bind(...params)
  return await stmt.run()
}

export async function executeSql(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result> {
  const stmt = db.prepare(sql).bind(...params)
  return await stmt.run()
}

export async function batchQuery<T>(
  db: D1Database,
  statements: Array<{ sql: string; params?: unknown[] }>
): Promise<T[][]> {
  const stmts = statements.map((s) => db.prepare(s.sql).bind(...(s.params || [])))
  const results = await db.batch<T>(stmts)
  return results.map((r) => r.results)
}
