import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Navbar from './components/Navbar';
import Upload from './components/Upload';
import Documents from './components/Documents';
import Search from './components/Search';
import DocumentView from './components/DocumentView';
import PdfViewer from './components/PdfViewer';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Documents />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/documents/:id" element={<PdfViewer />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/search" element={<Search />} />
          </Routes>
          <ToastContainer position="bottom-right" />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
