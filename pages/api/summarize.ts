// /pages/api/summarize.ts
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt, model, provider, file, stream } = req.body

  if (!prompt || !model || !provider) {
    return res.status(400).json({ error: 'Missing required fields: prompt, model, provider' })
  }

  try {
    if (stream) {
      // Set headers for streaming response
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      })

      if (provider === 'OpenAI') {
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
        if (!apiKey) {
          res.write(`data: ${JSON.stringify({ error: 'OpenAI API key not configured' })}\n\n`)
          res.end()
          return
        }

        // Prepare messages with file content if provided
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

        if (!openAIResponse.ok) {
          res.write(`data: ${JSON.stringify({ error: 'OpenAI API request failed' })}\n\n`)
          res.end()
          return
        }

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
                    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
                    res.end()
                    return
                  }

                  try {
                    const parsed = JSON.parse(data)
                    const content = parsed.choices?.[0]?.delta?.content || ''
                    if (content) {
                      res.write(`data: ${JSON.stringify({ content })}\n\n`)
                    }
                  } catch (e) {
                    // Skip invalid JSON lines
                  }
                }
              }
            }
          } catch (error) {
            res.write(`data: ${JSON.stringify({ error: 'Streaming error occurred' })}\n\n`)
            res.end()
          } finally {
            reader.releaseLock()
          }
        }

      } else if (provider === 'Anthropic') {
        const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
        if (!apiKey) {
          res.write(`data: ${JSON.stringify({ error: 'Anthropic API key not configured' })}\n\n`)
          res.end()
          return
        }

        // Prepare prompt with file content if provided
        let finalPrompt = prompt
        if (file) {
          finalPrompt = `${prompt}\n\nFILE ATTACHED: ${file.name} (${file.type})\nFILE CONTENT:\n${file.content}`
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
            messages: [{ role: 'user', content: finalPrompt }],
            stream: true
          })
        })

        if (!anthropicResponse.ok) {
          res.write(`data: ${JSON.stringify({ error: 'Anthropic API request failed' })}\n\n`)
          res.end()
          return
        }

        const reader = anthropicResponse.body?.getReader()
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

                  try {
                    const parsed = JSON.parse(data)
                    if (parsed.type === 'content_block_delta') {
                      const content = parsed.delta?.text || ''
                      if (content) {
                        res.write(`data: ${JSON.stringify({ content })}\n\n`)
                      }
                    }
                    if (parsed.type === 'message_stop') {
                      res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
                      res.end()
                      return
                    }
                  } catch (e) {
                    // Skip invalid JSON lines
                  }
                }
              }
            }
          } catch (error) {
            res.write(`data: ${JSON.stringify({ error: 'Streaming error occurred' })}\n\n`)
            res.end()
          } finally {
            reader.releaseLock()
          }
        }
      } else {
        res.write(`data: ${JSON.stringify({ error: 'Unsupported provider' })}\n\n`)
        res.end()
      }

    } else {
      // Non-streaming response
      let response: string

      if (provider === 'OpenAI') {
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
        if (!apiKey) {
          return res.status(500).json({ error: 'OpenAI API key not configured' })
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
            temperature: 0.7
          })
        })

        if (!openAIResponse.ok) {
          const errorData = await openAIResponse.json().catch(() => ({}))
          throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorData.error?.message || 'Unknown error'}`)
        }

        const data = await openAIResponse.json()
        response = data.choices?.[0]?.message?.content || 'Failed to generate summary'

      } else if (provider === 'Anthropic') {
        const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
        if (!apiKey) {
          return res.status(500).json({ error: 'Anthropic API key not configured' })
        }

        let finalPrompt = prompt
        if (file) {
          finalPrompt = `${prompt}\n\nFILE ATTACHED: ${file.name} (${file.type})\nFILE CONTENT:\n${file.content}`
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
            messages: [{ role: 'user', content: finalPrompt }]
          })
        })

        if (!anthropicResponse.ok) {
          const errorData = await anthropicResponse.json().catch(() => ({}))
          throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorData.error?.message || 'Unknown error'}`)
        }

        const data = await anthropicResponse.json()
        response = data.content?.[0]?.text || 'Failed to generate summary'
      } else {
        return res.status(400).json({ error: 'Unsupported provider. Use "OpenAI" or "Anthropic"' })
      }

      res.status(200).json({ 
        content: response.trim(),
        provider,
        model,
        hasFile: !!file
      })
    }

  } catch (error) {
    console.error('Summary generation error:', error)
    if (stream) {
      res.write(`data: ${JSON.stringify({ error: 'Failed to generate summary' })}\n\n`)
      res.end()
    } else {
      res.status(500).json({ 
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}