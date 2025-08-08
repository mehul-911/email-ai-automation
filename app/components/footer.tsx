'use client'

import { motion } from 'framer-motion'
import MSGIcon from './msg-icon'

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-16 bg-secondary-900 dark:bg-gray-950 text-white border-t border-gray-700 dark:border-gray-800"
    >
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-msg-gradient rounded-lg flex items-center justify-center p-1.5">
                <MSGIcon className="w-full h-full text-white" />
              </div>
              <h3 className="text-lg font-bold">Madison Square Garden</h3>
            </div>
            <p className="text-gray-300 dark:text-gray-400 text-sm">
              The World's Most Famous Arena - Leading entertainment and sports venue delivering extraordinary experiences.
            </p>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              <p>4 Pennsylvania Plaza</p>
              <p>New York, NY 10001</p>
            </div>
          </div>

          {/* AI Suite Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-msg-orange">AI Email Suite</h3>
            <ul className="space-y-2 text-sm text-gray-300 dark:text-gray-400">
              <li>• Multi-format document processing</li>
              <li>• AI-powered email analysis</li>
              <li>• Automated response generation</li>
              <li>• Enterprise-grade security</li>
              <li>• Real-time language translation</li>
              <li>• Dark/Light theme support</li>
            </ul>
          </div>

          {/* Legal & Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-msg-orange">Enterprise Solutions</h3>
            <div className="space-y-2 text-sm text-gray-300 dark:text-gray-400">
              <p>Powered by advanced AI models:</p>
              <ul className="ml-4 space-y-1">
                <li>• Anthropic Claude 3</li>
                <li>• OpenAI GPT-4</li>
                <li>• Custom enterprise models</li>
              </ul>
            </div>
            <div className="pt-4 border-t border-gray-700 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                For technical support or enterprise inquiries, contact IT Services.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-8 pt-6 border-t border-gray-700 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400 dark:text-gray-500">
              <p>© {new Date().getFullYear()} Madison Square Garden Entertainment Corp.</p>
              <p>All rights reserved. MSG, Madison Square Garden, and The World's Most Famous Arena are trademarks of Madison Square Garden Entertainment Corp.</p>
            </div>
            <div className="flex items-center space-x-6 text-xs text-gray-500 dark:text-gray-600">
              <a href="#" className="hover:text-msg-orange transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-msg-orange transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-msg-orange transition-colors">Enterprise License</a>
            </div>
          </div>
          
          {/* Additional MSG Copyright */}
          <div className="mt-4 pt-4 border-t border-gray-800 dark:border-gray-900 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-600">
              This AI Email Automation Suite is developed exclusively for Madison Square Garden Enterprise Operations.
              Unauthorized use, reproduction, or distribution is strictly prohibited.
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  )
}