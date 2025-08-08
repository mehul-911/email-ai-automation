'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import EmailInput from './email-input'
import EmailProcessor from './email-processor'
import EmailAnalysisResults from './email-analysis-results'
import ResponseGenerator from './response-generator'
import { ProcessedEmail } from '../types'

interface EmailData {
  content: string
  fileName: string
  fileType: string
  size: number
}

export default function EmailAutomationContainer() {
  const [emailData, setEmailData] = useState<EmailData | null>(null)
  const [processedEmail, setProcessedEmail] = useState<ProcessedEmail | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('')

  const handleEmailUpload = (data: EmailData) => {
    setEmailData(data)
    setProcessedEmail(null)
  }

  const handleEmailProcess = (processed: ProcessedEmail) => {
    setProcessedEmail(processed)
  }

  const handleClear = () => {
    setEmailData(null)
    setProcessedEmail(null)
    setSelectedModel('')
  }

  return (
    <div className="space-y-8">
      {/* Email Input Section */}
      <EmailInput 
        onEmailUpload={handleEmailUpload} 
        onClear={handleClear}
      />

      {/* Email Processing Section */}
      {emailData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="msg-card"
        >
          <EmailProcessor 
            emailData={emailData} 
            onProcess={handleEmailProcess}
          />
        </motion.div>
      )}

      {/* Results and Response Generation */}
      {processedEmail && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Analysis Results */}
          <EmailAnalysisResults 
            processedEmail={processedEmail}
            selectedModel={selectedModel}
          />

          {/* Response Generation */}
          <ResponseGenerator processedEmail={processedEmail} />
        </motion.div>
      )}
    </div>
  )
}