import React from 'react';

type ErrorBoundaryState = {
    hasError: boolean;
    message: string;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
    constructor(props: React.PropsWithChildren) {
        super(props);
        this.state = {
            hasError: false,
            message: ''
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            message: error.message || 'Unknown renderer error'
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('Renderer error boundary caught error:', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#1a1a1a',
                    color: '#f5f5f5',
                    gap: '12px',
                    padding: '24px',
                    textAlign: 'center'
                }}>
                    <h1 style={{ fontSize: '20px' }}>CreoVox encountered an unexpected error</h1>
                    <p style={{ maxWidth: '720px', opacity: 0.85 }}>
                        The renderer process crashed while handling the current session. You can reload the app now.
                    </p>
                    <code style={{
                        background: '#2a2a2a',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        maxWidth: '720px',
                        overflow: 'auto'
                    }}>
                        {this.state.message}
                    </code>
                    <button
                        onClick={this.handleReload}
                        style={{
                            border: 'none',
                            borderRadius: '6px',
                            padding: '10px 14px',
                            background: '#4a9eff',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
