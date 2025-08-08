// File: /pages/api/test-models.ts (or /app/api/test-models/route.ts)
// This endpoint tests which model IDs are valid

import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const results = {
    anthropic: {},
    openai: {}
  }

  // Test Anthropic models
  const anthropicKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
  if (anthropicKey) {
    const anthropicModels = [
      'claude-3-5-sonnet-20241022',
      'claude-3-sonnet-20240229', 
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
      'claude-3-sonnet',
      'claude-3-opus'
    ]

    for (const model of anthropicModels) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        })

        results.anthropic[model] = {
          status: response.status,
          valid: response.status !== 404
        }
      } catch (error) {
        results.anthropic[model] = {
          status: 'error',
          valid: false,
          error: error.message
        }
      }
    }
  }

  // Test OpenAI models
  const openaiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
  if (openaiKey) {
    const openaiModels = [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ]

    for (const model of openaiModels) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        })

        results.openai[model] = {
          status: response.status,
          valid: response.status !== 404 && response.status !== 400
        }
      } catch (error) {
        results.openai[model] = {
          status: 'error',
          valid: false,
          error: error.message
        }
      }
    }
  }

  return res.json(results)
}

// For App Router (/app/api/test-models/route.ts)
/*
import { NextResponse } from 'next/server'

export async function GET() {
  // Same logic as above but using NextResponse
  const results = { anthropic: {}, openai: {} }
  
  // ... same testing logic ...
  
  return NextResponse.json(results)
}
*/