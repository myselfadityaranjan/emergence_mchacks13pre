import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <div className="p-6 text-center text-red-200">
          <h2 className="text-xl font-semibold mb-2">Something went wrong.</h2>
          <p className="text-sm text-slate-300">
            {error?.message || "An unexpected error occurred."}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Check console for details. Try refreshing or restarting the emergence.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
