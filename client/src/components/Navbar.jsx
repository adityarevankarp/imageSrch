import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkStyle = {
    textDecoration: 'none',
    color: 'inherit',
    marginLeft: 2
  };

  const buttonStyle = (path) => ({
    color: 'white',
    backgroundColor: isActive(path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
  });

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" style={linkStyle}>
          PDF Image Search
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          component={Link}
          to="/"
          startIcon={<FolderIcon />}
          sx={buttonStyle('/')}
        >
          Documents
        </Button>
        <Button
          component={Link}
          to="/upload"
          startIcon={<UploadFileIcon />}
          sx={buttonStyle('/upload')}
        >
          Upload
        </Button>
        <Button
          component={Link}
          to="/search"
          startIcon={<SearchIcon />}
          sx={buttonStyle('/search')}
        >
          Search
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 