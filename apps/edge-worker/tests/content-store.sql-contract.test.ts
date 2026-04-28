import { describe, expect, it } from 'vitest'

import { getUserInterests, listOpportunities } from '../src/services/content'

type RecordedCall = {
  sql: string
  params: unknown[]
}

function createSqlSpyDb(recorder: RecordedCall[]): D1Database {
  return {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          recorder.push({ sql, params })
          return {
            all: async () => ({ results: [] }),
            first: async () => null,
            run: async () => ({ success: true, meta: { last_row_id: 0 } }),
          }
        },
      }
    },
  } as unknown as D1Database
}

describe('contentStore SQL contracts', () => {
  it('uses case-insensitive active filter for opportunities', async () => {
    const calls: RecordedCall[] = []
    const db = createSqlSpyDb(calls)
    await listOpportunities(db, 6)

    expect(calls[0]?.sql).toContain("lower(status) = 'active'")
  })

  it('uses case-insensitive active filter for user interests', async () => {
    const calls: RecordedCall[] = []
    const db = createSqlSpyDb(calls)
    await getUserInterests(db, 1)

    expect(calls[0]?.sql).toContain("lower(status) = 'active'")
  })
})
