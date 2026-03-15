import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query?.trim()) return NextResponse.json({ products: [] })

  // Use code,_id for the id field — Open Food Facts doesn't return "id" by default
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&action=process&json=1&page_size=10&fields=code,product_name,nutriments,serving_size&sort_by=unique_scans_n`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'GymDietTracker/1.0 (personal app)' },
  })

  const data = await res.json()

  const products = (data.products ?? [])
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
