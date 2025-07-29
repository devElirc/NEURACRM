import React from 'react'

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Left side - Copyright and branding */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-blue-600 font-bold text-lg">NeuraCRM</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-500">
                  © {currentYear} NeuraCRM. All rights reserved.
                </span>
              </div>
            </div>

            {/* Right side - Links */}
            <div className="flex items-center space-x-6">
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Support
              </a>
              <a
                href="#"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Documentation
              </a>
            </div>
          </div>

          {/* Bottom section - Version and additional info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <div className="text-xs text-gray-400">
                Version 1.0.0 • Built with React & Django
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <span>Status: Operational</span>
                <span>•</span>
                <span>Last updated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 