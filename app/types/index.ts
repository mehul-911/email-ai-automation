export interface EmailData {
    content: string
    fileName: string
    fileType: string
    size: number
  }
  
  export interface ProcessedEmail {
    originalContent: string
    translatedContent?: string
    summary: string
    actionItems: string[]
    language: string
    wasTranslated: boolean
  }
  
  export interface AIModel {
    id: string
    name: string
    provider: string
    description: string
  }
  
  export interface GeneratedResponse {
    content: string
    model: string
    timestamp: number
    version: number
  }