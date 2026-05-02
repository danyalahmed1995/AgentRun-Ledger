import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Dashboard render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="error-page">
          <section className="alert">
            <h1>Dashboard error</h1>
            <p>The dashboard could not render. The API may still be running.</p>
            <pre>{this.state.error.message}</pre>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
