# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AIMarker is a PDF text highlighter and assignment review system consisting of:
- **Frontend**: Vanilla JavaScript application for PDF viewing, highlighting, and commenting
- **Backend**: Node.js/Express API with SQLite database for assignment and comment management

## Development Commands

### Backend Development
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Setup database (run once)
npm run migrate

# Seed with sample data
npm run seed

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start
```

### Frontend Development
The frontend is a pure HTML/CSS/JavaScript application served statically by the backend. No build step required - simply edit files and refresh the browser.

## Architecture Overview

### Modular Frontend Architecture
The frontend follows a class-based modular pattern with clear separation of concerns:

- **PDFHighlighterApp**: Main controller that orchestrates all modules
- **AssignmentManager**: Handles assignment navigation and metadata via backend API
- **PDFHandler**: PDF.js integration for document loading, rendering, and navigation
- **TextHighlighter**: Implements cosine similarity algorithm for text highlighting
- **CommentSystem**: Manages comment creation, positioning, and persistence
- **SuggestionSystem**: Provides intelligent text suggestions and autocomplete

### Backend API Structure
Express.js REST API with SQLite database:
- `/api/assignments/*` - Assignment CRUD operations and navigation
- `/api/assignments/:id/comments` - Comment management per assignment
- `/api/assignments/:id/highlights` - Highlight data persistence
- Static file serving for frontend and PDF uploads

### Database Schema
SQLite database with three main tables:
- `assignments` - Assignment metadata (student, course, status, grade)
- `comments` - PDF comments with absolute and relative positioning
- `highlights` - Highlight data with similarity thresholds and search terms

## Key Implementation Details

### Comment Positioning System
Comments use a dual-coordinate system:
- **Absolute coordinates**: Fixed pixel positions for initial placement
- **Relative coordinates**: Percentage-based positions that scale with zoom/page changes
- Comments automatically reposition when PDF zoom level changes

### Text Similarity Algorithm
Uses cosine similarity with word frequency vectors:
- Converts text to normalized word frequency vectors
- Calculates similarity scores (0-1 scale) 
- Highlights text elements above configurable threshold

### Assignment Management
- Backend serves assignments with pagination and navigation context
- Frontend maintains current assignment state and handles transitions
- Comments and highlights are scoped per assignment ID

## File Organization

### Frontend Structure
- `index.html` - Main application entry point
- `css/` - Feature-based stylesheets (base, sidebar, comments, highlighting, suggestions)
- `js/` - Modular JavaScript classes, loaded in dependency order

### Backend Structure
- `backend/src/server.js` - Express server and API routes
- `backend/migrations/` - Database setup and seeding scripts
- `backend/uploads/` - PDF file storage directory

> When modifying the frontend, maintain the existing modular architecture and class-based patterns. When working with the backend, follow the existing REST API conventions and SQLite query patterns.