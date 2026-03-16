import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          minHeight: '100vh', backgroundColor: '#f5f5f5',
        }}>
          <div style={{
            maxWidth: 500, width: '100%', margin: '0 16px',
            background: '#fff', borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
            padding: '40px 32px', textAlign: 'center',
          }}>
            {/* Error icon */}
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>

            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>
              Oops! Có lỗi xảy ra
            </h1>

            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
              Ứng dụng gặp lỗi không mong muốn. Vui lòng thử lại hoặc liên hệ hỗ trợ.
            </p>

            {(import.meta as any).env?.DEV && this.state.error && (
              <div style={{
                marginBottom: 24, padding: '12px 16px',
                backgroundColor: '#fef2f2', borderRadius: 8,
                border: '1px solid #fecaca', textAlign: 'left',
              }}>
                <code style={{ fontSize: 12, color: '#dc2626', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {this.state.error.message}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 28px', background: '#2563eb', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
