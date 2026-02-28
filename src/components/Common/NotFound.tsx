import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { SearchOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <SearchOff sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          
          <Typography variant="h4" component="h1" gutterBottom>
            404
          </Typography>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Trang không tồn tại
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
            >
              Về Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
            >
              Quay lại
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotFound;