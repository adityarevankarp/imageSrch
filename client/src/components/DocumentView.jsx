import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Paper,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack
} from '@mui/material';
import {
  ExpandMore,
  TextFields,
  Label,
  Image,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const DocumentView = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/documents/${id}`);
        setDocument(response.data);
      } catch (error) {
        console.error('Error fetching document:', error);
        toast.error('Error loading document');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  if (loading) {
    return (
      <Container sx={{ mt: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  if (!document) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" textAlign="center" color="error">
          Document not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h1">
            {document.filename}
          </Typography>
          <Box sx={{ ml: 2 }}>
            <Chip
              icon={document.status === 'completed' ? <CheckCircle /> : <Error />}
              label={document.status}
              color={document.status === 'completed' ? 'success' : 'error'}
            />
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary" gutterBottom>
          Pages: {document.pageCount}
        </Typography>

        {document.status === 'processing' && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={document.processingProgress || 0}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Processing: {document.processingProgress || 0}%
            </Typography>
          </Box>
        )}
      </Paper>

      <Grid container spacing={3}>
        {document.images?.map((image, index) => (
          <Grid item xs={12} key={index}>
            <Card>
              <CardMedia
                component="img"
                height="400"
                image={`http://localhost:3000/api/images/${document._id}/${image.filename}`}
                alt={`Page ${image.pageNumber}`}
                sx={{ objectFit: 'contain' }}
              />
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Page {image.pageNumber}
                </Typography>

                {image.analysis && (
                  <Stack spacing={2}>
                    {/* Text Analysis */}
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TextFields sx={{ mr: 1 }} />
                          <Typography>Extracted Text</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2">
                          {image.analysis.text || 'No text detected'}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>

                    {/* Labels */}
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Label sx={{ mr: 1 }} />
                          <Typography>Labels</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {image.analysis.labels?.map((label, idx) => (
                            <Chip
                              key={idx}
                              label={`${label.description} (${Math.round(label.score * 100)}%)`}
                              size="small"
                            />
                          )) || 'No labels detected'}
                        </Box>
                      </AccordionDetails>
                    </Accordion>

                    {/* Objects */}
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Image sx={{ mr: 1 }} />
                          <Typography>Objects</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {image.analysis.objects?.map((obj, idx) => (
                            <Chip
                              key={idx}
                              label={`${obj.name} (${Math.round(obj.score * 100)}%)`}
                              size="small"
                            />
                          )) || 'No objects detected'}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default DocumentView; 