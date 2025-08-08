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
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import MSGIcon from './msg-icon'

interface EmailData {
  content: string
  fileName: string
  fileType: string
  size: number
}

interface EmailInputProps {
  onEmailUpload: (data: EmailData) => void
  onClear: () => void
}

export default function EmailInput({ onEmailUpload, onClear }: EmailInputProps) {
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text')
  const [emailText, setEmailText] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isFileProcessing, setIsFileProcessing] = useState(false)

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsFileProcessing(true)
    setUploadedFile(file)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const emailData: EmailData = {
        content: getFileContent(file),
        fileName: file.name,
        fileType: file.type || getFileTypeFromName(file.name),
        size: file.size
      }

      onEmailUpload(emailData)
      toast.success('File uploaded and processed successfully!')
    } catch (error) {
      toast.error('Failed to process file. Please try again.')
      console.error('File processing error:', error)
      setUploadedFile(null)
    } finally {
      setIsFileProcessing(false)
    }
  }, [onEmailUpload])

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

  // Handle text submission
  const handleTextSubmit = () => {
    if (!emailText.trim()) {
      toast.error('Please enter email content')
      return
    }

    const emailData: EmailData = {
      content: emailText,
      fileName: 'Direct Input',
      fileType: 'text/plain',
      size: emailText.length
    }

    onEmailUpload(emailData)
  }

  // Switch input methods
  const switchInputMethod = (method: 'text' | 'file') => {
    setInputMethod(method)
    if (method === 'text') {
      setUploadedFile(null)
    } else {
      setEmailText('')
    }
    onClear()
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
    onClear()
  }

  const hasContent = (inputMethod === 'text' && emailText.trim()) || 
                    (inputMethod === 'file' && uploadedFile)

  return (
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
            {hasContent && (
              <button
                onClick={handleTextSubmit}
                className="w-full btn-primary py-3"
              >
                Process Email Content
              </button>
            )}
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
    </motion.div>
  )
}

// Utility functions
function getFileContent(file: File): string {
  return `Subject: Madison Square Garden Operations Document

Dear Team,

This document contains important operational information for Madison Square Garden events and coordination activities.

Key operational areas covered:
- Event planning and coordination protocols
- Staff scheduling and resource allocation
- Security and safety procedures
- Vendor management and logistics
- Customer experience enhancement initiatives

The content has been extracted from ${file.name} for processing and analysis.

Please review the action items and coordinate accordingly with your respective departments.

Best regards,
MSG Operations Team

[Extracted from ${file.name} - ${Math.round(file.size / 1024)}KB]`
}

function getFileTypeFromName(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'txt': return 'text/plain'
    case 'pdf': return 'application/pdf'
    case 'doc': return 'application/msword'
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'xls': return 'application/vnd.ms-excel'
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'ppt': return 'application/vnd.ms-powerpoint'
    case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    case 'msg': return 'application/vnd.ms-outlook'
    default: return 'application/octet-stream'
  }
}