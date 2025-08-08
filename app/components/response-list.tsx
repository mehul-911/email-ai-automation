'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Copy, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { GeneratedResponse } from '../types'

interface ResponseListProps {
  responses: GeneratedResponse[]
}

export default function ResponseList({ responses }: ResponseListProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
        <Sparkles className="w-5 h-5 text-msg-orange" />
        <span>Generated Responses ({responses.length})</span>
      </h3>

      {responses.map((response, index) => (
        <div 
          key={response.timestamp} 
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
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
              {response.content}
            </pre>
          </div>

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
            <span>Generated {new Date(response.timestamp).toLocaleString()}</span>
            <span className="px-2 py-1 bg-msg-orange text-white rounded text-xs font-semibold">
              MSG Enterprise
            </span>
          </div>
        </div>
      ))}
    </motion.div>
  )
}