import { describe, expect, it } from 'vitest'
import { runTravelSearch } from './search'

const query = 'Find me a peaceful place for a romantic dinner where we can see the sunset under €90'

describe('runTravelSearch', () => {
  it('turns nuanced intent into grounded ranked recommendations with hard filters', async () => {
    const run = await runTravelSearch(query)

    expect(run.status).toBe('complete')
    expect(run.plan.hardFilters.maxPrice).toBe(90)
    expect(run.plan.softPreferences).toEqual(expect.arrayContaining(['peaceful', 'romantic', 'sunset']))
    expect(run.results.length).toBeGreaterThanOrEqual(3)
    expect(run.results.every((result) => result.poi.pricePerPerson <= 90)).toBe(true)
    expect(run.results[0].evidence.length).toBeGreaterThan(0)
    expect(run.results[0].evidence[0].citationId).toMatch(/^review-/)
    expect(run.trace.map((step) => step.id)).toEqual([
      'guard',
      'understand',
      'retrieve',
      'rerank',
      'ground',
    ])
  })
})
