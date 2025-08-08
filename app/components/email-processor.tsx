'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Loader2, Languages, FileText, CheckSquare, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { AIModel, ProcessedEmail } from '../types'
import ModelSelector from './model-selector'

interface EmailData {
  content: string
  fileName: string
  fileType: string
  size: number
}

interface EmailProcessorProps {
  emailData: EmailData
  onProcess: (processed: ProcessedEmail) => void
}

const AI_MODELS: AIModel[] = [
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced performance and speed' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Highest quality analysis' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Advanced reasoning capabilities' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient processing' }
]

export default function EmailProcessor({ emailData, onProcess }: EmailProcessorProps) {
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcessEmail = async () => {
    if (!emailData.content.trim()) {
      toast.error('No content to process')
      return
    }

    setIsProcessing(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2500))

      const processed: ProcessedEmail = {
        originalContent: emailData.content,
        translatedContent: simulateTranslation(emailData.content),
        summary: simulateSummary(emailData.content),
        actionItems: simulateActionItems(emailData.content),
        language: detectLanguage(emailData.content),
        wasTranslated: !isEnglish(emailData.content)
      }

      onProcess(processed)
      toast.success('Email processed successfully with ' + selectedModel.name + '!')
    } catch (error) {
      toast.error('Processing failed. Please try again.')
      console.error('Processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
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
  )
}

// Utility functions
function simulateTranslation(content: string): string | undefined {
  if (isEnglish(content)) return undefined
  return `[Translated] ${content}`
}

function simulateSummary(content: string): string {
  return `This email addresses key Madison Square Garden operational matters including event coordination, staff scheduling, and departmental collaboration. The sender is requesting preparation of status reports and coordination for upcoming events with specific deadlines mentioned for optimal venue operations.`
}

function simulateActionItems(content: string): string[] {
  return [
    'Prepare department status reports by Thursday deadline',
    'Attend coordination meeting Friday at 10 AM in Conference Room A',
    'Review event specifications and artist requirements',
    'Coordinate with security and concessions teams for Rangers game',
    'Finalize catering arrangements and VIP seating for corporate events',
    'Complete equipment maintenance and pre-event inspections'
  ]
}

function detectLanguage(content: string): string {
  return 'English'
}

function isEnglish(content: string): boolean {
  return true
}