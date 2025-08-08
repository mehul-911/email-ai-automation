'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Languages, FileText, CheckSquare } from 'lucide-react'
import { ProcessedEmail } from '../types'

interface EmailAnalysisResultsProps {
  processedEmail: ProcessedEmail
  selectedModel: string
}

export default function EmailAnalysisResults({ 
  processedEmail, 
  selectedModel 
}: EmailAnalysisResultsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="msg-card"
    >
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle className="w-6 h-6 text-green-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Email Analysis Results
        </h2>
        <span className="px-3 py-1 bg-msg-gradient text-white text-xs font-semibold rounded-full">
          {selectedModel}
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
            <span className="font-medium text-gray-900 dark:text-gray-100">Executive Summary</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{processedEmail.summary}</p>
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
    </motion.div>
  )
}