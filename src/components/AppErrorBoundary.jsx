import React from "react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: String(error?.message || "Unexpected application error"),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Keep detailed logs in console for debugging production white-screen crashes.
    console.error("[AppErrorBoundary] Caught runtime error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white shadow-lg rounded-xl border border-gray-200 p-6 sm:p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-600 mb-4">
            Page crash ho gaya. Please reload to recover.
          </p>
          <p className="text-xs text-red-600 break-words mb-6">
            {this.state.errorMessage}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleReload}
              className="h-10 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Reload Page
            </button>
            <a
              href="/#/login"
              className="h-10 px-4 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
