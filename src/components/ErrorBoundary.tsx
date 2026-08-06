import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** compact = inline panel fallback (viewport); default = full-screen */
  compact?: boolean;
  onReset?: () => void;
}

interface State {
  error: Error | null;
}

/**
 * Crash containment: a WebGL failure (or any render error) must not take down
 * the whole editor. Wrap <App/> at the root and EditorViewport separately.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("[pixelstage] render crash:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const reset = () => {
      this.setState({ error: null });
      this.props.onReset?.();
    };
    if (this.props.compact) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#0A0C10] p-6 text-center">
          <p className="text-sm text-[#E56CF0]">渲染器崩溃了 / Renderer crashed</p>
          <p className="max-w-md text-xs text-[#A4ADBF]">{this.state.error.message}</p>
          <button
            onClick={reset}
            className="rounded border border-[#323D54] px-3 py-1.5 text-xs text-[#EDEFF5] hover:bg-[#161927]"
          >
            重试 / Retry
          </button>
        </div>
      );
    }
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#0A0C10] p-8 text-center">
        <p className="text-lg text-[#E56CF0]">出错了 / Something went wrong</p>
        <p className="max-w-lg text-sm text-[#A4ADBF]">{this.state.error.message}</p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="rounded border border-[#323D54] px-4 py-2 text-sm text-[#EDEFF5] hover:bg-[#161927]"
          >
            重试 / Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded border border-[#323D54] px-4 py-2 text-sm text-[#EDEFF5] hover:bg-[#161927]"
          >
            重新加载 / Reload
          </button>
        </div>
      </div>
    );
  }
}
