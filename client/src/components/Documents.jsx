import { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CardActions, 
  Button,
  LinearProgress,
  Box,
  Chip
} from '@mui/material';
import { PictureAsPdf, Search, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/documents');
      setDocuments(response.data.documents || []); // Extract documents array from response
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Error loading documents');
      setDocuments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const deleteDocument = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/documents/${id}`);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Error deleting document');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} sm={6} md={4} key={doc._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PictureAsPdf color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" noWrap>
                    {doc.originalName || doc.filename}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 1 }}>
                  <Chip 
                    label={doc.status}
                    color={getStatusColor(doc.status)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Pages: {doc.pageCount || 'Processing...'}
                </Typography>
                
                {doc.status === 'processing' && (
                  <LinearProgress 
                    variant="determinate" 
                    value={doc.processingProgress || 0}
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<Search />}
                  onClick={() => navigate(`/documents/${doc._id}`)}
                >
                  View
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => deleteDocument(doc._id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}

        {documents.length === 0 && (
          <Grid item xs={12}>
            <Typography variant="h6" textAlign="center" color="text.secondary">
              No documents uploaded yet
            </Typography>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Documents; 