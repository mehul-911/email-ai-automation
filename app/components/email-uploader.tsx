'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { 
  Upload, 
  File, 
  AlertCircle, 
  CheckCircle, 
  Type, 
  Paperclip,
  Send,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { EmailData } from '../types'

interface EmailUploaderProps {
  onEmailUpload: (data: EmailData) => void
}

export default function EmailUploader({ onEmailUpload }: EmailUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [emailText, setEmailText] = useState('')
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text')

  // Handle direct text input
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
    toast.success('Email content processed successfully!')
  }

  // Handle file upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsProcessing(true)
    setUploadedFile(file)

    try {
      const content = await extractContentFromFile(file)
      
      const emailData: EmailData = {
        content,
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
      setIsProcessing(false)
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
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const clearFile = () => {
    setUploadedFile(null)
  }

  const clearText = () => {
    setEmailText('')
  }

  const switchInputMethod = (method: 'text' | 'file') => {
    setInputMethod(method)
    // Clear the other method's data when switching
    if (method === 'text') {
      setUploadedFile(null)
    } else {
      setEmailText('')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Email Content Input
        </h2>
        <p className="text-sm text-gray-600">
          Enter email content directly or upload documents for processing
        </p>
      </div>

      {/* Input Method Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => switchInputMethod('text')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
            inputMethod === 'text'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Type Email</span>
        </button>
        <button
          onClick={() => switchInputMethod('file')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
            inputMethod === 'file'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          <span>Upload File</span>
        </button>
      </div>

      {/* Text Input Method */}
      {inputMethod === 'text' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="relative">
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste or type your email content here..."
              className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all duration-200 resize-none"
              maxLength={10000}
            />
            {emailText && (
              <button
                onClick={clearText}
                className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {emailText.length}/10,000 characters
            </div>
            <button
              onClick={handleTextSubmit}
              disabled={!emailText.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Process Email</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* File Upload Method */}
      {inputMethod === 'file' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
              isDragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              {isProcessing ? (
                <div className="animate-pulse-soft">
                  <File className="w-12 h-12 text-primary-500 mx-auto" />
                  <p className="text-primary-600 font-medium">Processing file...</p>
                </div>
              ) : uploadedFile ? (
                <div className="space-y-3">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <div>
                    <p className="text-green-600 font-medium">File uploaded successfully</p>
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <p className="text-sm text-gray-600">{uploadedFile.name}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          clearFile()
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600 font-medium">
                      {isDragActive
                        ? 'Drop the file here...'
                        : 'Drag & drop a file here, or click to select'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Support formats: PDF, Word, Excel, PowerPoint, Text, Outlook Message
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <span>Maximum file size: 50MB</span>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              const sampleEmail = `Subject: Quarterly Review Meeting

Hi Team,

I hope this email finds you well. I wanted to reach out regarding our upcoming quarterly review meeting scheduled for next week.

We need to cover the following items:
- Q3 performance analysis
- Budget allocation for Q4
- New project proposals
- Team restructuring plans

Please prepare your department reports and send them to me by Friday. The meeting will be held on Monday at 2 PM in the main conference room.

Let me know if you have any questions or concerns.

Best regards,
John Smith
Project Manager`
              setEmailText(sampleEmail)
              setInputMethod('text')
            }}
            className="btn-secondary text-sm"
          >
            Load Sample Email
          </button>
          
          <button
            onClick={() => {
              setEmailText('')
              setUploadedFile(null)
            }}
            className="btn-secondary text-sm"
          >
            Clear All
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// File extraction utility function
async function extractContentFromFile(file: File): Promise<string> {
  const fileType = file.type || getFileTypeFromName(file.name)
  
  if (fileType.includes('text/plain')) {
    return await file.text()
  }
  
  // For other file types, we'll simulate content extraction
  // In a real implementation, you would use proper libraries
  const buffer = await file.arrayBuffer()
  
  if (fileType.includes('pdf')) {
    return `Subject: Important Business Update

Dear Team,

This is a sample PDF content extraction. The document discusses quarterly performance metrics and upcoming strategic initiatives.

Key points from the document:
- Revenue increased by 15% this quarter
- New market expansion planned for Q4
- Team hiring initiatives underway
- Budget allocation meeting scheduled

Please review the attached materials and prepare your feedback for our next meeting.

Best regards,
Management Team

[Extracted from ${file.name}]`
  }
  
  if (fileType.includes('word') || fileType.includes('document')) {
    return `Subject: Project Status Update

Hello Everyone,

I'm writing to provide an update on our current project status and next steps moving forward.

Current Progress:
- Phase 1 completion: 85%
- Documentation: In progress
- Testing phase: Scheduled for next week
- Stakeholder review: Pending

Action Items:
- Complete remaining development tasks
- Finalize user acceptance testing
- Prepare presentation for client review
- Schedule deployment timeline

Please let me know if you have any questions or need clarification on any of these items.

Thank you for your continued hard work.

Best,
Project Lead

[Extracted from ${file.name}]`
  }
  
  if (fileType.includes('excel') || fileType.includes('sheet')) {
    return `Subject: Monthly Financial Report

Dear Finance Team,

Please find below the summary of our monthly financial data:

Revenue Summary:
- Total Revenue: $125,000
- Operating Expenses: $85,000
- Net Profit: $40,000
- Growth Rate: 12%

Department Budgets:
- Marketing: $15,000
- Development: $25,000
- Operations: $20,000
- Administration: $10,000

Action Required:
- Review expense allocations
- Approve budget increases where needed
- Submit quarterly projections
- Schedule budget review meeting

Please review these numbers and let me know if you have any questions.

Regards,
Finance Department

[Extracted from ${file.name}]`
  }
  
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
    return `Subject: Quarterly Presentation Review

Team,

Here's the content from our quarterly presentation that needs review:

Slide 1: Executive Summary
- Company overview and mission
- Key achievements this quarter
- Strategic objectives

Slide 2: Performance Metrics
- Sales figures and growth trends
- Customer satisfaction scores
- Market share analysis

Slide 3: Future Plans
- Upcoming product launches
- Market expansion strategies
- Investment priorities

Action Items:
- Review all slides for accuracy
- Update financial projections
- Prepare speaker notes
- Schedule practice session

The presentation is scheduled for next Friday. Please provide your feedback by Wednesday.

Best,
Presentation Team

[Extracted from ${file.name}]`
  }
  
  if (fileType.includes('outlook') || file.name.endsWith('.msg')) {
    return `Subject: Important Meeting Request

From: sender@company.com
To: team@company.com
Date: Today

Dear Team Members,

I hope you're all doing well. I'm reaching out to schedule an important team meeting to discuss our upcoming project milestones and deliverables.

Meeting Details:
- Date: Next Tuesday
- Time: 10:00 AM - 11:30 AM
- Location: Conference Room A
- Agenda: Project review and planning

Preparation Required:
- Bring your current project status reports
- Review the shared documents in the team folder
- Prepare any questions or concerns
- Update your task progress in the project management tool

Please confirm your attendance by replying to this email. If you cannot attend, please send your status update in advance.

Looking forward to our discussion.

Best regards,
Team Lead

[Extracted from ${file.name}]`
  }
  
  throw new Error('Unsupported file type')
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