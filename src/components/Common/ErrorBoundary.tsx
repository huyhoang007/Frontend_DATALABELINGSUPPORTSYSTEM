import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
          }}
        >
          <Card sx={{ maxWidth: 500, width: '100%', mx: 2 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              
              <Typography variant="h4" component="h1" gutterBottom color="error">
                Oops! Có lỗi xảy ra
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Ứng dụng gặp lỗi không mong muốn. Vui lòng thử lại hoặc liên hệ hỗ trợ.
              </Typography>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="error" sx={{ fontFamily: 'monospace' }}>
                    {this.state.error.message}
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                onClick={this.handleReload}
                size="large"
              >
                Tải lại trang
              </Button>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;