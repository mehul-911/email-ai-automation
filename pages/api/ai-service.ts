// File: /pages/api/ai-service.ts
// This is for Pages Router (if you're using /pages directory)

import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('=================API Route called:', req.method, req.url)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, model, provider, service, stream, file } = req.body

  console.log('Request data:', { model, provider, service, stream: !!stream })

  if (!prompt || !model || !provider || !service) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    if (provider === 'OpenAI') {
      return await handleOpenAI(req, res, prompt, model, service, stream, file)
    } else if (provider === 'Anthropic') {
      return await handleAnthropic(req, res, prompt, model, service, stream, file)
    } else {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` })
    }
  } catch (error) {
    console.error('AI Service Error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    })
  }
}

// OpenAI Handler
async function handleOpenAI(
  req: NextApiRequest,
  res: NextApiResponse,
  prompt: string,
  model: string,
  service: string,
  stream: boolean,
  file?: { content: string; type: string; name: string }
) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
  
  console.log('OpenAI API Key available:', !!apiKey)
  
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  const messages = [
    {
      role: 'user' as const,
      content: file 
        ? `${prompt}\n\nFile: ${file.name} (${file.type})\nBase64 Content: ${file.content.slice(0, 100)}...`
        : prompt
    }
  ]

  const requestBody = {
    model,
    messages,
    temperature: 0.3,
    max_tokens: 2000,
    stream
  }

  console.log('Making OpenAI API call...')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })

  console.log('OpenAI API Response status:', response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('OpenAI API Error:', errorData)
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }

  if (stream && response.body) {
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              res.write('data: {"done": true}\n\n')
              res.end()
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
      res.end()
    }
  } else {
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    console.log('OpenAI Response content length:', content.length)
    return res.json({ content })
  }
}

// Anthropic Handler
async function handleAnthropic(
  req: NextApiRequest,
  res: NextApiResponse,
  prompt: string,
  model: string,
  service: string,
  stream: boolean,
  file?: { content: string; type: string; name: string }
) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
  
  console.log('Anthropic API Key available:', !!apiKey)
  
  if (!apiKey) {
    return res.status(500).json({ error: 'Anthropic API key not configured' })
  }

  const fullPrompt = file 
    ? `${prompt}\n\nFile: ${file.name} (${file.type})\nBase64 Content: ${file.content.slice(0, 100)}...`
    : prompt

  const requestBody = {
    model,
    max_tokens: 2000,
    temperature: 0.3,
    messages: [
      {
        role: 'user' as const,
        content: fullPrompt
      }
    ],
    stream
  }

  console.log('Making Anthropic API call...')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(requestBody)
  })

  console.log('Anthropic API Response status:', response.status)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('Anthropic API Error:', errorData)
    throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
  }

  if (stream && response.body) {
    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'content_block_delta' && data.delta?.text) {
                res.write(`data: ${JSON.stringify({ content: data.delta.text })}\n\n`)
              } else if (data.type === 'message_stop') {
                res.write('data: {"done": true}\n\n')
                res.end()
                return
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
      res.end()
    }
  } else {
    const data = await response.json()
    const content = data.content?.[0]?.text || ''
    console.log('Anthropic Response content length:', content.length)
    return res.json({ content })
  }
}