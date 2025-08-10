class AssignmentManager {
    constructor() {
        this.assignments = [];
        this.currentAssignmentIndex = 0;
        this.currentAssignment = null;
        this.onAssignmentChanged = null;
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        this.prevAssignmentBtn = document.getElementById('prev-assignment');
        this.nextAssignmentBtn = document.getElementById('next-assignment');
        this.assignmentInfo = document.getElementById('assignment-info');
        
        // Assignment metadata elements
        this.studentName = document.getElementById('student-name');
        this.assignmentTitle = document.getElementById('assignment-title');
        this.courseName = document.getElementById('course-name');
        this.dueDate = document.getElementById('due-date');
        this.assignmentStatus = document.getElementById('assignment-status');
    }
    
    bindEvents() {
        if (this.prevAssignmentBtn) {
            this.prevAssignmentBtn.addEventListener('click', () => this.navigateAssignment(-1));
        }
        if (this.nextAssignmentBtn) {
            this.nextAssignmentBtn.addEventListener('click', () => this.navigateAssignment(1));
        }
    }
    
    async loadAssignments() {
        try {
            const response = await fetch('/api/assignments');
            if (response.ok) {
                const data = await response.json();
                this.assignments = data.assignments || data; // Handle both new and old API format
                console.log(`Loaded ${this.assignments.length} assignments`);
                this.updateAssignmentNavigation();
                return this.assignments;
            } else {
                console.error('Failed to load assignments:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error loading assignments:', error);
            return [];
        }
    }
    
    async loadAssignment(index) {
        if (index < 0 || index >= this.assignments.length) {
            console.log('Assignment index out of bounds:', index);
            return null;
        }
        
        this.currentAssignmentIndex = index;
        this.currentAssignment = this.assignments[index];
        
        // Update UI with assignment metadata
        this.updateAssignmentDisplay();
        
        // Notify listeners that assignment changed
        if (this.onAssignmentChanged) {
            await this.onAssignmentChanged(this.currentAssignment);
        }
        
        return this.currentAssignment;
    }
    
    navigateAssignment(delta) {
        const newIndex = this.currentAssignmentIndex + delta;
        if (newIndex >= 0 && newIndex < this.assignments.length) {
            this.loadAssignment(newIndex);
        }
    }
    
    updateAssignmentNavigation() {
        if (this.assignmentInfo) {
            this.assignmentInfo.textContent = `${this.currentAssignmentIndex + 1} of ${this.assignments.length}`;
        }
        
        if (this.prevAssignmentBtn) {
            this.prevAssignmentBtn.disabled = this.currentAssignmentIndex <= 0;
        }
        if (this.nextAssignmentBtn) {
            this.nextAssignmentBtn.disabled = this.currentAssignmentIndex >= this.assignments.length - 1;
        }
    }
    
    updateAssignmentDisplay() {
        if (!this.currentAssignment) return;
        
        const assignment = this.currentAssignment;
        
        if (this.studentName) {
            this.studentName.textContent = assignment.student_name || 'Unknown Student';
        }
        if (this.assignmentTitle) {
            this.assignmentTitle.textContent = assignment.assignment_type || assignment.title || 'Assignment';
        }
        if (this.courseName) {
            this.courseName.textContent = assignment.course || 'Course';
        }
        if (this.dueDate) {
            const dueDate = assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date';
            this.dueDate.textContent = dueDate;
        }
        if (this.assignmentStatus) {
            this.assignmentStatus.textContent = assignment.status || 'pending';
            this.assignmentStatus.className = `status-badge ${assignment.status || 'pending'}`;
        }
        
        this.updateAssignmentNavigation();
    }
    
    getCurrentAssignment() {
        return this.currentAssignment;
    }
    
    getAssignmentPDFUrl() {
        if (!this.currentAssignment) return null;
        return this.currentAssignment.file_path || `/uploads/${this.currentAssignment.filename}`;
    }
    
    async updateAssignmentStatus(status, grade = null) {
        if (!this.currentAssignment) return false;
        
        try {
            const updateData = { status };
            if (grade !== null) {
                updateData.grade = grade;
            }
            
            const response = await fetch(`/api/assignments/${this.currentAssignment.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                const updatedAssignment = await response.json();
                this.currentAssignment = updatedAssignment;
                this.assignments[this.currentAssignmentIndex] = updatedAssignment;
                this.updateAssignmentDisplay();
                return true;
            } else {
                console.error('Failed to update assignment status:', response.status);
                return false;
            }
        } catch (error) {
            console.error('Error updating assignment status:', error);
            return false;
        }
    }
    
    // Initialize with saved assignment or first assignment
    async initialize() {
        console.log('AssignmentManager: Starting initialization');
        await this.loadAssignments();
        console.log(`AssignmentManager: Loaded ${this.assignments.length} assignments`);
        
        if (this.assignments.length > 0) {
            // Check if there's a saved assignment in localStorage
            const savedAssignmentIndex = this.getSavedAssignmentIndex();
            const indexToLoad = savedAssignmentIndex !== null ? savedAssignmentIndex : 0;
            
            console.log(`Loading assignment at index ${indexToLoad} (saved: ${savedAssignmentIndex !== null})`);
            const result = await this.loadAssignment(indexToLoad);
            console.log('AssignmentManager: Assignment loaded successfully:', result ? result.id : 'null');
            return result;
        } else {
            console.log('AssignmentManager: No assignments found!');
        }
        return null;
    }
    
    getSavedAssignmentIndex() {
        try {
            const savedState = localStorage.getItem('aimarker_page_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                console.log('Found saved state:', state);
                
                // Make sure assignments are loaded
                if (!this.assignments || this.assignments.length === 0) {
                    console.log('No assignments loaded yet, cannot find saved assignment');
                    return null;
                }
                
                // Find the assignment index by ID
                const assignmentIndex = this.assignments.findIndex(assignment => 
                    assignment.id === state.assignmentId
                );
                console.log(`Looking for assignment ID: ${state.assignmentId}, found at index: ${assignmentIndex}`);
                return assignmentIndex !== -1 ? assignmentIndex : null;
            } else {
                console.log('No saved state found');
            }
        } catch (error) {
            console.error('Error getting saved assignment:', error);
        }
        return null;
    }
}