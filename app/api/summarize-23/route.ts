import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
      const { prompt, model, provider, file, stream } = await request.json()
  
      if (!prompt || !model || !provider) {
        return NextResponse.json({ error: 'Missing required fields: prompt, model, provider' }, { status: 400 })
      }
  
      if (stream) {
        // Create streaming response for App Router
        const encoder = new TextEncoder()
        const customReadable = new ReadableStream({
          async start(controller) {
            try {
              if (provider === 'OpenAI') {
                const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
                if (!apiKey) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'OpenAI API key not configured' })}\n\n`))
                  controller.close()
                  return
                }
  
                const messages: any[] = []
                if (file) {
                  messages.push({
                    role: 'user',
                    content: `${prompt}\n\nFILE ATTACHED: ${file.name} (${file.type})\nFILE CONTENT:\n${file.content}`
                  })
                } else {
                  messages.push({ role: 'user', content: prompt })
                }
  
                const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                  },
                  body: JSON.stringify({
                    model: model === 'gpt-4' ? 'gpt-4' : 'gpt-3.5-turbo',
                    messages,
                    max_tokens: 2000,
                    temperature: 0.7,
                    stream: true
                  })
                })
  
                const reader = openAIResponse.body?.getReader()
                const decoder = new TextDecoder()
  
                if (reader) {
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
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
                            controller.close()
                            return
                          }
  
                          try {
                            const parsed = JSON.parse(data)
                            const content = parsed.choices?.[0]?.delta?.content || ''
                            if (content) {
                              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                            }
                          } catch (e) {
                            // Skip invalid JSON
                          }
                        }
                      }
                    }
                  } finally {
                    reader.releaseLock()
                  }
                }
              }
              // Similar implementation for Anthropic...
            } catch (error) {
              console.error('Streaming error:', error)
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed to generate summary' })}\n\n`))
              controller.close()
            }
          }
        })
  
        return new Response(customReadable, {
          headers: {
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      } else {
        // Non-streaming implementation...
        return NextResponse.json({ content: 'Summary here...' })
      }
    } catch (error) {
      console.error('Summary generation error:', error)
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
    }
  }