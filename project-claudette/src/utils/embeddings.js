import OpenAI from 'openai';
import logger from './logger.js';

const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set — embeddings cannot be generated.');
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/**
 * Generate a 1536-dimension embedding vector for an arbitrary text string
 * using OpenAI's text-embedding-3-small model.
 *
 * @param {string} text - The input text to embed.
 * @returns {Promise<number[]>} A 1536-length array of floats.
 */
export async function generateEmbedding(text) {
  const input = (text || '').toString().trim();

  if (!input) {
    throw new Error('generateEmbedding called with empty text.');
  }

  try {
    const response = await getClient().embeddings.create({
      model: EMBEDDING_MODEL,
      input
    });

    const vector = response?.data?.[0]?.embedding;

    if (!Array.isArray(vector) || vector.length === 0) {
      throw new Error('OpenAI returned an empty embedding.');
    }

    return vector;
  } catch (err) {
    logger.error('generateEmbedding failed:', err?.message || err);
    throw err;
  }
}

export default generateEmbedding;
