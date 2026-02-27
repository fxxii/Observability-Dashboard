import { computed } from 'vue'
import { useEventsStore } from '../stores/events'
import { parseEvent } from '../types/events'

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6':    { input: 15.00, output: 75.00 },
  'claude-sonnet-4-6':  { input:  3.00, output: 15.00 },
  'claude-haiku-4-5':   { input:  0.80, output:  4.00 },
  default:              { input:  3.00, output: 15.00 },
}

function safeInt(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

function tokensToUsd(inputTokens: number, outputTokens: number, model: string): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING.default
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output
}

export function useTokenBurn() {
  const store = useEventsStore()
  const tokenEvents = computed(() => store.events.map(parseEvent).filter(e => e.payload.input_tokens || e.payload.output_tokens))

  const totalCostUsd = computed(() =>
    tokenEvents.value.reduce((sum, e) => sum + tokensToUsd(safeInt(e.payload.input_tokens), safeInt(e.payload.output_tokens), String(e.payload.model ?? 'default')), 0)
  )

  const costBySession = computed<Record<string, number>>(() => {
    const result: Record<string, number> = {}
    tokenEvents.value.forEach(e => {
      const cost = tokensToUsd(safeInt(e.payload.input_tokens), safeInt(e.payload.output_tokens), String(e.payload.model ?? 'default'))
      result[e.session_id] = (result[e.session_id] ?? 0) + cost
    })
    return result
  })

  const burnRatePerMinute = computed(() => {
    const now = Date.now()
    return tokenEvents.value.filter(e => e.timestamp >= now - 60_000)
      .reduce((sum, e) => sum + tokensToUsd(safeInt(e.payload.input_tokens), safeInt(e.payload.output_tokens), String(e.payload.model ?? 'default')), 0)
  })

  return { totalCostUsd, costBySession, burnRatePerMinute }
}
