// File: /app/api/ai-service/route.ts
// This is for App Router (if you're using /app directory)

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('API Route called: POST /api/ai-service')
  
  try {
    const { prompt, model, provider, service, stream, file } = await request.json()

    console.log('Request data:', { model, provider, service, stream: !!stream })

    if (!prompt || !model || !provider || !service) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (provider === 'OpenAI') {
      return await handleOpenAIAppRouter(prompt, model, service, stream, file)
    } else if (provider === 'Anthropic') {
      return await handleAnthropicAppRouter(prompt, model, service, stream, file)
    } else {
      return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 })
    }
  } catch (error) {
    console.error('AI Service Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 })
  }
}

async function handleOpenAIAppRouter(
  prompt: string,
  model: string,
  service: string,
  stream: boolean,
  file?: { content: string; type: string; name: string }
) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
  
  console.log('OpenAI API Key available:', !!apiKey)
  
  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
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
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const decoder = new TextDecoder()
        const chunkStr = decoder.decode(chunk)
        const lines = chunkStr.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              controller.enqueue(`data: {"done": true}\n\n`)
              return
            }

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                controller.enqueue(`data: ${JSON.stringify({ content })}\n\n`)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    })

    return new Response(response.body.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } else {
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    console.log('OpenAI Response content length:', content.length)
    return NextResponse.json({ content })
  }
}

async function handleAnthropicAppRouter(
  prompt: string,
  model: string,
  service: string,
  stream: boolean,
  file?: { content: string; type: string; name: string }
) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
  
  console.log('Anthropic API Key available:', !!apiKey)
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 })
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
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const decoder = new TextDecoder()
        const chunkStr = decoder.decode(chunk)
        const lines = chunkStr.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'content_block_delta' && data.delta?.text) {
                controller.enqueue(`data: ${JSON.stringify({ content: data.delta.text })}\n\n`)
              } else if (data.type === 'message_stop') {
                controller.enqueue(`data: {"done": true}\n\n`)
                return
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    })

    return new Response(response.body.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } else {
    const data = await response.json()
    const content = data.content?.[0]?.text || ''
    console.log('Anthropic Response content length:', content.length)
    return NextResponse.json({ content })
  }
}

// Also create /app/api/check-keys/route.ts
/*
// File: /app/api/check-keys/route.ts

import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const hasOpenAI = !!(process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY)
    const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY)

    console.log('API Key Check:', { hasOpenAI, hasAnthropic })

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