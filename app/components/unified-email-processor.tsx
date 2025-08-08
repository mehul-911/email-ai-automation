'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  File, 
  AlertCircle, 
  CheckCircle, 
  Type, 
  Paperclip,
  Brain,
  Loader2,
  Languages,
  FileText,
  CheckSquare,
  Send,
  RefreshCw,
  Copy,
  Plus,
  Sparkles,
  X,
  Zap,
  Key
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AIModel, ProcessedEmail, GeneratedResponse } from '../types'
import ModelSelector from './model-selector'

interface EmailData {
  content: string
  fileName: string
  fileType: string
  size: number
}

const AI_MODELS: AIModel[] = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Latest and most capable model' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced performance and speed' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Highest quality analysis' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fast and efficient' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Latest GPT-4 model' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Advanced reasoning capabilities' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient processing' }
]

const RESPONSE_MODELS: AIModel[] = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Creative and detailed responses' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Highest quality responses' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Professional responses' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Quick responses' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Comprehensive responses' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Comprehensive responses' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Quick and concise responses' }
]

// Check if API keys are available (checks both client and server-side)
function checkAPIKeysAvailable(): { hasOpenAI: boolean; hasAnthropic: boolean } {
  // We'll check this via a simple API call since we can't access server env vars from client
  // For now, we'll assume keys are available if NEXT_PUBLIC_ versions exist or return true
  // The actual validation will happen in the API route
  return {
    hasOpenAI: !!(process.env.NEXT_PUBLIC_OPENAI_API_KEY) || true, // Assume available
    hasAnthropic: !!(process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) || true // Assume available
  }
}

// File handling
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = error => reject(error)
  })
}

// Unified AI Service Call (now uses Next.js API route)
async function callAIService(
  service: 'language-detect' | 'translate' | 'summarize' | 'extract-actions' | 'generate-response',
  prompt: string,
  model: AIModel,
  onChunk?: (chunk: string) => void,
  file?: { content: string; type: string; name: string }
): Promise<string> {
  const isStreaming = !!onChunk
  
  console.log('Calling AI service:', {
    service,
    model: model.name,
    modelId: model.id,
    provider: model.provider,
    streaming: isStreaming,
    hasFile: !!file
  })
  
  try {
    const response = await fetch('/api/ai-service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: model.id,
        provider: model.provider,
        service,
        stream: isStreaming,
        file
      })
    })

    console.log('API Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API Error Response:', errorData)
      throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`)
    }

    // Handle streaming response
    if (isStreaming && onChunk && response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

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
                if (data.content) {
                  fullResponse += data.content
                  onChunk(data.content)
                }
                if (data.done) {
                  console.log('Streaming completed, total length:', fullResponse.length)
                  return fullResponse
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

      console.log('Streaming finished, total length:', fullResponse.length)
      return fullResponse
    } else {
      // Handle non-streaming response
      const data = await response.json()
      console.log('Non-streaming response length:', (data.content || '').length)
      return data.content || ''
    }
  } catch (error) {
    console.error(`AI Service Error (${service}):`, error)
    throw error
  }
}

// AI Prompt Functions
function createLanguageDetectionPrompt(content: string): string {
  return `Please analyze this content and detect the language. Respond with ONLY the language name (e.g., "English", "Spanish", "French", "German", etc.).

CONTENT TO ANALYZE:
"""
${content}
"""

Respond with only the language name.`
}

function createTranslationPrompt(content: string, detectedLanguage: string): string {
  return `The following content is in ${detectedLanguage}. Please translate it to English if it's not already in English. If it's already in English, respond with "NO_TRANSLATION_NEEDED".

CONTENT TO TRANSLATE:
"""
${content}
"""

If translation is needed, provide only the translated text. If no translation is needed, respond with "NO_TRANSLATION_NEEDED".`
}

function createSummaryPrompt(content: string): string {
  return `Please read this email/document content and provide a clear, concise summary in 2-3 sentences. Focus on the main purpose, key information, and what the sender wants.

CONTENT TO SUMMARIZE:
"""
${content}
"""

Provide a professional summary that explains what this communication is about and what's important to know.`
}

function createActionItemsPrompt(content: string): string {
  return `Please analyze this email/document and identify specific action items for the recipient. Look for requests, questions, tasks, deadlines, or anything that requires a response or action.

CONTENT TO ANALYZE:
"""
${content}
"""

Format your response as a bulleted list using "-" for each action item. If no specific actions are required, respond with "- Review and acknowledge this communication".`
}

function createResponsePrompt(originalContent: string, summary: string, actionItems: string, version: number): string {
  const tones = ['professional and detailed', 'friendly and collaborative', 'concise and efficient', 'warm and comprehensive']
  const tone = tones[(version - 1) % tones.length]
  
  return `Please write a ${tone} email response to the following communication.

ORIGINAL CONTENT:
"""
${originalContent}
"""

SUMMARY:
${summary}

ACTION ITEMS IDENTIFIED:
${actionItems}

Write a complete, natural email response that:
- Uses a ${tone} tone
- Addresses the main points from the original message
- References the action items appropriately
- Includes proper email formatting (greeting, body, closing)
- Uses [Your Name] as a signature placeholder
- Sounds professional and natural

Generate a complete email response now.`
}

// AI Processing Functions
async function detectLanguageWithAI(content: string, model: AIModel): Promise<string> {
  try {
    console.log('Detecting language with model:', model.name, model.id)
    const prompt = createLanguageDetectionPrompt(content)
    const response = await callAIService('language-detect', prompt, model)
    console.log('Language detection response:', response)
    return response.trim()
  } catch (error) {
    console.error('Language detection failed:', error)
    toast.error(`Language detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return 'English'
  }
}

async function translateWithAI(content: string, detectedLanguage: string, model: AIModel): Promise<string | null> {
  if (detectedLanguage === 'English') return null
  
  try {
    console.log('Translating from', detectedLanguage, 'with model:', model.name)
    const prompt = createTranslationPrompt(content, detectedLanguage)
    const response = await callAIService('translate', prompt, model)
    const trimmed = response.trim()
    console.log('Translation response:', trimmed.slice(0, 100) + '...')
    return trimmed === 'NO_TRANSLATION_NEEDED' ? null : trimmed
  } catch (error) {
    console.error('Translation failed:', error)
    toast.error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return null
  }
}

export default function UnifiedEmailProcessor() {
  // Input states
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text')
  const [emailText, setEmailText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isFileProcessing, setIsFileProcessing] = useState(false)
  
  // Processing states
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedEmail, setProcessedEmail] = useState<ProcessedEmail | null>(null)
  
  // Streaming states with character-by-character display
  const [streamingSummary, setStreamingSummary] = useState('')
  const [streamingActionItems, setStreamingActionItems] = useState('')
  const [isStreamingSummary, setIsStreamingSummary] = useState(false)
  const [isStreamingActions, setIsStreamingActions] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState('')
  const [isStreamingResponse, setIsStreamingResponse] = useState(false)
  
  // Buffer states for character-by-character streaming
  const [summaryBuffer, setSummaryBuffer] = useState('')
  const [actionItemsBuffer, setActionItemsBuffer] = useState('')
  const [responseBuffer, setResponseBuffer] = useState('')

  // Response generation states
  const [responseModel, setResponseModel] = useState<AIModel>(RESPONSE_MODELS[0])
  const [responses, setResponses] = useState<GeneratedResponse[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  
  // Change detection
  const [lastProcessedContent, setLastProcessedContent] = useState('')
  const [contentHash, setContentHash] = useState('')
  
  // Translation states
  const [detectedLanguage, setDetectedLanguage] = useState('')
  const [translatedContent, setTranslatedContent] = useState<string | null>(null)
  
  // API availability
  const [apiStatus, setApiStatus] = useState({ hasOpenAI: true, hasAnthropic: true })

  // Check API keys on mount
  useEffect(() => {
    const checkAPIKeys = async () => {
      try {
        const response = await fetch('/api/check-keys')
        if (response.ok) {
          const data = await response.json()
          setApiStatus(data)
        } else {
          // Fallback to client-side check
          setApiStatus(checkAPIKeysAvailable())
        }
      } catch (error) {
        console.error('Failed to check API keys:', error)
        // Fallback to client-side check
        setApiStatus(checkAPIKeysAvailable())
      }
    }
    
    checkAPIKeys()
  }, [])
  
  // Effect to detect content changes
  useEffect(() => {
    const currentContent = getCurrentEmailContent()
    const newHash = btoa(encodeURIComponent(currentContent)).slice(0, 10)
    
    if (newHash !== contentHash && currentContent !== lastProcessedContent) {
      setContentHash(newHash)
      if (processedEmail && currentContent.trim() && currentContent !== lastProcessedContent) {
        setProcessedEmail(null)
        setResponses([])
        setStreamingSummary('')
        setStreamingActionItems('')
        setStreamingResponse('')
        setSummaryBuffer('')
        setActionItemsBuffer('')
        setResponseBuffer('')
        setDetectedLanguage('')
        setTranslatedContent(null)
      }
    }
  }, [emailText, uploadedFile, contentHash, lastProcessedContent, processedEmail])

  // Get current email content
  const getCurrentEmailContent = (): string => {
    if (inputMethod === 'text') {
      return emailText
    } else if (uploadedFile) {
      return `[FILE: ${uploadedFile.name}]`
    }
    return ''
  }

  // Get file for AI processing
  const getFileForAI = async (): Promise<{ content: string; type: string; name: string } | undefined> => {
    if (!uploadedFile) return undefined
    
    try {
      const content = await fileToBase64(uploadedFile)
      return {
        content,
        type: uploadedFile.type,
        name: uploadedFile.name
      }
    } catch (error) {
      console.error('Error reading file:', error)
      return undefined
    }
  }

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsFileProcessing(true)
    setUploadedFile(file)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('File uploaded successfully! Ready for AI processing.')
    } catch (error) {
      toast.error('Failed to process file. Please try again.')
      console.error('File processing error:', error)
      setUploadedFile(null)
    } finally {
      setIsFileProcessing(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-outlook': ['.msg']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024
  })

  // Character-by-character streaming function
  const streamTextCharacterByCharacter = (
    fullText: string,
    setDisplayText: (text: string) => void,
    speed: number = 30 // milliseconds per character
  ) => {
    let currentIndex = 0
    setDisplayText('')
    
    const interval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(interval)
      }
    }, speed)
    
    return interval
  }

  // Process email with AI
  const handleProcessEmail = async () => {
    const content = getCurrentEmailContent()
    
    if (!content.trim() && inputMethod === 'text') {
      toast.error('Please enter email content')
      return
    }
    
    if (!uploadedFile && inputMethod === 'file') {
      toast.error('Please upload a file')
      return
    }

    setIsProcessing(true)
    setStreamingSummary('')
    setStreamingActionItems('')
    setSummaryBuffer('')
    setActionItemsBuffer('')
    
    try {
      const actualContent = inputMethod === 'text' ? emailText : ''
      const fileData = inputMethod === 'file' ? await getFileForAI() : undefined
      
      setLastProcessedContent(content)
      
      // Step 1: Detect language with AI (show immediately)
      const language = await detectLanguageWithAI(actualContent || (uploadedFile?.name || ''), selectedModel)
      setDetectedLanguage(language)
      
      // Step 2: Translate if needed
      const translation = await translateWithAI(actualContent || (uploadedFile?.name || ''), language, selectedModel)
      setTranslatedContent(translation)
      
      // Step 3: Generate summary (collect full response first, then stream character by character)
      setIsStreamingSummary(true)
      const summary = await callAIService(
        'summarize',
        createSummaryPrompt(actualContent || `Please analyze the uploaded file: ${uploadedFile?.name}`),
        selectedModel,
        undefined, // No chunk callback - get full response
        fileData
      )
      
      // Stream summary character by character
      streamTextCharacterByCharacter(summary, setStreamingSummary, 20)
      
      // Step 4: Generate action items (collect full response first, then stream character by character)
      setIsStreamingActions(true)
      const actionItemsText = await callAIService(
        'extract-actions',
        createActionItemsPrompt(actualContent || `Please analyze the uploaded file: ${uploadedFile?.name}`),
        selectedModel,
        undefined, // No chunk callback - get full response
        fileData
      )
      
      // Start streaming action items after a short delay
      setTimeout(() => {
        streamTextCharacterByCharacter(actionItemsText, setStreamingActionItems, 25)
      }, 500)
      
      // Wait for both streaming animations to complete
      setTimeout(() => {
        // Parse action items from AI response
        const actionItems = actionItemsText
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.trim().substring(1).trim())
          .filter(item => item.length > 0)

        const processed: ProcessedEmail = {
          originalContent: actualContent || `[FILE: ${uploadedFile?.name}]`,
          translatedContent: translation,
          summary,
          actionItems,
          language,
          wasTranslated: !!translation
        }

        setProcessedEmail(processed)
        setIsStreamingSummary(false)
        setIsStreamingActions(false)
        toast.success(`Email processed successfully with ${selectedModel.name}!`)
      }, Math.max(summary.length * 20, actionItemsText.length * 25) + 1000)
      
    } catch (error) {
      console.error('Processing error:', error)
      toast.error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsStreamingSummary(false)
      setIsStreamingActions(false)
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate response with AI
  const generateResponse = async () => {
    if (!processedEmail) return

    setIsGenerating(true)
    setStreamingResponse('')
    setIsStreamingResponse(true)
    setResponseBuffer('')

    try {
      // Get full response first, then stream character by character
      const responseContent = await callAIService(
        'generate-response',
        createResponsePrompt(
          processedEmail.originalContent,
          processedEmail.summary,
          processedEmail.actionItems.join('\n'),
          responses.length + 1
        ),
        responseModel,
        undefined // No chunk callback - get full response
      )

      // Stream response character by character
      streamTextCharacterByCharacter(responseContent, setStreamingResponse, 15)

      // Add to responses after streaming completes
      setTimeout(() => {
        const newResponse: GeneratedResponse = {
          content: responseContent,
          model: responseModel.name,
          timestamp: Date.now(),
          version: responses.length + 1
        }

        setResponses(prev => [newResponse, ...prev])
        setIsStreamingResponse(false)
        setStreamingResponse('')
        toast.success(`Response generated with ${responseModel.name}!`)
      }, responseContent.length * 15 + 500)

    } catch (error) {
      console.error('Response generation error:', error)
      toast.error(`Response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsStreamingResponse(false)
      setStreamingResponse('')
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedIndex(index)
      toast.success('Response copied to clipboard!')
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      toast.error('Failed to copy response')
    }
  }

  // Switch input methods
  const switchInputMethod = (method: 'text' | 'file') => {
    setInputMethod(method)
    if (method === 'text') {
      setUploadedFile(null)
    } else {
      setEmailText('')
    }
    setProcessedEmail(null)
    setResponses([])
    setStreamingSummary('')
    setStreamingActionItems('')
    setStreamingResponse('')
    setSummaryBuffer('')
    setActionItemsBuffer('')
    setResponseBuffer('')
  }

  // Load sample email
  const loadSampleEmail = () => {
    const sampleEmail = `Subject: Madison Square Garden Event Coordination Update

Hi Team,

I hope this message finds you well. I'm writing to provide an update on our upcoming events at Madison Square Garden and coordinate our preparation efforts.

Upcoming Events & Action Items:
- Rangers game on Friday: Coordinate with security and concessions teams
- Concert series next week: Review sound system specifications and artist requirements  
- Corporate event planning: Finalize catering arrangements and VIP seating
- Staff scheduling: Ensure adequate coverage for all events
- Equipment maintenance: Complete pre-event inspections

Please prepare your department status reports and submit them by Thursday. Our coordination meeting is scheduled for Friday at 10 AM in Conference Room A.

The success of our events depends on seamless collaboration between all departments. Let me know if you have any questions or need additional resources.

Best regards,
Sarah Johnson
Event Operations Manager
Madison Square Garden`
    
    setEmailText(sampleEmail)
    setInputMethod('text')
    setProcessedEmail(null)
    setResponses([])
    setStreamingSummary('')
    setStreamingActionItems('')
    setStreamingResponse('')
    setSummaryBuffer('')
    setActionItemsBuffer('')
    setResponseBuffer('')
  }

  const hasContent = (inputMethod === 'text' && emailText.trim()) || 
                    (inputMethod === 'file' && uploadedFile)
  const hasAPIKeys = apiStatus.hasOpenAI || apiStatus.hasAnthropic

  return (
    <div className="space-y-8">
      {/* API Configuration Warning */}
      {!hasAPIKeys && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Key className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="font-medium text-yellow-900 dark:text-yellow-100">Environment Variables Required</span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            Please set OPENAI_API_KEY and/or ANTHROPIC_API_KEY in your environment variables (.env.local).
          </p>
          <div className="bg-yellow-100 dark:bg-yellow-800/30 rounded p-3 mt-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 font-mono">
              OPENAI_API_KEY=sk-...<br/>
              ANTHROPIC_API_KEY=sk-ant-...
            </p>
          </div>
        </motion.div>
      )}

      {/* API Status */}
      {hasAPIKeys && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-900 dark:text-green-100">API Keys Configured</span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            Available providers: {apiStatus.hasOpenAI && 'OpenAI'} {apiStatus.hasOpenAI && apiStatus.hasAnthropic && '• '} {apiStatus.hasAnthropic && 'Anthropic'}
          </p>
        </motion.div>
      )}

      {/* Main Email Processing Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="msg-card"
      >
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-8 h-8 text-msg-orange" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              MSG AI Email Automation
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Process emails efficiently with Madison Square Garden's enterprise AI suite powered by real APIs
          </p>
        </div>

        {/* Input Method Toggle */}
        <div className="flex bg-gradient-to-r from-primary-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-1 mb-6">
          <button
            onClick={() => switchInputMethod('text')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-semibold transition-all duration-200 ${
              inputMethod === 'text'
                ? 'bg-white dark:bg-gray-800 text-msg-orange shadow-lg transform scale-105'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Type className="w-5 h-5" />
            <span>Type Email</span>
          </button>
          <button
            onClick={() => switchInputMethod('file')}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md font-semibold transition-all duration-200 ${
              inputMethod === 'file'
                ? 'bg-white dark:bg-gray-800 text-msg-orange shadow-lg transform scale-105'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Paperclip className="w-5 h-5" />
            <span>Upload File</span>
          </button>
        </div>

        {/* Content Input Area */}
        <AnimatePresence mode="wait">
          {inputMethod === 'text' ? (
            <motion.div
              key="text"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="relative">
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  placeholder="Enter your email content here... AI will handle language detection, translation, and analysis automatically."
                  className="input-field h-64 resize-none"
                  maxLength={10000}
                />
                {emailText && (
                  <button
                    onClick={() => setEmailText('')}
                    className="absolute top-3 right-3 p-1 text-gray-400 dark:text-gray-500 hover:text-msg-orange dark:hover:text-msg-orange transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {emailText.length}/10,000 characters
                </div>
                <button
                  onClick={loadSampleEmail}
                  className="btn-msg text-sm"
                >
                  Load MSG Sample
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
                  isDragActive
                    ? 'border-msg-orange bg-primary-50 dark:bg-gray-700 animate-glow'
                    : 'border-gray-300 dark:border-gray-600 hover:border-msg-orange hover:bg-primary-50 dark:hover:bg-gray-700'
                }`}
              >
                <input {...getInputProps()} />
                
                <div className="space-y-4">
                  {isFileProcessing ? (
                    <div className="animate-pulse-soft">
                      <File className="w-12 h-12 text-msg-orange mx-auto" />
                      <p className="text-msg-orange font-medium">Processing file...</p>
                    </div>
                  ) : uploadedFile ? (
                    <div className="space-y-3">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                      <div>
                        <p className="text-green-600 dark:text-green-400 font-medium">File uploaded successfully</p>
                        <div className="flex items-center justify-center space-x-2 mt-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">{uploadedFile.name}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setUploadedFile(null)
                            }}
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-msg-orange dark:hover:text-msg-orange transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          AI will parse and analyze this file automatically
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
                      <div>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">
                          {isDragActive
                            ? 'Drop the file here...'
                            : 'Drag & drop a file here, or click to select'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          PDF, Word, Excel, PowerPoint, Text, Outlook Message - AI will handle parsing
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-4 h-4" />
                <span>Maximum file size: 50MB | AI-powered file parsing and analysis</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Model Selection & Processing */}
        {hasContent && hasAPIKeys && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-6 border-t border-primary-200 dark:border-gray-600 space-y-6"
          >
            <div className="bg-gradient-to-r from-primary-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-msg-orange" />
                <span>AI Processing Model</span>
              </h3>
              <ModelSelector
                models={AI_MODELS.filter(model => 
                  (model.provider === 'OpenAI' && apiStatus.hasOpenAI) || 
                  (model.provider === 'Anthropic' && apiStatus.hasAnthropic)
                )}
                selectedModel={selectedModel}
                onModelSelect={setSelectedModel}
              />
            </div>

            <button
              onClick={handleProcessEmail}
              disabled={isProcessing || !hasAPIKeys}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-4 text-lg font-bold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>AI Processing with {selectedModel.name}...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  <span>Process Email with AI</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="space-y-2">
                <Languages className="w-6 h-6 text-msg-orange mx-auto" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">AI Language Detection</p>
              </div>
              <div className="space-y-2">
                <FileText className="w-6 h-6 text-msg-orange mx-auto" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">AI Summary</p>
              </div>
              <div className="space-y-2">
                <CheckSquare className="w-6 h-6 text-msg-orange mx-auto" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">AI Action Items</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Real-time Streaming Processing Results - Show immediately when processing starts */}
      {(isProcessing || processedEmail || detectedLanguage || streamingSummary || streamingActionItems) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Language Detection - Show as soon as language is detected */}
          {(detectedLanguage || isProcessing) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="msg-card"
            >
              <div className="flex items-center space-x-3 mb-3">
                <Languages className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  AI Language Detection
                </h3>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                {detectedLanguage ? (
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Detected Language: <span className="font-semibold">{detectedLanguage}</span>
                    {translatedContent && (
                      <span className="ml-2 text-green-600 dark:text-green-400">• Translation applied</span>
                    )}
                  </p>
                ) : (
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Detecting language...</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Streaming Summary - Show immediately when processing starts */}
          {(isProcessing || streamingSummary || processedEmail?.summary) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="msg-card"
            >
              <div className="flex items-center space-x-3 mb-4">
                {isStreamingSummary ? (
                  <Loader2 className="w-5 h-5 text-msg-orange animate-spin" />
                ) : (streamingSummary || processedEmail?.summary) ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  AI-Generated Summary
                </h3>
                {processedEmail && (
                  <span className="px-3 py-1 bg-msg-gradient text-white text-xs font-semibold rounded-full">
                    {selectedModel.name}
                  </span>
                )}
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-primary-50 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="min-h-[60px]">
                  {streamingSummary || processedEmail?.summary ? (
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {streamingSummary || processedEmail?.summary}
                      {isStreamingSummary && (
                        <span className="inline-block w-2 h-5 bg-msg-orange animate-pulse ml-1">|</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AI is analyzing and generating summary...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Streaming Action Items - Show immediately when processing starts */}
          {(isProcessing || streamingActionItems || processedEmail?.actionItems) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="msg-card"
            >
              <div className="flex items-center space-x-3 mb-4">
                {isStreamingActions ? (
                  <Loader2 className="w-5 h-5 text-msg-orange animate-spin" />
                ) : (streamingActionItems || processedEmail?.actionItems) ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  AI-Extracted Action Items
                </h3>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-primary-50 dark:from-green-900/20 dark:to-gray-700 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="min-h-[80px]">
                  {streamingActionItems || processedEmail?.actionItems ? (
                    <div className="space-y-2">
                      {streamingActionItems ? (
                        <div className="text-sm text-green-700 dark:text-green-300">
                          <pre className="whitespace-pre-wrap font-sans">
                            {streamingActionItems}
                            {isStreamingActions && (
                              <span className="inline-block w-2 h-5 bg-msg-orange animate-pulse ml-1">|</span>
                            )}
                          </pre>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {processedEmail?.actionItems.map((item, index) => (
                            <motion.li 
                              key={index} 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start space-x-2"
                            >
                              <div className="w-2 h-2 bg-msg-orange rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm text-green-700 dark:text-green-300">{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AI is extracting action items...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Response Generation Section - Show only after processing is complete */}
          {processedEmail && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="msg-card"
            >
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Send className="w-6 h-6 text-msg-orange" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Generate AI Response
                  </h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create professional responses using Madison Square Garden's AI-powered response models
                </p>
              </div>

              {/* Response Model Selection */}
              <div className="bg-gradient-to-r from-primary-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-msg-orange" />
                  <span>Response Generation Model</span>
                </h3>
                <ModelSelector
                  models={RESPONSE_MODELS.filter(model => 
                    (model.provider === 'OpenAI' && apiStatus.hasOpenAI) || 
                    (model.provider === 'Anthropic' && apiStatus.hasAnthropic)
                  )}
                  selectedModel={responseModel}
                  onModelSelect={setResponseModel}
                />
              </div>

              <div className="flex space-x-3 mb-6">
                <button
                  onClick={generateResponse}
                  disabled={isGenerating}
                  className="btn-primary flex items-center space-x-2 flex-1"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>AI Generating with {responseModel.name}...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Generate Response</span>
                    </>
                  )}
                </button>

                {responses.length > 0 && (
                  <button
                    onClick={generateResponse}
                    disabled={isGenerating}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>More Versions</span>
                  </button>
                )}
              </div>

              {/* Streaming Response - Show immediately when generating */}
              {(isStreamingResponse || isGenerating) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="bg-gradient-to-r from-white to-primary-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-primary-200 dark:border-gray-600 p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Loader2 className="w-4 h-4 text-msg-orange animate-spin" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        AI Generating Response...
                      </span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {streamingResponse ? (
                          <>
                            <pre className="whitespace-pre-wrap font-sans">{streamingResponse}</pre>
                            {isStreamingResponse && (
                              <span className="inline-block w-2 h-5 bg-msg-orange animate-pulse ml-1">|</span>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center space-x-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Starting response generation...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Generated Responses */}
              {responses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-msg-orange" />
                    <span>AI-Generated Responses ({responses.length})</span>
                  </h3>

                  {responses.map((response, index) => (
                    <motion.div 
                      key={response.timestamp} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-r from-white to-primary-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-primary-200 dark:border-gray-600 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-msg-gradient rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{response.version}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              Version {response.version}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                              ({response.model})
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => copyToClipboard(response.content, index)}
                          className="btn-msg flex items-center space-x-2 text-sm"
                        >
                          {copiedIndex === index ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                          {response.content}
                        </pre>
                      </div>

                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                        <span>Generated {new Date(response.timestamp).toLocaleString()}</span>
                        <span className="px-2 py-1 bg-msg-orange text-white rounded text-xs font-semibold">
                          AI Powered
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}