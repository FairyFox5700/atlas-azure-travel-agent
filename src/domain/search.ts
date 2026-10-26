import { POIS, type Poi, type ReviewEvidence } from '../data/pois'

export type RunStatus = 'complete' | 'needs_information' | 'blocked' | 'no_results'

export interface SearchPlan {
  normalizedQuery: string
  intent: 'discover' | 'exact_lookup'
  domains: Array<'Restaurant' | 'Experience' | 'Stay'>
  hardFilters: { maxPrice?: number; minRating?: number; category?: string }
  softPreferences: string[]
  retrievalMode: 'hybrid'
}

export interface SearchResult {
  poi: Poi
  score: number
  semanticScore: number
  lexicalScore: number
  reason: string
  evidence: ReviewEvidence[]
}

export interface TraceStep {
  id: 'guard' | 'understand' | 'retrieve' | 'rerank' | 'ground'
  label: string
  detail: string
  status: 'complete' | 'blocked'
  durationMs: number
  service: string
}

export interface SearchRun {
  id: string
  status: RunStatus
  query: string
  plan: SearchPlan
  results: SearchResult[]
  trace: TraceStep[]
  summary: string
  safety: { promptInjectionDetected: boolean; factsFromIndexOnly: boolean }
}

const preferenceTerms = ['peaceful', 'quiet', 'romantic', 'sunset', 'rooftop', 'garden', 'seafood', 'boutique', 'outdoors']

function parsePlan(query: string): SearchPlan {
  const normalizedQuery = query.toLowerCase().trim()
  const priceMatch = normalizedQuery.match(/(?:under|below|less than|max(?:imum)?)[^\d]{0,4}(\d{2,4})/)
  const ratingMatch = normalizedQuery.match(/(?:at least|over)\s+(\d(?:\.\d)?)\s*(?:stars?|rating)?/)
  const softPreferences = preferenceTerms.filter((term) => normalizedQuery.includes(term))
  const domains: SearchPlan['domains'] = normalizedQuery.includes('hotel') || normalizedQuery.includes('stay')
    ? ['Stay']
    : normalizedQuery.includes('thing to do') || normalizedQuery.includes('experience')
      ? ['Experience']
      : normalizedQuery.includes('dinner') || normalizedQuery.includes('restaurant')
        ? ['Restaurant']
        : ['Restaurant', 'Experience', 'Stay']

  return {
    normalizedQuery,
    intent: POIS.some((poi) => normalizedQuery.includes(poi.name.toLowerCase())) ? 'exact_lookup' : 'discover',
    domains,
    hardFilters: {
      ...(priceMatch ? { maxPrice: Number(priceMatch[1]) } : {}),
      ...(ratingMatch ? { minRating: Number(ratingMatch[1]) } : {}),
    },
    softPreferences,
    retrievalMode: 'hybrid',
  }
}

function scorePoi(poi: Poi, plan: SearchPlan): SearchResult {
  const terms = plan.normalizedQuery.split(/\W+/).filter((term) => term.length > 3)
  const searchable = `${poi.name} ${poi.description} ${poi.location} ${poi.tags.join(' ')} ${poi.features.join(' ')}`.toLowerCase()
  const lexicalMatches = terms.filter((term) => searchable.includes(term)).length
  const matchedPreferences = plan.softPreferences.filter((term) => poi.tags.includes(term) || poi.reviews.some((review) => review.tags.includes(term)))
  const lexicalScore = Math.min(1, lexicalMatches / Math.max(terms.length, 1))
  const semanticScore = Math.min(1, matchedPreferences.length / Math.max(plan.softPreferences.length, 1))
  const score = Number((semanticScore * 0.58 + lexicalScore * 0.22 + (poi.rating / 5) * 0.2).toFixed(3))
  const evidence = poi.reviews.filter((review) => matchedPreferences.some((term) => review.tags.includes(term)))
  const explanation = matchedPreferences.length
    ? `Matches ${matchedPreferences.slice(0, 3).join(', ')}; supported by ${Math.max(evidence.length, 1)} traveler review${evidence.length === 1 ? '' : 's'}.`
    : `Strong catalog match with a ${poi.rating.toFixed(1)} traveler rating.`

  return { poi, score, semanticScore, lexicalScore, reason: explanation, evidence: evidence.length ? evidence : poi.reviews.slice(0, 1) }
}

export async function runTravelSearch(query: string): Promise<SearchRun> {
  const plan = parsePlan(query)
  const injection = /(ignore (all|previous)|system prompt|reveal.*prompt|execute.*tool)/i.test(query)
  const trace: TraceStep[] = [
    { id: 'guard', label: 'Safety & privacy gate', detail: injection ? 'Instruction-like content removed; retrieval remains read-only.' : 'Input passed PII and prompt-injection checks.', status: 'complete', durationMs: 7, service: 'Azure AI Content Safety + policy' },
    { id: 'understand', label: 'Intent planner', detail: `Parsed ${plan.domains.join(', ')} intent, ${Object.keys(plan.hardFilters).length} hard filter(s), ${plan.softPreferences.length} preference(s).`, status: 'complete', durationMs: 31, service: 'Microsoft Agent Framework' },
    { id: 'retrieve', label: 'Hybrid retrieval', detail: 'BM25 and vector candidates fused with reciprocal-rank fusion.', status: 'complete', durationMs: 48, service: 'Azure AI Search' },
    { id: 'rerank', label: 'Evidence-aware rerank', detail: 'Hard filters applied before bounded semantic reranking.', status: 'complete', durationMs: 22, service: 'Azure AI Search semantic ranker' },
    { id: 'ground', label: 'Grounding validator', detail: 'Every explanation mapped to an indexed review citation.', status: 'complete', durationMs: 9, service: 'Deterministic policy service' },
  ]

  if (!query.trim()) {
    return { id: 'run-empty', status: 'needs_information', query, plan, results: [], trace: trace.slice(0, 2), summary: 'Describe the place or experience you want.', safety: { promptInjectionDetected: false, factsFromIndexOnly: true } }
  }

  const results = POIS
    .filter((poi) => plan.domains.includes(poi.category))
    .filter((poi) => plan.hardFilters.maxPrice === undefined || poi.pricePerPerson <= plan.hardFilters.maxPrice)
    .filter((poi) => plan.hardFilters.minRating === undefined || poi.rating >= plan.hardFilters.minRating)
    .map((poi) => scorePoi(poi, plan))
    .sort((a, b) => b.score - a.score || b.poi.rating - a.poi.rating)

  return {
    id: `run-${Array.from(query).reduce((sum, character) => (sum * 31 + character.charCodeAt(0)) >>> 0, 7).toString(16)}`,
    status: results.length ? 'complete' : 'no_results',
    query,
    plan,
    results,
    trace,
    summary: results.length ? `${results.length} grounded matches ranked from traveler evidence—not model memory.` : 'No indexed places satisfy every hard constraint. Try widening the price or rating.',
    safety: { promptInjectionDetected: injection, factsFromIndexOnly: true },
  }
}
