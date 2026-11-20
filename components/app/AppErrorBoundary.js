import { Component } from 'react';
import { reportBrowserError } from '../../lib/browserErrors.mjs';

export default class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch() {
    reportBrowserError({ kind: 'render_error', route: this.props.route });
  }

  render() {
    if (this.state.hasError) return <main role="alert" style={{ padding: 24 }}><h1>This page couldn’t load</h1><p>Reload the page to try again.</p><button type="button" onClick={() => window.location.reload()}>Reload page</button></main>;
    return this.props.children;
  }
}
