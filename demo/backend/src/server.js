const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;
const assignmentsPath = path.join(__dirname, '../uploads');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../')));

// Serve PDF files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Helper function to get assignment metadata from PDF filename
function parseAssignmentFromFilename(filename) {
    const nameWithoutExt = path.parse(filename).name;
    const parts = nameWithoutExt.split('_');
    
    return {
        id: nameWithoutExt,
        student_name: parts[0] || 'Unknown',
        assignment_type: parts.slice(1).join(' ') || 'Assignment',
        filename: filename,
        file_path: `/uploads/${filename}`,
        status: 'pending',
        grade: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}

// Helper function to load assignments from folder
async function loadAssignments() {
    try {
        const files = await fs.readdir(assignmentsPath);
        const pdfFiles = files.filter(file => path.extname(file).toLowerCase() === '.pdf');
        
        return pdfFiles.map((filename, index) => ({
            ...parseAssignmentFromFilename(filename),
            index
        }));
    } catch (error) {
        console.error('Error reading assignments folder:', error);
        return [];
    }
}

// API Routes

// Get all assignments with pagination
app.get('/api/assignments', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status;
        
        let assignments = await loadAssignments();
        
        // Filter by status if provided
        if (status) {
            assignments = assignments.filter(assignment => assignment.status === status);
        }
        
        // Sort by filename (since we don't have created_at from file system)
        assignments.sort((a, b) => a.filename.localeCompare(b.filename));
        
        const total = assignments.length;
        const paginatedAssignments = assignments.slice(offset, offset + limit);
        
        res.json({
            assignments: paginatedAssignments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: 'File system error' });
    }
});

// Get specific assignment by ID
app.get('/api/assignments/:id', async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const assignments = await loadAssignments();
        const assignment = assignments.find(a => a.id === assignmentId);
        
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        
        res.json(assignment);
    } catch (error) {
        console.error('Error fetching assignment:', error);
        res.status(500).json({ error: 'File system error' });
    }
});

// Get assignment by index (for navigation)
app.get('/api/assignments/index/:index', async (req, res) => {
    try {
        let index = parseInt(req.params.index);
        if (isNaN(index) || index < 0) {
            index = 0;
        }
        
        const assignments = await loadAssignments();
        assignments.sort((a, b) => a.filename.localeCompare(b.filename));
        
        if (index >= assignments.length) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        
        const assignment = assignments[index];
        
        res.json({
            assignment,
            navigation: {
                currentIndex: index,
                total: assignments.length,
                hasNext: index < assignments.length - 1,
                hasPrevious: index > 0
            }
        });
    } catch (error) {
        console.error('Error fetching assignment by index:', error);
        res.status(500).json({ error: 'File system error' });
    }
});

// Get comments for specific assignment
app.get('/api/assignments/:id/comments', (req, res) => {
    // For now, return empty array since we're not persisting comments
    // In the future, you could store comments in JSON files per assignment
    res.json([]);
});

// Add comment to assignment
app.post('/api/assignments/:id/comments', (req, res) => {
    const assignmentId = req.params.id;
    const {
        page_number,
        x_position,
        y_position,
        relative_x,
        relative_y,
        comment_text
    } = req.body;
    
    // Validate required fields
    if (!page_number || x_position === undefined || y_position === undefined || 
        relative_x === undefined || relative_y === undefined || !comment_text) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create a mock comment response (not persisted)
    const comment = {
        id: Date.now(), // Simple ID generation
        assignment_id: assignmentId,
        page_number,
        x_position,
        y_position,
        relative_x,
        relative_y,
        comment_text,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    res.status(201).json(comment);
});

// Update comment
app.put('/api/comments/:id', (req, res) => {
    const commentId = req.params.id;
    const {
        x_position,
        y_position,
        relative_x,
        relative_y,
        comment_text
    } = req.body;
    
    // Return a mock updated comment (not actually persisted)
    const comment = {
        id: commentId,
        x_position,
        y_position,
        relative_x,
        relative_y,
        comment_text,
        updated_at: new Date().toISOString()
    };
    
    res.json(comment);
});

// Delete comment
app.delete('/api/comments/:id', (req, res) => {
    // Mock successful deletion (not actually persisted)
    res.json({ message: 'Comment deleted successfully' });
});

// Save highlight data
app.post('/api/assignments/:id/highlights', (req, res) => {
    const assignmentId = req.params.id;
    const {
        page_number,
        search_term,
        similarity_threshold,
        highlight_data
    } = req.body;
    
    // Mock successful save (not actually persisted)
    res.json({ 
        message: 'Highlights saved successfully', 
        id: Date.now(),
        assignment_id: assignmentId,
        page_number,
        search_term,
        similarity_threshold
    });
});

// Get highlights for assignment
app.get('/api/assignments/:id/highlights', (req, res) => {
    // Return empty array since we're not persisting highlights
    // In the future, you could store highlights in JSON files per assignment
    res.json([]);
});

// Update assignment status/grade
app.put('/api/assignments/:id', async (req, res) => {
    try {
        const assignmentId = req.params.id;
        const { status, grade } = req.body;
        
        const assignments = await loadAssignments();
        const assignment = assignments.find(a => a.id === assignmentId);
        
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }
        
        // Update the assignment properties (in memory only)
        if (status) assignment.status = status;
        if (grade !== undefined) assignment.grade = grade;
        assignment.updated_at = new Date().toISOString();
        
        res.json(assignment);
    } catch (error) {
        console.error('Error updating assignment:', error);
        res.status(500).json({ error: 'File system error' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AIMarker server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`📄 Frontend available at http://localhost:${PORT}`);
});