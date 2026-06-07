import {
  groupRecordsByTimePeriod,
  type VaultRecord
} from './groupRecordsByTimePeriod'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

describe('groupRecordsByTimePeriod', () => {
  const NOW = new Date('2026-04-23T12:00:00Z').getTime()

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(NOW)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const make = (overrides: Partial<VaultRecord>): VaultRecord => ({
    id: Math.random().toString(36).slice(2),
    type: 'login',
    updatedAt: NOW,
    createdAt: NOW,
    ...overrides
  })

  it('returns empty array for null or empty input', () => {
    expect(groupRecordsByTimePeriod(null)).toEqual([])
    expect(groupRecordsByTimePeriod(undefined)).toEqual([])
    expect(groupRecordsByTimePeriod([])).toEqual([])
  })

  it('splits Favorites and All Items when sorting by title', () => {
    const records: VaultRecord[] = [
      make({ id: 'a', isFavorite: true }),
      make({ id: 'b' }),
      make({ id: 'c', isFavorite: true }),
      make({ id: 'd' })
    ]
    const sections = groupRecordsByTimePeriod(records, {
      key: 'data.title',
      direction: 'asc'
    })
    expect(sections.map((s) => s.key)).toEqual(['favorites', 'all'])
    expect(sections[0].data.map((r) => r.id)).toEqual(['a', 'c'])
    expect(sections[1].data.map((r) => r.id)).toEqual(['b', 'd'])
  })

  it('buckets by time period, placing Favorites first', () => {
    const records: VaultRecord[] = [
      make({ id: 'today', updatedAt: NOW - HOUR }),
      make({ id: 'yesterday', updatedAt: NOW - 1 * DAY - HOUR }),
      make({ id: 'thisWeek', updatedAt: NOW - 3 * DAY }),
      make({ id: 'thisMonth', updatedAt: NOW - 15 * DAY }),
      make({ id: 'older', updatedAt: NOW - 120 * DAY }),
      make({ id: 'fav', updatedAt: NOW - HOUR, isFavorite: true })
    ]
    const sections = groupRecordsByTimePeriod(records, {
      key: 'updatedAt',
      direction: 'desc'
    })
    expect(sections.map((s) => s.key)).toEqual([
      'favorites',
      'today',
      'yesterday',
      'thisWeek',
      'thisMonth',
      'older'
    ])
    expect(sections[0].data.map((r) => r.id)).toEqual(['fav'])
    expect(sections[1].data.map((r) => r.id)).toEqual(['today'])
    expect(sections[5].data.map((r) => r.id)).toEqual(['older'])
  })

  it('reverses time sections when direction is ascending', () => {
    const records: VaultRecord[] = [
      make({ id: 'today', updatedAt: NOW - HOUR }),
      make({ id: 'older', updatedAt: NOW - 120 * DAY })
    ]
    const sections = groupRecordsByTimePeriod(records, {
      key: 'updatedAt',
      direction: 'asc'
    })
    expect(sections.map((s) => s.key)).toEqual(['older', 'today'])
  })

  it('preserves input order for title sort regardless of direction', () => {
    const records: VaultRecord[] = [
      make({ id: 'b' }),
      make({ id: 'c', isFavorite: true }),
      make({ id: 'a' })
    ]
    const asc = groupRecordsByTimePeriod(records, {
      key: 'data.title',
      direction: 'asc'
    })
    const desc = groupRecordsByTimePeriod(records, {
      key: 'data.title',
      direction: 'desc'
    })
    expect(asc).toEqual(desc)
    expect(asc.map((s) => s.key)).toEqual(['favorites', 'all'])
    expect(asc[0].data.map((r) => r.id)).toEqual(['c'])
    expect(asc[1].data.map((r) => r.id)).toEqual(['b', 'a'])
  })

  it('skips sections with no records', () => {
    const records: VaultRecord[] = [make({ updatedAt: NOW - HOUR })]
    const sections = groupRecordsByTimePeriod(records, {
      key: 'updatedAt',
      direction: 'desc'
    })
    expect(sections.map((s) => s.key)).toEqual(['today'])
  })
})
