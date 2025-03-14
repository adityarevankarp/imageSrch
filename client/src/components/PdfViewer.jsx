import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Box,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Chip,
  InputAdornment,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  ZoomIn,
  ZoomOut,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { searchPlugin } from '@react-pdf-viewer/search';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/zoom/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

const PdfViewer = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const containerRef = useRef(null);

  // Initialize plugins
  const zoomPluginInstance = zoomPlugin();
  const searchPluginInstance = searchPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  
  const { ZoomIn: ZoomInButton, ZoomOut: ZoomOutButton } = zoomPluginInstance;
  const { Search } = searchPluginInstance;
  const { CurrentPageInput, CurrentPageLabel, GoToNextPage, GoToPreviousPage } = pageNavigationPluginInstance;

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/documents/${id}`);
      setDocument(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Error loading document');
      setLoading(false);
    }
  };

  const handleKeywordSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      const response = await axios.get('http://localhost:3000/api/search/keywords', {
        params: {
          q: searchQuery,
          documentId: id
        }
      });

      const results = response.data.results;
      setSearchResults(results);

      if (results.length > 0) {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        toast.success(`Found ${results.length} keyword matches`);
      } else {
        toast.info('No keyword matches found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error performing keyword search');
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh'
      }} 
      ref={containerRef}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4,
          width: '100%',
          maxWidth: '1400px'  // Add maximum width for larger screens
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1" color="primary">
            {document?.originalName || 'PDF Viewer'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search keywords in document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleKeywordSearch()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleKeywordSearch}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>

        {searchResults.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Keyword Search Results:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {searchResults.map((result, idx) => (
                <Chip
                  key={idx}
                  label={`Page ${result.pageNumber}`}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ 
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '800px',
          margin: '0 auto',  // Center the viewer horizontally
          width: '100%'      // Take full width of container
        }}>
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%',
              width: '100%'  // Ensure full width
            }}>
              <Box sx={{ 
                p: 1, 
                bgcolor: '#f5f5f5', 
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                gap: 2
              }}>
                {/* <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Search>
                    {(props) => {
                      const { keyword, setKeyword, jumpToNextMatch, jumpToPreviousMatch, search } = props;
                      return (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            size="small"
                            placeholder="Search in PDF..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && search()}
                            sx={{ minWidth: 200 }}
                          />
                          <IconButton onClick={() => search()} size="small">
                            <SearchIcon />
                          </IconButton>
                          {keyword && (
                            <>
                              <Divider orientation="vertical" flexItem />
                              <Button
                                size="small"
                                onClick={jumpToPreviousMatch}
                                variant="outlined"
                              >
                                Previous
                              </Button>
                              <Button
                                size="small"
                                onClick={jumpToNextMatch}
                                variant="outlined"
                              >
                                Next
                              </Button>
                            </>
                          )}
                        </Box>
                      );
                    }}
                  </Search>
                </Box> */}

                {/* <Divider orientation="vertical" flexItem /> */}
                
                {/* <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <GoToPreviousPage>
                    {(props) => (
                      <Tooltip title="Previous page">
                        <IconButton size="small" onClick={props.onClick} disabled={props.isDisabled}>
                          <NavigateBefore />
                        </IconButton>
                      </Tooltip>
                    )}
                  </GoToPreviousPage>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CurrentPageInput /> / <CurrentPageLabel />
                  </Box>

                  <GoToNextPage>
                    {(props) => (
                      <Tooltip title="Next page">
                        <IconButton size="small" onClick={props.onClick} disabled={props.isDisabled}>
                          <NavigateNext />
                        </IconButton>
                      </Tooltip>
                    )}
                  </GoToNextPage>
                </Box> */}

                {/* <Divider orientation="vertical" flexItem /> */}

                {/* <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <ZoomOutButton>
                    {(props) => (
                      <Tooltip title="Zoom out">
                        <IconButton size="small" onClick={props.onClick}>
                          <ZoomOut />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ZoomOutButton>
                  <ZoomInButton>
                    {(props) => (
                      <Tooltip title="Zoom in">
                        <IconButton size="small" onClick={props.onClick}>
                          <ZoomIn />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ZoomInButton>
                </Box> */}
              </Box>

              <div style={{ 
                flex: 1, 
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center'  // Center the PDF horizontally
              }}>
                <Viewer
                  fileUrl={`http://localhost:3000/api/documents/${id}/pdf`}
                  plugins={[zoomPluginInstance, searchPluginInstance, pageNavigationPluginInstance]}
                  defaultScale={SpecialZoomLevel.PageFit}
                  onError={(error) => {
                    console.error('Error loading PDF:', error);
                    toast.error('Error loading PDF document');
                  }}
                />
              </div>
            </div>
          </Worker>
        </Box>
      </Paper>
    </Container>
  );
};

export default PdfViewer; 