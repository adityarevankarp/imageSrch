import { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Autocomplete,
  Paper
} from '@mui/material';
import { Search as SearchIcon, Image, TextFields } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const Search = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('keywords');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/search/${searchType}`, {
        params: {
          q: query,
          ...(searchType === 'content' && { object: query })
        }
      });

      setResults(response.data.results);
      
      if (response.data.results.length === 0) {
        toast.info('No results found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error performing search');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (value) => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get('http://localhost:3000/api/search/suggestions', {
        params: { q: value }
      });
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return 'success';
    if (confidence >= 70) return 'info';
    if (confidence >= 50) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
          Search Images
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Autocomplete
              freeSolo
              options={suggestions}
              onInputChange={(_, value) => {
                setQuery(value);
                fetchSuggestions(value);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Search Query"
                  variant="outlined"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter keywords to search..."
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: { xs: 'center', md: 'flex-start' },
              width: '100%',
              overflowX: 'auto'
            }}>
              <ToggleButtonGroup
                value={searchType}
                exclusive
                onChange={(_, value) => value && setSearchType(value)}
                aria-label="search type"
                size="large"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 3,
                    py: 1
                  }
                }}
              >
                {/* <ToggleButton value="keywords" aria-label="keywords search">
                  <SearchIcon sx={{ mr: 1 }} />
                  Keywords
                </ToggleButton> */}
                {/* <ToggleButton value="content" aria-label="content search">
                  <Image sx={{ mr: 1 }} />
                  Objects
                </ToggleButton>
                <ToggleButton value="text" aria-label="text search">
                  <TextFields sx={{ mr: 1 }} />
                  Text
                </ToggleButton> */}
              </ToggleButtonGroup>
            </Box>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              size="large"
              sx={{ 
                height: '56px',
                width:'100px',
                textTransform: 'none',
                fontSize: '1.1rem'
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <>
                  <SearchIcon sx={{ mr: 1 }} />
                  Search
                </>
              )}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Section */}
      <Grid container spacing={3}>
        {results.map((result, index) => (
          <Grid item xs={12} key={index}>
            <Card elevation={2} sx={{ 
              '&:hover': { 
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                  mb: 2 
                }}>
                  <Typography variant="h6" component="h2" sx={{ color: 'primary.main' }}>
                    {result.documentName}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/documents/${result.documentId}`)}
                    startIcon={<SearchIcon />}
                    sx={{ minWidth: '120px' }}
                  >
                    View
                  </Button>
                </Box>

                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    color: 'text.secondary',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Image sx={{ mr: 1, opacity: 0.7 }} />
                  Page {result.pageNumber}
                </Typography>

                {result.matchedKeywords && (
                  <Box sx={{ mt: 2 }}>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom 
                      sx={{ color: 'text.secondary', mb: 1 }}
                    >
                      Matched Keywords:
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 1,
                      '& .MuiChip-root': {
                        borderRadius: '4px'
                      }
                    }}>
                      {result.matchedKeywords.map((match, idx) => (
                        <Chip
                          key={idx}
                          label={`${match.keyword} (${match.confidence}%)`}
                          color={getConfidenceColor(match.confidence)}
                          variant="outlined"
                          size="medium"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}

        {!loading && results.length === 0 && (
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No results found. Try a different search term.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Search; 