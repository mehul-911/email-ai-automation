'use client'

import { motion } from 'framer-motion'
import { RefreshCw, Trash2 } from 'lucide-react'
import ThemeToggle from './theme-toggle'
import MSGIcon from './msg-icon'

interface HeaderProps {
  onClear: () => void
  onNewAutomation: () => void
}

export default function Header({ onClear, onNewAutomation }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="msg-header shadow-xl border-b border-gray-700 dark:border-gray-800"
    >
      <div className="container mx-auto px-6 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* MSG Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-msg-gradient rounded-lg flex items-center justify-center shadow-lg p-2">
                <MSGIcon className="w-full h-full text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Madison Square Garden
                </h1>
                <p className="text-orange-200 text-sm font-medium">
                  AI Email Automation Suite
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            <button
              onClick={onNewAutomation}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 text-white rounded-lg font-medium transition-all duration-200 backdrop-blur-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New Automation</span>
            </button>
            
            <button
              onClick={onClear}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/90 hover:bg-red-600 dark:bg-red-700/90 dark:hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Data</span>
            </button>
          </div>
        </div>
        
        {/* Subtitle */}
        <div className="mt-3 text-center">
          <p className="text-orange-100 dark:text-orange-200 text-sm">
            MSG's email processing and automation powered by AI
          </p>
        </div>
      </div>
    </motion.header>
  )
}