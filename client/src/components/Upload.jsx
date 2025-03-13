import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Paper, 
  Typography, 
  LinearProgress, 
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton
} from '@mui/material';
import { PictureAsPdf, Close, CloudUpload } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = (acceptedFiles) => {
    // Filter only PDF files
    const pdfFiles = acceptedFiles.filter(
      file => file.type === 'application/pdf'
    );
    
    if (pdfFiles.length !== acceptedFiles.length) {
      toast.error('Only PDF files are allowed');
    }
    
    setFiles(prevFiles => [...prevFiles, ...pdfFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    }
  });

  const removeFile = (fileToRemove) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Please add files to upload');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);

        await axios.post('http://localhost:3000/api/documents/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        });

        toast.success(`Uploaded ${files[i].name} successfully`);
      }

      setFiles([]);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Error uploading files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 3,
            mb: 3,
            width: '100%',
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main'
            }
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          {isDragActive ? (
            <Typography>Drop the PDF files here...</Typography>
          ) : (
            <Typography>
              Drag and drop PDF files here, or click to select files
            </Typography>
          )}
        </Box>

        {files.length > 0 && (
          <>
            <List sx={{ width: '100%' }}>
              {files.map((file, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => removeFile(file)}>
                      <Close />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <PictureAsPdf />
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                  />
                </ListItem>
              ))}
            </List>

            {uploading && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Uploading... {progress}%
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                mt: 2,
                p: 2,
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <IconButton
                color="primary"
                onClick={uploadFiles}
                disabled={uploading}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
              >
                <CloudUpload />
              </IconButton>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Upload; 