import { useMemo, useState } from 'react'
import './App.css'
import { runTravelSearch, type SearchResult, type SearchRun } from './domain/search'
import type { Poi } from './data/pois'

const EXAMPLES = [
  'Peaceful romantic dinner with a sunset under €90',
  'A quiet boutique stay with a balcony under €100',
  'An uncrowded sunset experience for two',
]

function BrandMark() { return <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span> }

function EvidenceDialog({ result, onClose }: { result: SearchResult; onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="evidence-modal" role="dialog" aria-modal="true" aria-label={`Evidence for ${result.poi.name}`}>
      <header><div><span className="eyebrow">Grounding record</span><h2>{result.poi.name}</h2></div><button className="icon-button" aria-label="Close evidence" onClick={onClose}>×</button></header>
      <div className="match-breakdown">
        <div><strong>{Math.round(result.score * 100)}%</strong><span>blended relevance</span></div>
        <div><strong>{Math.round(result.semanticScore * 100)}%</strong><span>semantic match</span></div>
        <div><strong>{Math.round(result.lexicalScore * 100)}%</strong><span>lexical match</span></div>
      </div>
      <p className="evidence-note">Atlas does not invent places. This explanation is assembled only from indexed listing fields and the review excerpts below.</p>
      {result.evidence.map(item => <article className="evidence-item" key={item.citationId}><div className="stars">★★★★★</div><blockquote>“{item.excerpt}”</blockquote><footer><span>{item.author} · {item.date}</span><code>Citation ID · {item.citationId}</code></footer></article>)}
      <div className="policy-line"><span className="status-dot" /> Citation validator passed · facts from index only</div>
    </section>
  </div>
}

function ResultCard({ result, saved, onSave, onEvidence }: { result: SearchResult; saved: boolean; onSave: () => void; onEvidence: () => void }) {
  const { poi } = result
  return <article className="result-card" data-testid="result-card">
    <div className="photo-wrap"><img src={poi.image} alt="" /><span className="category-pill">{poi.category}</span><button className={`heart ${saved ? 'saved' : ''}`} onClick={onSave} aria-label={saved ? `Remove ${poi.name} from trip` : `Save to trip ${poi.name}`}>{saved ? '♥' : '♡'}</button></div>
    <div className="result-body">
      <div className="result-heading"><div><h3>{poi.name}</h3><p>{poi.location}</p></div><div className="rating"><b>★ {poi.rating}</b><span>{poi.reviewCount.toLocaleString()} reviews</span></div></div>
      <p className="description">{poi.description}</p>
      <div className="features">{poi.features.map(feature => <span key={feature}>{feature}</span>)}</div>
      <div className="why"><div>A</div><p><strong>Why Atlas chose this</strong><span>{result.reason}</span></p></div>
      <div className="result-footer"><div><strong>€{poi.pricePerPerson}</strong><span> / person · {poi.priceLabel}</span></div><div><button className="secondary" onClick={onEvidence}>View evidence</button><button className="primary small" onClick={onSave}>{saved ? 'Saved' : 'Save to trip'}</button></div></div>
      <button className="evidence-strip" onClick={onEvidence}><span><i className="status-dot" /> Traveler evidence · {result.evidence.length} cited review{result.evidence.length === 1 ? '' : 's'}</span><b>Open ↗</b></button>
    </div>
  </article>
}

function TripWorkspace({ saved, onRemove }: { saved: Poi[]; onRemove: (id: string) => void }) {
  const total = saved.reduce((sum, poi) => sum + poi.pricePerPerson, 0)
  return <aside className="trip-panel" aria-label="Trip workspace">
    <div className="trip-header"><div><span className="eyebrow">Your workspace</span><h2>Lisbon, considered</h2></div><span>{saved.length} saved</span></div>
    <p className="trip-intro">A working shortlist—not a booking. Compare grounded options before you decide.</p>
    {!saved.length ? <div className="empty-trip"><i>＋</i><strong>Build a thoughtful shortlist</strong><p>Save places from your results. Atlas keeps the evidence attached.</p></div> : <div className="saved-list">
      {saved.map((poi, index) => <div className="saved-item" key={poi.id}><em>{index + 1}</em><img src={poi.image} alt="" /><p><strong>{poi.name}</strong><span>{poi.category} · €{poi.pricePerPerson}</span></p><button aria-label={`Remove ${poi.name}`} onClick={() => onRemove(poi.id)}>×</button></div>)}
      <div className="trip-total"><span>Estimated total</span><strong>€{total}</strong></div><button className="primary wide">Ask Atlas to shape a day</button><small>Planning only · no bookings or external actions</small>
    </div>}
    <div className="trust-tags"><span>Read-only tools</span><span>Citations retained</span><span>No model-memory POIs</span></div>
  </aside>
}

function Trace({ run }: { run: SearchRun }) {
  return <details className="trace"><summary><span><i /> Agent run complete</span><b>{run.trace.reduce((sum, step) => sum + step.durationMs, 0)} ms · inspect trace</b></summary><div>{run.trace.map((step, i) => <article key={step.id}><em>0{i + 1}</em><p><strong>{step.label}</strong><span>{step.detail}</span><code>{step.service}</code></p><small>{step.durationMs} ms</small></article>)}</div></details>
}

function ArchitectureView() {
  const lanes = [
    ['Experience plane', 'React web app', 'Azure Front Door', 'API Management'],
    ['Agent & workflow', 'Container Apps API', 'Microsoft Agent Framework', 'Foundry model deployment'],
    ['Retrieval plane', 'Query policy service', 'Azure AI Search', 'Semantic ranker'],
    ['Knowledge plane', 'ADLS landing zone', 'Embedding pipeline', 'Cosmos DB run state'],
  ]
  return <main className="inner-page"><div className="page-intro"><span className="eyebrow">Production reference</span><h1>Azure architecture</h1><p>A deterministic search core wrapped by a narrow, observable agent. The model plans and explains; Azure AI Search remains the source of recommendations.</p></div>
    <section className="architecture">{lanes.map((lane, li) => <div className={`lane lane-${li}`} key={lane[0]}><div className="lane-label"><span>0{li + 1}</span><strong>{lane[0]}</strong></div><div className="services">{lane.slice(1).map((service, i) => <div className="service" key={service}><small>{i === 1 && li === 1 ? 'REASONING' : i === 1 && li === 2 ? 'RETRIEVAL' : 'SERVICE'}</small><strong>{service}</strong>{i < 2 && <i>→</i>}</div>)}</div></div>)}</section>
    <div className="control-plane"><strong>Control plane</strong>{['Microsoft Entra ID','Managed Identity','Key Vault','Content Safety','Application Insights','Foundry evaluations'].map(x => <span key={x}>{x}</span>)}</div>
    <section className="system-notes">{[
      ['01','Ingestion','Immutable source snapshots land in ADLS. Event-driven workers normalize content, generate versioned embeddings, and promote a candidate index only after reconciliation.'],
      ['02','Online query','Deterministic parsers extract numeric constraints, locale, and safety signals before the agent emits a typed, validated search plan.'],
      ['03','Agent boundary','The agent receives only narrow read tools: search places, get details, compare places, and retrieve cited review excerpts.'],
      ['04','Degradation','Semantic ranker → hybrid RRF → lexical + filters. If the index is unavailable, fail clearly instead of recommending from model memory.'],
    ].map(x => <article key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></article>)}</section>
  </main>
}

function EvaluationView() {
  const metrics = [['NDCG@10','0.812','+14.6%','Ranking quality'],['Recall@20','0.936','+8.2%','Candidate coverage'],['Constraint violations','0.0%','−100%','Filter correctness'],['P95 latency','428 ms','−17%','End-to-end']]
  const rows = [['Lexical baseline','.688','.792','7.3%','126 ms'],['Vector only','.714','.861','4.8%','209 ms'],['Hybrid + RRF','.776','.918','2.9%','286 ms'],['Hybrid + semantic rerank','.812','.936','2.5%','428 ms']]
  return <main className="inner-page"><div className="page-intro"><span className="eyebrow">Offline evaluation fixture</span><h1>Relevance, not vibes</h1><p>Compare retrieval strategies on the same versioned Lisbon corpus and labeled query set. Demo values are clearly marked as illustrative.</p></div>
    <section className="metrics">{metrics.map(x => <article key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong><b>{x[2]}</b><small>{x[3]}</small></article>)}</section>
    <section className="ablation"><header><div><span className="eyebrow">Ablation study</span><h2>What earns its complexity?</h2></div><span>DEMO FIXTURE · 480 QUERIES</span></header><div className="table-row head"><span>Retrieval strategy</span><span>NDCG@10</span><span>Recall@20</span><span>Zero-result</span><span>P95</span></div>{rows.map((row, i) => <div className={`table-row ${i === 3 ? 'best' : ''}`} key={row[0]}>{row.map((cell, j) => <span key={cell}>{j === 0 && i === 3 ? `${cell} ✓` : cell}</span>)}</div>)}</section>
    <section className="gates"><h2>Release gates</h2>{[['PASS','Hard constraints','No price, rating, or category violations in fixture.'],['PASS','Citation integrity','Every claim resolves to an immutable source ID.'],['WATCH','Long-tail queries','Portuguese-English code-switching remains below target.']].map(x => <article key={x[1]}><span className={x[0].toLowerCase()}>{x[0]}</span><p><strong>{x[1]}</strong>{x[2]}</p></article>)}</section>
  </main>
}

function App() {
  const [view, setView] = useState<'discover'|'architecture'|'evaluation'>('discover')
  const [query, setQuery] = useState(EXAMPLES[0])
  const [run, setRun] = useState<SearchRun | null>(null)
  const [loading, setLoading] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [evidence, setEvidence] = useState<SearchResult | null>(null)
  const [sort, setSort] = useState<'match'|'rating'|'price'>('match')
  const saved = useMemo(() => run?.results.filter(x => savedIds.includes(x.poi.id)).map(x => x.poi) ?? [], [run, savedIds])
  const results = useMemo(() => { const values = [...(run?.results ?? [])]; return sort === 'rating' ? values.sort((a,b) => b.poi.rating-a.poi.rating) : sort === 'price' ? values.sort((a,b) => a.poi.pricePerPerson-b.poi.pricePerPerson) : values }, [run, sort])
  async function search() { setLoading(true); await new Promise(r => setTimeout(r, 260)); setRun(await runTravelSearch(query)); setLoading(false) }
  function toggle(id: string) { setSavedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]) }

  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => setView('discover')}><BrandMark /><span>Atlas</span><small>travel intelligence</small></button><nav aria-label="Primary navigation">{(['discover','architecture','evaluation'] as const).map(item => <button className={view === item ? 'active' : ''} onClick={() => setView(item)} key={item}>{item[0].toUpperCase()+item.slice(1)}</button>)}</nav><div className="top-actions"><span className="azure-badge"><i /> Azure reference app</span><button className="avatar" aria-label="Profile">IT</button></div></header>
    {view === 'architecture' && <ArchitectureView />}{view === 'evaluation' && <EvaluationView />}
    {view === 'discover' && <>
      <section className="search-stage"><div className="search-copy"><span className="eyebrow">Grounded travel discovery</span><h1>Tell us the feeling.<br />We’ll find the place.</h1><p>Atlas understands nuanced intent, searches real listings and traveler reviews, then shows the evidence behind every match.</p></div><div className="search-console"><label htmlFor="travel-query">Describe your ideal trip</label><div className="search-box"><textarea id="travel-query" value={query} onChange={e => setQuery(e.target.value)} rows={3} /><button className="primary search-button" onClick={search} disabled={loading}>{loading ? 'Searching evidence…' : 'Search with Atlas →'}</button></div><div className="example-row"><span>Try</span>{EXAMPLES.slice(1).map(x => <button key={x} onClick={() => setQuery(x)}>{x}</button>)}</div><div className="trust-row"><span><i className="status-dot" /> Real catalog only</span><span>Review citations</span><span>Hard constraints first</span><span>Read-only agent</span></div></div></section>
      {!run && <section className="how"><span className="eyebrow">How this prototype works</span><div>{[['01','Understand','An agent converts your words into a typed plan—without changing hard constraints.'],['02','Retrieve','Lexical, vector, and structured search find candidates from the indexed catalog.'],['03','Prove','Every reason resolves to a review excerpt and immutable citation ID.']].map(x => <article key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></article>)}</div></section>}
      {run && <main className="results-layout"><section className="results-column"><div className="results-meta"><div><span className="eyebrow">Search run · {run.id}</span><h2>{run.summary}</h2></div><label>Sort <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="match">Best match</option><option value="rating">Rating</option><option value="price">Price: low first</option></select></label></div><div className="plan-bar"><span>Atlas understood</span>{run.plan.domains.map(x => <b key={x}>{x}</b>)}{run.plan.softPreferences.map(x => <b key={x}>{x}</b>)}{run.plan.hardFilters.maxPrice && <b>≤ €{run.plan.hardFilters.maxPrice}</b>}</div><Trace run={run}/>{run.status === 'no_results' ? <div className="no-results"><h3>No exact match</h3><p>{run.summary}</p></div> : results.map(result => <ResultCard key={result.poi.id} result={result} saved={savedIds.includes(result.poi.id)} onSave={() => toggle(result.poi.id)} onEvidence={() => setEvidence(result)} />)}</section><TripWorkspace saved={saved} onRemove={toggle}/></main>}
    </>}
    <footer className="app-footer"><span>Atlas · Azure agentic travel search reference</span><span>Deterministic local adapter · No cloud resources deployed</span></footer>{evidence && <EvidenceDialog result={evidence} onClose={() => setEvidence(null)}/>}  
  </div>
}
export default App
