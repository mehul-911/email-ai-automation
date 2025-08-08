'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, RefreshCw, Plus, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { AIModel, ProcessedEmail, GeneratedResponse } from '../types'
import ModelSelector from './model-selector'
import ResponseList from './response-list'

interface ResponseGeneratorProps {
  processedEmail: ProcessedEmail
}

const RESPONSE_MODELS: AIModel[] = [
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Creative and detailed responses' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Professional responses' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Comprehensive responses' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Quick and concise responses' }
]

export default function ResponseGenerator({ processedEmail }: ResponseGeneratorProps) {
  const [responseModel, setResponseModel] = useState<AIModel>(RESPONSE_MODELS[0])
  const [responses, setResponses] = useState<GeneratedResponse[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateResponse = async () => {
    if (!processedEmail) return

    setIsGenerating(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const newResponse: GeneratedResponse = {
        content: generateSampleResponse(responseModel, responses.length + 1),
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="msg-card"
    >
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Send className="w-6 h-6 text-msg-orange" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Generate Email Response
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
        <ResponseList responses={responses} />
      )}
    </motion.div>
  )
}

function generateSampleResponse(model: AIModel, version: number): string {
  const responses = [
    `Dear Team,

Thank you for the comprehensive update on our upcoming Madison Square Garden events. I appreciate the detailed coordination plan and clear action items outlined.

Our department is fully prepared to support these initiatives:

Event Coordination:
• Rangers game preparation - Security protocols reviewed and concessions team briefed
• Concert series setup - Sound system specifications confirmed with technical team
• Corporate event execution - Catering vendors coordinated and VIP arrangements finalized

Status Report:
I will ensure our department status report is completed and submitted by Thursday as requested. The report will include resource allocation, staff scheduling updates, and equipment readiness assessments.

I'm available to attend the Friday 10 AM coordination meeting in Conference Room A and look forward to discussing any additional requirements or adjustments needed for seamless event execution.

Thank you for your leadership in ensuring MSG maintains its standard of excellence.

Best regards,
[Your Name]
[Department] - Madison Square Garden`,

    `Hi Sarah,

Thank you for the detailed event coordination update. I'm committed to ensuring our department's full support for all upcoming Madison Square Garden events.

Action Items - Confirmed:
✓ Department status reports - Will be submitted by Thursday EOD
✓ Friday coordination meeting - Confirmed attendance at 10 AM, Conference Room A
✓ Event preparation - Teams are already coordinating for seamless execution

Specific Preparations Underway:
• Rangers Game: Security clearances updated, concessions inventory confirmed
• Concert Series: Technical specifications reviewed, artist requirements documented
• Corporate Events: VIP seating arrangements finalized, catering protocols established
• Staff Coverage: Scheduling optimized for all events with backup personnel identified

Our team understands the importance of maintaining MSG's reputation for exceptional event experiences. We're ready to execute at the highest level.

Please let me know if there are any specific areas where additional focus or resources would be beneficial.

Looking forward to Friday's coordination session.

Best,
[Your Name]
Madison Square Garden Operations`,

    `Dear Sarah,

I've received your update regarding the upcoming events at The World's Most Famous Arena. Thank you for the clear coordination timeline and comprehensive action items.

Department Readiness Report:

Event Preparation Status:
→ Rangers Game (Friday): All departments synchronized, security and concessions teams briefed
→ Concert Series: Technical requirements reviewed, artist hospitality arrangements confirmed  
→ Corporate Events: Premium services activated, VIP experience protocols implemented
→ Equipment & Facilities: Maintenance schedules aligned with event requirements

Deliverables Timeline:
→ Department status report: Completion targeted for Wednesday, submission by Thursday
→ Staff scheduling matrix: Optimized coverage confirmed for all events
→ Resource allocation plan: Budget and personnel assignments finalized

I'll be present at Friday's 10 AM coordination meeting in Conference Room A with our comprehensive readiness assessment and any recommendations for enhanced execution.

The success of these events reflects on MSG's legacy of excellence, and our department is committed to upholding that standard.

Thank you for your exceptional coordination efforts.

Respectfully,
[Your Name]
[Department Title]
Madison Square Garden Entertainment`
  ]

  return responses[(version - 1) % responses.length]
}