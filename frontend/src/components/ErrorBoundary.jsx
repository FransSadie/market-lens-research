import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Unknown UI error" };
  }

  componentDidCatch(error, info) {
    console.error("Market Lens UI crash", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-app-shell px-6 py-10 text-ink">
          <div className="mx-auto max-w-3xl rounded-[2rem] border border-bad/50 bg-panel/95 p-8 shadow-pane-edge">
            <div className="text-[11px] uppercase tracking-[0.22em] text-bad">UI Error</div>
            <h1 className="mt-3 font-display text-3xl text-ink">The desk hit a runtime error</h1>
            <p className="mt-3 text-sm leading-6 text-mute">
              The app crashed while rendering. Reload the page once. If it happens again, the message below will help us pinpoint the component.
            </p>
            <pre className="mt-5 overflow-auto rounded-2xl border border-line/80 bg-bg/55 p-4 text-sm text-bad">{this.state.message}</pre>
            <button
              className="mt-5 rounded-2xl border border-accent/75 bg-accent/20 px-5 py-3 text-sm font-semibold text-ink shadow-pane-edge"
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload Desk
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
