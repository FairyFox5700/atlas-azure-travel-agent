export type PoiCategory = 'Restaurant' | 'Experience' | 'Stay'

export interface ReviewEvidence {
  citationId: string
  author: string
  date: string
  rating: number
  excerpt: string
  tags: string[]
}

export interface Poi {
  id: string
  name: string
  category: PoiCategory
  location: string
  coordinates: { lat: number; lng: number }
  description: string
  image: string
  rating: number
  reviewCount: number
  pricePerPerson: number
  priceLabel: string
  tags: string[]
  features: string[]
  reviews: ReviewEvidence[]
}

export const POIS: Poi[] = [
  {
    id: 'poi-miradouro',
    name: 'Miradouro Table',
    category: 'Restaurant',
    location: 'Alfama, Lisbon',
    coordinates: { lat: 38.711, lng: -9.13 },
    description: 'An intimate hillside dining room with a west-facing terrace above Lisbon’s tiled roofs.',
    image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85',
    rating: 4.8,
    reviewCount: 1842,
    pricePerPerson: 78,
    priceLabel: '€€€',
    tags: ['romantic', 'sunset', 'peaceful', 'terrace', 'portuguese'],
    features: ['Sunset terrace', 'Quiet tables', 'Vegetarian menu'],
    reviews: [
      { citationId: 'review-ml-1042', author: 'Nadia R.', date: '12 Sep 2026', rating: 5, excerpt: 'Quiet enough to hear each other, and the sun dropped behind the bridge just as dinner arrived.', tags: ['peaceful', 'romantic', 'sunset'] },
      { citationId: 'review-ml-0988', author: 'Jonas K.', date: '28 Aug 2026', rating: 5, excerpt: 'Ask for the terrace edge. The light over the Tagus is extraordinary.', tags: ['sunset', 'view', 'terrace'] },
    ],
  },
  {
    id: 'poi-salina',
    name: 'Salina Rooftop',
    category: 'Restaurant',
    location: 'Mouraria, Lisbon',
    coordinates: { lat: 38.716, lng: -9.136 },
    description: 'Seasonal seafood and small plates on a low-key rooftop overlooking the castle.',
    image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1200&q=85',
    rating: 4.7,
    reviewCount: 963,
    pricePerPerson: 64,
    priceLabel: '€€',
    tags: ['sunset', 'rooftop', 'romantic', 'seafood', 'quiet'],
    features: ['Castle view', 'Rooftop', 'Local seafood'],
    reviews: [
      { citationId: 'review-sr-771', author: 'Elena M.', date: '3 Oct 2026', rating: 5, excerpt: 'A hidden rooftop without the party crowd. Golden-hour dinner felt special and unhurried.', tags: ['peaceful', 'sunset', 'romantic'] },
    ],
  },
  {
    id: 'poi-olive',
    name: 'Olive Courtyard',
    category: 'Restaurant',
    location: 'Príncipe Real, Lisbon',
    coordinates: { lat: 38.716, lng: -9.149 },
    description: 'A candlelit garden restaurant serving modern Portuguese sharing plates.',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=85',
    rating: 4.6,
    reviewCount: 1254,
    pricePerPerson: 52,
    priceLabel: '€€',
    tags: ['romantic', 'peaceful', 'garden', 'dinner', 'portuguese'],
    features: ['Garden tables', 'Candlelit', 'Sharing plates'],
    reviews: [
      { citationId: 'review-oc-422', author: 'Sam P.', date: '19 Sep 2026', rating: 5, excerpt: 'The courtyard is serene after 8pm, with thoughtful service and enough space between tables.', tags: ['peaceful', 'romantic'] },
    ],
  },
  {
    id: 'poi-riverlight',
    name: 'Riverlight Supper Club',
    category: 'Restaurant',
    location: 'Belém, Lisbon',
    coordinates: { lat: 38.697, lng: -9.205 },
    description: 'A riverfront tasting room with uninterrupted western views and a relaxed pace.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85',
    rating: 4.9,
    reviewCount: 624,
    pricePerPerson: 110,
    priceLabel: '€€€€',
    tags: ['sunset', 'romantic', 'river', 'tasting menu'],
    features: ['Waterfront', 'Tasting menu', 'Sommelier'],
    reviews: [
      { citationId: 'review-rs-618', author: 'Priya A.', date: '1 Oct 2026', rating: 5, excerpt: 'The river view is cinematic at sunset, though the tasting menu is a splurge.', tags: ['sunset', 'romantic'] },
    ],
  },
  {
    id: 'poi-sailing',
    name: 'Tagus Sunset Sail',
    category: 'Experience',
    location: 'Belém Marina, Lisbon',
    coordinates: { lat: 38.694, lng: -9.205 },
    description: 'A small-group two-hour sailing trip timed around sunset on the Tagus.',
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=85',
    rating: 4.9,
    reviewCount: 2176,
    pricePerPerson: 48,
    priceLabel: '€€',
    tags: ['sunset', 'peaceful', 'romantic', 'boat', 'outdoors'],
    features: ['Max 10 guests', 'Welcome drink', 'Sunset timing'],
    reviews: [
      { citationId: 'review-ts-2076', author: 'Marie L.', date: '6 Oct 2026', rating: 5, excerpt: 'Calm, uncrowded, and a beautiful way to watch Lisbon turn gold from the water.', tags: ['sunset', 'peaceful', 'romantic'] },
    ],
  },
  {
    id: 'poi-aurora',
    name: 'Casa Aurora',
    category: 'Stay',
    location: 'Graça, Lisbon',
    coordinates: { lat: 38.72, lng: -9.129 },
    description: 'A six-room guesthouse with private balconies and a quiet hilltop garden.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85',
    rating: 4.8,
    reviewCount: 411,
    pricePerPerson: 88,
    priceLabel: '€€€',
    tags: ['peaceful', 'romantic', 'sunset', 'boutique', 'garden'],
    features: ['Private balcony', 'Adults preferred', 'Breakfast'],
    reviews: [
      { citationId: 'review-ca-399', author: 'Theo W.', date: '22 Sep 2026', rating: 5, excerpt: 'The balcony sunset and the silent garden made this feel far from the city crowds.', tags: ['sunset', 'peaceful'] },
    ],
  },
]
