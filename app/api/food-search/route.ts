import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query?.trim()) return NextResponse.json({ products: [] })

  // Open Food Facts search service — the legacy cgi/search.pl endpoint frequently returns 503s
  const url = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=20&fields=code,product_name,nutriments,serving_size`

  let data: { hits?: Record<string, unknown>[] }
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FitBuddy/0.1 (https://github.com/Bharathraos54/Fitbuddy)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`Open Food Facts responded ${res.status}`)
    data = await res.json()
  } catch (err) {
    console.error('Food search failed:', err)
    return NextResponse.json({ products: [], error: 'Food search is unavailable right now' }, { status: 502 })
  }

  const products = (data.hits ?? [])
    .filter((p: Record<string, unknown>) => {
      const n = p.nutriments as Record<string, number> | undefined
      // Only include products with a name and at least some calorie data
      return p.product_name && n && (n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0) > 0
    })
    .map((p: Record<string, unknown>, index: number) => {
      const n = p.nutriments as Record<string, number>
      return {
        // Use code (barcode) as the unique id — always present in Open Food Facts
        id: (p.code as string) ?? `result-${index}`,
        name: p.product_name as string,
        calories_per_100g: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
        protein_per_100g: Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
        carbs_per_100g: Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
        fat_per_100g: Math.round((n['fat_100g'] ?? 0) * 10) / 10,
        serving_size: (p.serving_size as string) ?? null,
      }
    })
    .slice(0, 8)

  return NextResponse.json({ products })
}
