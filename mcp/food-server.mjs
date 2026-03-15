#!/usr/bin/env node
/**
 * MCP Server: Food Nutrition Lookup
 *
 * This server exposes two tools to Claude:
 *   1. search_food    — search Open Food Facts by name
 *   2. get_food_nutrition — get detailed nutrition for a specific product
 *
 * Claude Code reads .claude/settings.json and starts this server automatically.
 * Claude can then call these tools mid-conversation.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const server = new McpServer({
  name: 'food-nutrition',
  version: '1.0.0',
})

// ─── Tool 1: Search foods by name ────────────────────────────────────────────
server.tool(
  'search_food',
  'Search for foods by name and get calorie/nutrition info. Use this when the user asks about food nutrition.',
  { query: z.string().describe('Food name to search for (e.g. "chicken breast", "banana")') },
  async ({ query }) => {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&action=process&json=1&page_size=5&fields=product_name,nutriments,serving_size`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'GymDietTracker/1.0 (personal app)' },
    })
    const data = await res.json()

    if (!data.products?.length) {
      return { content: [{ type: 'text', text: `No results found for "${query}"` }] }
    }

    const results = data.products
      .filter((p) => p.product_name && p.nutriments)
      .slice(0, 5)
      .map((p) => {
        const n = p.nutriments
        return {
          name: p.product_name,
          per_100g: {
            calories: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
            protein_g: Math.round((n['proteins_100g'] ?? 0) * 10) / 10,
            carbs_g: Math.round((n['carbohydrates_100g'] ?? 0) * 10) / 10,
            fat_g: Math.round((n['fat_100g'] ?? 0) * 10) / 10,
          },
          serving_size: p.serving_size ?? 'unknown',
        }
      })

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    }
  }
)

// ─── Tool 2: Get nutrition for a specific product ─────────────────────────────
server.tool(
  'get_food_nutrition',
  'Get detailed nutrition facts for a specific food item by name and weight in grams.',
  {
    food_name: z.string().describe('Name of the food'),
    grams: z.number().describe('Weight in grams'),
  },
  async ({ food_name, grams }) => {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(food_name)}&action=process&json=1&page_size=1&fields=product_name,nutriments`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'GymDietTracker/1.0 (personal app)' },
    })
    const data = await res.json()

    const product = data.products?.[0]
    if (!product?.nutriments) {
      return { content: [{ type: 'text', text: `Could not find nutrition data for "${food_name}"` }] }
    }

    const n = product.nutriments
    const factor = grams / 100

    const result = {
      food: product.product_name,
      amount: `${grams}g`,
      calories: Math.round((n['energy-kcal_100g'] ?? 0) * factor),
      protein_g: Math.round((n['proteins_100g'] ?? 0) * factor * 10) / 10,
      carbs_g: Math.round((n['carbohydrates_100g'] ?? 0) * factor * 10) / 10,
      fat_g: Math.round((n['fat_100g'] ?? 0) * factor * 10) / 10,
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  }
)

// Start the server over stdio (how Claude Code communicates with MCP servers)
const transport = new StdioServerTransport()
await server.connect(transport)
