import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200 shadow-md text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-600 mb-4">
            An unexpected error occurred while rendering this page.
          </p>
          <div className="text-xs bg-red-50 p-3 rounded-lg text-red-800 font-mono text-left mb-6 overflow-auto max-h-32">
            {this.state.error?.toString()}
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 transition-all text-sm"
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
