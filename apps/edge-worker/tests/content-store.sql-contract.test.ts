import { describe, expect, it } from 'vitest'

import { getUserInterests, listHotTopics, listOpportunities } from '../src/services/content'

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
  it('can prioritize interest-matched hot topics before generic high-heat topics', async () => {
    const calls: RecordedCall[] = []
    const db = createSqlSpyDb(calls)
    await listHotTopics(db, {
      limit: 8,
      interests: ['AI应用', '远程工作'],
    })

    expect(calls[0]?.sql).toContain('CASE')
    expect(calls[0]?.sql).toContain('match_score')
    expect(calls[0]?.sql).toContain('ranking_score')
    expect(calls[0]?.sql).toContain('title LIKE ?')
    expect(calls[0]?.sql).toContain("COALESCE(summary, '') LIKE ?")
    expect(calls[0]?.sql).toContain('categories LIKE ?')
    expect(calls[0]?.sql).toContain('tags LIKE ?')
    expect(calls[0]?.params).toEqual([
      '%AI应用%',
      '%AI应用%',
      '%AI应用%',
      '%AI应用%',
      '%远程工作%',
      '%远程工作%',
      '%远程工作%',
      '%远程工作%',
      '%AI应用%',
      '%AI应用%',
      '%AI应用%',
      '%AI应用%',
      '%远程工作%',
      '%远程工作%',
      '%远程工作%',
      '%远程工作%',
      8,
    ])
  })

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
