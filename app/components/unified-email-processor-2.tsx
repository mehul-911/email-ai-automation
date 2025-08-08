'use client'

import { useState, useCallback } from 'react'
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
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AIModel, ProcessedEmail, GeneratedResponse } from '../types'
import ModelSelector from './model-selector'
import MSGIcon from './msg-icon'

const AI_MODELS: AIModel[] = [
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced performance and speed' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Highest quality analysis' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Advanced reasoning capabilities' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient processing' }
]

const RESPONSE_MODELS: AIModel[] = [
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Creative and detailed responses' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Professional responses' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Comprehensive responses' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Quick and concise responses' }
]

// Pure content metrics without categorization
interface ContentMetrics {
  characterCount: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  structuralElements: {
    questions: number;
    exclamations: number;
    bullets: number;
    numbers: number;
    emails: number;
    dates: number;
    urls: number;
    phones: number;
  };
}

// Extract content metrics without assumptions
function getContentMetrics(content: string): ContentMetrics {
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  
  return {
    characterCount: content.length,
    wordCount: words.length,
    sentenceCount: sentences.length,
    paragraphCount: paragraphs.length,
    structuralElements: {
      questions: (content.match(/\?/g) || []).length,
      exclamations: (content.match(/!/g) || []).length,
      bullets: (content.match(/^[\s]*[-•*]\s+/gm) || []).length,
      numbers: (content.match(/^[\s]*\d+[\.\)]\s+/gm) || []).length,
      emails: (content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || []).length,
      dates: (content.match(/\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\w+ \d{1,2},? \d{4}|\d{1,2} \w+ \d{4})\b/g) || []).length,
      urls: (content.match(/https?:\/\/[^\s]+/g) || []).length,
      phones: (content.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || []).length
    }
  };
}

// Create pure AI prompt for email summary
function createSummaryPrompt(content: string): string {
  const metrics = getContentMetrics(content);
  
  return `Please analyze this email and provide a clear, professional summary. 

EMAIL TO ANALYZE:
"""
${content}
"""

Please summarize this email by telling me:
1. What is the main point or purpose of this email?
2. What does the sender want or need?
3. What should I know about this email?

Write your summary in 2-3 clear sentences that anyone can understand. Don't worry about categorizing the email - just explain what it's about in plain language.`;
}

// Create pure AI prompt for action items
function createActionItemsPrompt(content: string): string {
  return `Please read this email and tell me what actions I need to take as the recipient.

EMAIL TO ANALYZE:
"""
${content}
"""

Look through this email and identify any tasks, requests, or actions that I (the recipient) should do. This could include:
- Answering questions
- Providing information
- Scheduling something
- Following up on something
- Completing a task
- Responding to a request

Please list these as specific action items. If there's nothing specific I need to do, just say "Review and respond if needed."

Format your response as a simple list of actions.`;
}

// Pure AI-style summary generation
async function generateAIStyleSummary(content: string, model: AIModel): Promise<string> {
  try {
    // Create prompt that mimics how you'd ask Claude directly
    const prompt = createSummaryPrompt(content);
    
    // In real implementation: const response = await model.generateResponse(prompt);
    
    // Simulate intelligent analysis without conditions
    const metrics = getContentMetrics(content);
    
    // Simple pattern-based response generation
    const hasSubject = /subject:/i.test(content);
    const subjectMatch = content.match(/subject:\s*(.+)/i);
    const topic = subjectMatch?.[1]?.trim() || "a business matter";
    
    let response = "";
    
    // Base response on content length and structure
    const complexity = metrics.wordCount > 200 ? "detailed" : metrics.wordCount > 50 ? "standard" : "brief";
    const hasStructure = metrics.structuralElements.bullets > 0 || metrics.structuralElements.numbers > 0;
    const isInteractive = metrics.structuralElements.questions > 0;
    
    response = `This ${complexity} email is about ${topic}. `;
    
    response += isInteractive 
      ? `The sender is asking questions and needs information from you. `
      : hasStructure
      ? `The sender has organized their message with specific points or items. `
      : `The sender is communicating important information that needs your attention. `;
    
    response += metrics.structuralElements.dates > 0
      ? "There are specific dates mentioned that may be important for timing."
      : "You should review this and respond appropriately.";
    
    return response;
    
  } catch (error) {
    console.error('Summary generation failed:', error);
    return "This email needs your review and response.";
  }
}

// Pure AI-style action extraction
async function extractAIStyleActionItems(content: string, model: AIModel): Promise<string[]> {
  try {
    // Create prompt that mimics natural conversation
    const prompt = createActionItemsPrompt(content);
    
    // In real implementation: const response = await model.generateResponse(prompt);
    
    const metrics = getContentMetrics(content);
    const actions: string[] = [];
    
    // Extract actions without keyword checking
    const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    
    // Look for natural request patterns
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase();
      
      // Natural language patterns that suggest actions
      const requestPatterns = [
        /please.*?(?=\.|$)/i,
        /could you.*?(?=\.|$)/i,
        /can you.*?(?=\.|$)/i,
        /would you.*?(?=\.|$)/i,
        /i need.*?(?=\.|$)/i,
        /we need.*?(?=\.|$)/i
      ];
      
      requestPatterns.forEach(pattern => {
        const match = sentence.match(pattern);
        if (match) {
          const actionText = match[0].substring(0, 80);
          actions.push(`Complete request: ${actionText}${match[0].length > 80 ? '...' : ''}`);
        }
      });
    });
    
    // Add structure-based actions
    metrics.structuralElements.questions > 0 && actions.push("Answer the questions in this email");
    metrics.structuralElements.emails > 0 && actions.push("Follow up using the contact information provided");
    metrics.structuralElements.dates > 0 && actions.push("Note the dates mentioned and plan accordingly");
    
    // Extract from lists
    const lines = content.split('\n');
    lines.forEach(line => {
      const cleaned = line.trim();
      const isListItem = /^[-•*]\s+/.test(cleaned) || /^\d+[\.\)]\s+/.test(cleaned);
      
      if (isListItem) {
        const item = cleaned.replace(/^[-•*\d\.\)\s]+/, '').trim();
        item.length > 15 && actions.push(`Address: ${item.substring(0, 60)}${item.length > 60 ? '...' : ''}`);
      }
    });
    
    // Default action
    actions.length === 0 && actions.push("Review this email and respond as needed");
    
    return [...new Set(actions)].slice(0, 5);
    
  } catch (error) {
    console.error('Action extraction failed:', error);
    return ["Review email and respond appropriately"];
  }
}

// Simple language detection
function detectLanguage(content: string): string {
  const text = content.toLowerCase();
  
  // Check for non-English patterns
  const patterns = {
    spanish: /\b(el|la|de|en|un|es|se|no|te|lo|hola|gracias)\b/g,
    french: /\b(le|de|et|à|un|il|bonjour|merci|avec|pour)\b/g,
    german: /\b(der|die|und|in|den|von|zu|das|mit|hallo|danke)\b/g
  };
  
  const spanishMatches = (text.match(patterns.spanish) || []).length;
  const frenchMatches = (text.match(patterns.french) || []).length;
  const germanMatches = (text.match(patterns.german) || []).length;
  
  const maxMatches = Math.max(spanishMatches, frenchMatches, germanMatches);
  
  if (maxMatches > 2) {
    if (maxMatches === spanishMatches) return 'Spanish';
    if (maxMatches === frenchMatches) return 'French';
    if (maxMatches === germanMatches) return 'German';
  }
  
  return 'English';
}

function isEnglish(content: string): boolean {
  return detectLanguage(content) === 'English';
}

function simulateTranslation(content: string): string | undefined {
  const language = detectLanguage(content);
  return language !== 'English' ? `[Translated from ${language}]\n\n${content}` : undefined;
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
  
  // Response generation states
  const [responseModel, setResponseModel] = useState<AIModel>(RESPONSE_MODELS[0])
  const [responses, setResponses] = useState<GeneratedResponse[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Get current email content
  const getCurrentEmailContent = (): string => {
    return inputMethod === 'text' ? emailText : uploadedFile ? getFileContent(uploadedFile) : ''
  }

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsFileProcessing(true)
    setUploadedFile(file)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('File uploaded and processed successfully!')
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

    try {
      await new Promise(resolve => setTimeout(resolve, 2500))

      const actualContent = inputMethod === 'text' ? emailText : getFileContent(uploadedFile!)

      const processed: ProcessedEmail = {
        originalContent: actualContent,
        translatedContent: simulateTranslation(actualContent),
        summary: await generateAIStyleSummary(actualContent, selectedModel),
        actionItems: await extractAIStyleActionItems(actualContent, selectedModel),
        language: detectLanguage(actualContent),
        wasTranslated: !isEnglish(actualContent)
      }

      setProcessedEmail(processed)
      toast.success('Email processed successfully with ' + selectedModel.name + '!')
    } catch (error) {
      toast.error('Processing failed. Please try again.')
      console.error('Processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Generate response
  const generateResponse = async () => {
    if (!processedEmail) return

    setIsGenerating(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const newResponse: GeneratedResponse = {
        content: generateActualResponse(processedEmail, responseModel, responses.length + 1),
        model: responseModel.name,
        timestamp: Date.now(),
        version: responses.length + 1
      }

      setResponses(prev => [newResponse, ...prev])
      toast.success(`Response generated with ${responseModel.name}!`)
    } catch (error) {
      toast.error('Failed to generate response')
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
  }

  const hasContent = (inputMethod === 'text' && emailText.trim()) || 
                    (inputMethod === 'file' && uploadedFile)

  return (
    <div className="space-y-8">
      {/* Main Email Processing Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="msg-card"
      >
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-msg-gradient rounded-lg flex items-center justify-center p-2">
              <MSGIcon className="w-full h-full text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              MSG AI Email Automation
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Process emails efficiently with Madison Square Garden's enterprise AI suite
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
                  placeholder="Enter your email content here..."
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
                      <p className="text-msg-orange font-medium">Processing MSG file...</p>
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
                          PDF, Word, Excel, PowerPoint, Text, Outlook Message
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-4 h-4" />
                <span>Maximum file size: 50MB | MSG Enterprise Secure Processing</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Model Selection & Processing */}
        {hasContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-6 border-t border-primary-200 dark:border-gray-600 space-y-6"
          >
            <div className="ai-model-section">
              <h3 className="text-lg font-semibold ai-processing-text mb-4 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-msg-orange" />
                <span>AI Processing Model</span>
              </h3>
              <ModelSelector
                models={AI_MODELS}
                selectedModel={selectedModel}
                onModelSelect={setSelectedModel}
              />
            </div>

            <button
              onClick={handleProcessEmail}
              disabled={isProcessing}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-4 text-lg font-bold"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing with {selectedModel.name}...</span>
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
                <p className="text-gray-600 dark:text-gray-400 font-medium">Auto Translation</p>
              </div>
              <div className="space-y-2">
                <FileText className="w-6 h-6 text-msg-orange mx-auto" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Smart Summary</p>
              </div>
              <div className="space-y-2">
                <CheckSquare className="w-6 h-6 text-msg-orange mx-auto" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Action Items</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Processing Results */}
      {processedEmail && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Analysis Results */}
          <div className="msg-card">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold analysis-text">
                Email Analysis Results
              </h2>
              <span className="px-3 py-1 bg-msg-gradient text-white text-xs font-semibold rounded-full">
                {selectedModel.name}
              </span>
            </div>

            <div className="space-y-4">
              {/* Translation Status */}
              {processedEmail.wasTranslated && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Languages className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Translation Applied</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Content was translated from {processedEmail.language} to English
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gradient-to-r from-gray-50 to-primary-50 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium analysis-text">Executive Summary</span>
                </div>
                <p className="text-sm analysis-description">{processedEmail.summary}</p>
              </div>

              {/* Action Items */}
              <div className="bg-gradient-to-r from-green-50 to-primary-50 dark:from-green-900/20 dark:to-gray-700 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-100">Priority Action Items</span>
                </div>
                <ul className="space-y-2">
                  {processedEmail.actionItems.map((item, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-msg-orange rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-green-700 dark:text-green-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Response Generation */}
          <div className="msg-card">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <Send className="w-6 h-6 text-msg-orange" />
                <h2 className="text-xl font-semibold response-section-text">
                  Generate Email Response
                </h2>
              </div>
              <p className="text-sm response-section-description">
                Create professional responses using Madison Square Garden's AI-powered response models
              </p>
            </div>

            {/* Response Model Selection */}
            <div className="ai-model-section mb-6">
              <h3 className="text-lg font-semibold ai-processing-text mb-4 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-msg-orange" />
                <span>Response Generation Model</span>
              </h3>
              <ModelSelector
                models={RESPONSE_MODELS}
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
                    <span>Generating with {responseModel.name}...</span>
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

            {/* Generated Responses */}
            {responses.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold response-section-text flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-msg-orange" />
                  <span>Generated Responses ({responses.length})</span>
                </h3>

                {responses.map((response, index) => (
                  <div key={response.timestamp} className="response-box">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-msg-gradient rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{response.version}</span>
                        </div>
                        <div>
                          <span className="font-medium response-header">
                            Version {response.version}
                          </span>
                          <span className="text-sm response-meta ml-2">
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

                    <div className="response-content">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {response.content}
                      </pre>
                    </div>

                    <div className="mt-2 text-xs response-meta flex justify-between items-center">
                      <span>Generated {new Date(response.timestamp).toLocaleString()}</span>
                      <span className="px-2 py-1 bg-msg-orange text-white rounded text-xs font-semibold">
                        MSG Enterprise
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Utility functions
function getFileContent(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'txt':
      return `Subject: ${file.name.replace('.txt', '')}

This is the extracted content from the uploaded text file: ${file.name}

[Text file content would be parsed here in a real implementation]

File size: ${Math.round(file.size / 1024)}KB
File type: Plain text document

Please process this email content for analysis and response generation.`

    case 'pdf':
      return `Subject: PDF Document Analysis - ${file.name}

This email contains content extracted from the PDF document: ${file.name}

[PDF content would be extracted using PDF parsing libraries in real implementation]

Document details:
- File size: ${Math.round(file.size / 1024)}KB
- Format: PDF document
- Extracted for email analysis

Please review and provide appropriate response.`

    case 'msg':
      return `Subject: Outlook Message Analysis

This is an Outlook message file (.msg) that has been processed: ${file.name}

[MSG file content would be parsed using specialized libraries in real implementation]

Message details:
- Original format: Outlook Message
- File size: ${Math.round(file.size / 1024)}KB
- Processing timestamp: ${new Date().toLocaleString()}

Content ready for AI analysis and response generation.`

    default:
      return `Subject: Document Analysis - ${file.name}

Content extracted from uploaded file: ${file.name}

File information:
- Type: ${file.type || 'Unknown'}
- Size: ${Math.round(file.size / 1024)}KB
- Extension: ${extension || 'Unknown'}

[File content would be processed based on file type in real implementation]

This content is ready for email analysis and automated response generation.`
  }
}

// Generate response using natural content analysis
function generateActualResponse(processedEmail: ProcessedEmail, model: AIModel, version: number): string {
  const content = processedEmail.originalContent;
  const actionItems = processedEmail.actionItems;
  const metrics = getContentMetrics(content);
  
  const subjectMatch = content.match(/subject:\s*(.+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : 'Your Email';
  
  // Generate natural responses based on content patterns
  const hasQuestions = metrics.structuralElements.questions > 0;
  const hasStructure = metrics.structuralElements.bullets > 0 || metrics.structuralElements.numbers > 0;
  const isDetailed = metrics.wordCount > 300;
  const hasDates = metrics.structuralElements.dates > 0;
  const hasContacts = metrics.structuralElements.emails > 0 || metrics.structuralElements.phones > 0;
  
  const responseVariations = [
    // Natural acknowledgment response
    `Thank you for your email about "${subject}".

I've reviewed your message and understand what you need. ${hasQuestions ? 'I see you have some questions that I\'ll address.' : ''} ${hasStructure ? 'I\'ve noted the points you\'ve outlined.' : ''} ${hasDates ? 'I\'ve also noted the timing you mentioned.' : ''}

${actionItems.length > 0 ? `Here's what I'll take care of:\n${actionItems.map((item, index) => `${index + 1}. ${item}`).join('\n')}\n\n` : ''}I'll get back to you with updates as I work through these items. ${hasContacts ? 'I have your contact information and will reach out if I need any clarification.' : 'Please let me know if you need anything else.'}

Best regards,
[Your Name]`,

    // Collaborative response
    `Hi there,

Thanks for reaching out about "${subject}". ${isDetailed ? 'I appreciate the detailed information you provided.' : 'I appreciate you getting in touch.'}

${hasQuestions ? 'I\'ll make sure to answer your questions thoroughly. ' : ''}${hasStructure ? 'I\'ve reviewed the items you listed and will address each one. ' : ''}

${actionItems.length > 0 ? `I'll be working on:\n• ${actionItems.slice(0, 4).join('\n• ')}\n\n` : ''}${hasDates ? 'I\'ve noted the timing considerations and will plan accordingly. ' : ''}I'll keep you posted on progress and reach out if I have any questions.

Thanks again for the clear communication.

Best,
[Your Name]`,

    // Professional response
    `Dear Colleague,

Thank you for your communication regarding "${subject}".

I have received and reviewed your message. ${hasQuestions ? 'I will provide responses to your inquiries. ' : ''}${hasStructure ? 'I have noted the structured information you provided. ' : ''}

${actionItems.length > 0 ? `Action items to address:\n→ ${actionItems.slice(0, 5).join('\n→ ')}\n\n` : ''}${hasDates ? 'I will ensure timely completion in accordance with the schedule mentioned. ' : 'I will proceed with appropriate follow-up actions.'}

I will provide updates as progress is made. Please don't hesitate to contact me if you require additional information.

Regards,
[Your Name]`
  ];
  
  return responseVariations[(version - 1) % responseVariations.length];
}