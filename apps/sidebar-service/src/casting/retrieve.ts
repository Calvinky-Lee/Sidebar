import { getDb } from '../db/client.js'
import { cosineSim } from './mmr.js'

export type PersonaWithEmbedding = {
  id: string
  name: string
  archetype: string
  avatar: { hue: string; form: string }
  voice: string
  domains: string[]
  stanceProfile: { coreValues: string[]; biases: string[]; decisionStyle: string }
  embedding: number[]
}

export const VECTOR_INDEX = 'personas_vector'
export const POOL_SIZE = 25
export const NUM_CANDIDATES = 100

/**
 * Relevance retrieval (spec 05 §retrieve.ts): Atlas `$vectorSearch` top-25 by
 * cosine similarity. The caller embeds the PARSED dilemma (summary + axes of
 * tension), not raw user text — the axes are what members must be relevant to.
 */
export async function retrievePool(
  queryVector: number[],
  k: number = POOL_SIZE,
): Promise<PersonaWithEmbedding[]> {
  const db = await getDb()
  const projection = { _id: 1, name: 1, archetype: 1, avatar: 1, profile: 1, stanceProfile: 1, embedding: 1 }

  let docs: any[] = []
  try {
    docs = await db
      .collection('personas')
      .aggregate([
        {
          $vectorSearch: {
            index: VECTOR_INDEX,
            queryVector,
            path: 'embedding',
            numCandidates: NUM_CANDIDATES,
            limit: k,
          },
        },
        { $project: projection },
      ])
      .toArray()
  } catch {
    // $vectorSearch throws if the Atlas index doesn't exist — fall through to
    // the in-memory path below rather than failing the whole session.
    docs = []
  }

  // Fallback: no ANN index available (not created yet, still building, or the
  // Atlas tier's FTS-index slots are exhausted), so $vectorSearch returned
  // nothing. Rank the whole library by cosine in memory — trivial at this scale
  // (hundreds of 1024-dim vectors is sub-millisecond) and keeps casting working
  // without depending on Atlas Search. When the index IS present, the branch
  // above wins and this never runs.
  if (docs.length === 0) {
    const all = await db.collection('personas').find({}, { projection }).toArray()
    docs = all
      .map((d) => ({ d, sim: cosineSim(queryVector, (d.embedding as number[]) ?? []) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, k)
      .map(({ d }) => d)
  }

  return docs.map((d) => {
    const voice = d.profile?.voice
    const domains = d.profile?.domains
    // voice/domains are required, non-empty fields on PersonaIdentitySchema
    // (packages/contract/src/persona.ts) — a doc missing them is malformed
    // seed data, not a case to silently paper over with empty defaults.
    if (!voice || !domains || domains.length === 0) {
      throw new Error(
        `persona ${d._id} is missing required profile fields (voice/domains) — seed data is malformed`,
      )
    }
    return {
      id: String(d._id),
      name: d.name,
      archetype: d.archetype,
      avatar: d.avatar,
      voice,
      domains,
      stanceProfile: d.stanceProfile,
      embedding: d.embedding,
    }
  })
}
