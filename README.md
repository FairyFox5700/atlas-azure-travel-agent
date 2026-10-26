# Atlas — Azure agentic semantic travel search

Atlas is a working local reference application inspired by Tripadvisor’s semantic-search engineering article. It demonstrates nuanced query understanding, hybrid-search planning, hard constraints, evidence-backed reranking, citation inspection, an agent execution trace, shortlist planning, an Azure architecture explorer, and evaluation views.

> The local app uses a deterministic six-POI Lisbon fixture. It does **not** call Azure or Microsoft Agent Framework and does **not** claim live Tripadvisor data. The domain contract is the seam for a production adapter.

## Run and verify

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
az bicep build --file infra/main.bicep
az bicep build-params --file infra/main.bicepparam
```

Try: `Peaceful romantic dinner with a sunset under €90`.

## Implemented workflow

1. Safety gate detects instruction-like text; authority remains read-only.
2. Typed plan extracts domain, numeric hard filters, and soft preferences.
3. Hybrid retrieval simulation keeps lexical and semantic evidence scores separate.
4. Hard-filter enforcement runs before ranking.
5. Evidence-aware rerank produces deterministic ordering.
6. Every explanation resolves to immutable review citation IDs.
7. Saved recommendations retain evidence and remain planning-only.

## Production Azure mapping

| Responsibility | Azure service |
|---|---|
| Web delivery and edge policy | Static Web Apps or Front Door + APIM |
| API and workflow host | Azure Container Apps |
| Probabilistic planning/explanation | Microsoft Agent Framework + Microsoft Foundry model deployment |
| Hybrid/vector/semantic retrieval | Azure AI Search |
| Embeddings | Azure OpenAI |
| Source landing and manifests | Azure Data Lake Storage Gen2 |
| Runs, plans, shortlist, audit events | Cosmos DB |
| Incremental ingestion boundary | Service Bus |
| Safety | Azure AI Content Safety + deterministic policy code |
| Identity and secrets | Entra ID, managed identity, Key Vault |
| Telemetry and quality | Application Insights/OpenTelemetry + Foundry evaluations |

The agent receives only narrow read tools:

```text
search_places(SearchPlan) -> SearchHit[]
get_place_details(poiId) -> PlaceDetails
get_review_evidence(poiId, citationIds[]) -> ReviewEvidence[]
compare_places(poiIds[]) -> Comparison
```

No arbitrary SQL, HTTP, shell, booking, payment, or record-mutation tool is exposed.

## Local-to-cloud contract

`runTravelSearch(query)` returns a stable `SearchRun`: status, validated `SearchPlan`, ranked results, immutable citations, safety flags, and execution trace. Replace only the adapter when connecting the UI to APIM.

```text
React → APIM → Container Apps API
  → deterministic safety + numeric parsing
  → Microsoft Agent Framework typed SearchPlan
  → schema / field / operator validation
  → Azure AI Search (BM25 + vectors + filters + RRF)
  → bounded semantic rerank
  → review citation validator
  → structured grounded response
```

## Ingestion

```text
Authorized feed → ADLS immutable snapshot + manifest
  → Service Bus event (reference, not payload)
  → normalize / dedupe / enrich
  → canonical embedding text + version hash
  → candidate Azure AI Search index
  → reconciliation + smoke tests + shadow evaluation
  → stable alias switch / rollback
```

Version source record, transform, embedding model/template, and index schema independently. Exclude price, availability, and rating from embeddings; update those structured fields separately.

## Reliability and privacy

- Managed identity and RBAC; no secrets in source.
- Add Private Link and restricted egress for a hardened environment.
- Deterministic PII scrub before model context; second scrub before telemetry export.
- Raw prompts disabled in telemetry by default.
- One retry owner per dependency with bounded backoff and correlation IDs.
- Degrade semantic ranker → hybrid RRF → lexical + typed filters.
- If the authorized index is unavailable, fail clearly—never recommend from model memory.

## Repository

```text
src/data/pois.ts          canonical demo corpus and citations
src/domain/search.ts      provider-neutral agent/search contract
src/App.tsx               interactive product surface
src/*.test.ts(x)          domain and primary-journey tests
infra/main.bicep          Azure production baseline
infra/main.bicepparam     non-secret deployment parameters
scripts/deploy.sh         validation and deployment
scripts/destroy.sh        cleanup
```
