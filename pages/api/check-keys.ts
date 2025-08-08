// File: /pages/api/check-keys.ts (for Pages Router)

import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Check keys API called:', req.method)
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const hasOpenAI = !!(process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY)
    const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY)

    console.log('API Key Status:', { 
      hasOpenAI, 
      hasAnthropic,
      openaiKey: process.env.OPENAI_API_KEY ? 'Set' : 'Not set',
      anthropicKey: process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set'
    })

    return res.json({
      hasOpenAI,
      hasAnthropic,
      providers: [
        ...(hasOpenAI ? ['OpenAI'] : []),
        ...(hasAnthropic ? ['Anthropic'] : [])
      ]
    })
  } catch (error) {
    console.error('API Key Check Error:', error)
    return res.status(500).json({ error: 'Failed to check API keys' })
  }
}

// ----------------------------
// File: /app/api/check-keys/route.ts (for App Router)
/*
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('Check keys API called (App Router)')
  
  try {
    const hasOpenAI = !!(process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY)
    const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY)

    console.log('API Key Status:', { 
      hasOpenAI, 
      hasAnthropic,
      openaiKey: process.env.OPENAI_API_KEY ? 'Set' : 'Not set',
      anthropicKey: process.env.ANTHROPIC_API_KEY ? 'Set' : 'Not set'
    })

    return NextResponse.json({
      hasOpenAI,
      hasAnthropic,
      providers: [
        ...(hasOpenAI ? ['OpenAI'] : []),
        ...(hasAnthropic ? ['Anthropic'] : [])
      ]
    })
  } catch (error) {
    console.error('API Key Check Error:', error)
    return NextResponse.json({ error: 'Failed to check API keys' }, { status: 500 })
  }
}
*/