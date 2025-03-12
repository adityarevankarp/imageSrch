# PDF Image Search System

A powerful system that enables users to search for images and visual content within PDF documents using advanced image recognition technology powered by Google Cloud Vision API.

## Features

- **PDF Processing**
  - Upload and validate PDF documents
  - Extract images while maintaining page references
  - Handle various image formats (JPEG, PNG, TIFF, vector graphics)
  - Page-by-page processing for memory efficiency

- **Image Analysis**
  - Powered by Google Cloud Vision API
  - Text extraction from images (OCR)
  - Object and label detection
  - Image description generation
  - Cached analysis results

- **Search Capabilities**
  - Text-based image search
  - Similar image search
  - Content/object-based search
  - Page number filtering
  - Relevance-based sorting

## Tech Stack

### Backend
- Node.js with Express
- MongoDB for metadata storage
- Redis for queue management
- Bull for job processing
- Google Cloud Vision API
- PDF processing (pdf-lib, sharp)

### Frontend
- React.js
- Real-time progress updates
- Image preview capabilities
- Modern search interface
- Results visualization

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- Google Cloud Vision API credentials
- npm or yarn

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf-image-search
   ```

2. **Environment Setup**
   Create a .env file in the root directory:
   ```
   MONGODB_URI=your_mongodb_uri
   REDIS_URL=your_redis_url
   GOOGLE_CLOUD_CREDENTIALS=path_to_credentials.json
   PORT=3000
   CLIENT_URL=http://localhost:3001
   ```

3. **Install Dependencies**
   ```bash
   npm run install:all
   ```

4. **Start Development Servers**
   ```bash
   # Start both frontend and backend in development mode
   npm run dev
   
   # Or start them separately
   npm run dev:server
   npm run dev:client
   ```

5. **Build for Production**
   ```bash
   cd client && npm run build
   cd .. && npm start
   ```

## Project Structure

```
pdf-image-search/
├── client/                 # Frontend React application
├── server/                 # Backend Node.js application
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   └── index.js          # Server entry point
├── .env                   # Environment variables
├── package.json          # Project dependencies
└── README.md             # Project documentation
```

## API Documentation

### PDF Operations
- `POST /api/documents/upload` - Upload PDF document
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/images` - Get document images

### Search Operations
- `POST /api/search/text` - Text-based image search
- `POST /api/search/similar` - Similar image search
- `GET /api/search/suggestions` - Get search suggestions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 