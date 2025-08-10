# AIMarker Demo

Web application for reviewing student assignments with PDF viewing, commenting, and text highlighting.

## Quick Setup

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

Frontend served at http://localhost:3000

## Features

- PDF upload and viewing
- Text similarity highlighting based on search queries
- Interactive comment system with positioning
- Assignment navigation and management
- **Planned**: ChatGPT integration to read marking rubrics and criteria, automatically identifying student errors and suggesting feedback

## Structure

- `index.html` - Main application
- `js/` - JavaScript modules (modular architecture)
- `css/` - Feature-based stylesheets  
- `backend/` - Node.js/Express server with SQLite database
- `backend/uploads/` - PDF storage

## Usage

- Navigate through existing assignments or upload new PDFs
- Click anywhere on PDF to add comments
- Use text similarity highlighting to mark similar content
- Comments automatically position and scale with zoom levels
