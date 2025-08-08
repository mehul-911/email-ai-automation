// /pages/api/translate.ts
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, model, provider } = req.body

  if (!prompt || !model || !provider) {
    return res.status(400).json({ error: 'Missing required fields: prompt, model, provider' })
  }

  try {
    let response: string

    if (provider === 'OpenAI') {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
      if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' })
      }

      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model === 'gpt-4' ? 'gpt-4' : 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.3
        })
      })

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await openAIResponse.json()
      response = data.choices?.[0]?.message?.content || 'NO_TRANSLATION_NEEDED'

    } else if (provider === 'Anthropic') {
      const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
      if (!apiKey) {
        return res.status(500).json({ error: 'Anthropic API key not configured' })
      }

      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model === 'claude-3-opus' ? 'claude-3-opus-20240229' : 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (!anthropicResponse.ok) {
        const errorData = await anthropicResponse.json().catch(() => ({}))
        throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await anthropicResponse.json()
      response = data.content?.[0]?.text || 'NO_TRANSLATION_NEEDED'
    } else {
      return res.status(400).json({ error: 'Unsupported provider. Use "OpenAI" or "Anthropic"' })
    }

    // Clean up the response
    const cleanedResponse = response.trim()
    
    res.status(200).json({ 
      content: cleanedResponse,
      provider,
      model,
      translated: cleanedResponse !== 'NO_TRANSLATION_NEEDED'
    })

  } catch (error) {
    console.error('Translation error:', error)
    res.status(500).json({ 
      error: 'Failed to translate content',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}