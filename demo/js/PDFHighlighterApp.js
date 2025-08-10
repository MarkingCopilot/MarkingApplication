class PDFHighlighterApp {
    constructor() {
        // Core components
        this.pdfHandler = new PDFHandler();
        this.suggestionSystem = new SuggestionSystem();
        this.commentSystem = new CommentSystem(this.suggestionSystem);
        this.textHighlighter = new TextHighlighter();
        this.assignmentManager = new AssignmentManager();
        
        this.initializeElements();
        
        // View management components
        this.viewManager = new ViewManager(
            this.pdfContainer, 
            this.controlsContainer, 
            this.modeIndicator
        );
        
        this.pageNavigator = new PageNavigator(this.pdfHandler, this.viewManager);
        this.pdfRenderer = new PDFRenderer(this.pdfHandler, this.commentSystem, this.viewManager, this.pdfContainer);
        
        this.setupComponents();
        this.bindEvents();
        this.loadInitialAssignment();
    }
    
    initializeElements() {
        this.pdfUpload = document.getElementById('pdf-upload');
        this.pdfContainer = document.getElementById('pdf-container');
        this.searchText = document.getElementById('search-text');
        this.highlightBtn = document.getElementById('highlight-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.thresholdSlider = document.getElementById('threshold');
        this.thresholdValue = document.getElementById('threshold-value');
        this.prevBtn = document.getElementById('prev-page');
        this.nextBtn = document.getElementById('next-page');
        this.pageInfo = document.getElementById('page-info');
        this.zoomInBtn = document.getElementById('zoom-in');
        this.zoomOutBtn = document.getElementById('zoom-out');
        
        this.controlsContainer = document.querySelector('.controls');
        this.modeIndicator = document.querySelector('.mode-indicator');
    }
    
    setupComponents() {
        // Initialize page navigator with UI elements
        this.pageNavigator.initializeElements(
            this.prevBtn,
            this.nextBtn, 
            this.pageInfo,
            this.zoomInBtn,
            this.zoomOutBtn
        );
        
        // Set up callbacks
        this.viewManager.setPageFocusedCallback((pageNumber) => {
            this.pdfHandler.currentPage = pageNumber;
            this.pageNavigator.updatePageInfo();
            
            // In focused mode, enable comment system for all visible pages
            const allPageContainers = this.pdfContainer.querySelectorAll('.pdf-page');
            allPageContainers.forEach(pageContainer => {
                this.commentSystem.addClickHandler(pageContainer);
            });
        });
        
        this.pageNavigator.setPageRerenderCallback(async () => {
            return await this.pdfRenderer.renderFocusedPage();
        });
        
        // Setup comment system
        this.commentSystem.setCurrentPageGetter(() => this.pdfHandler.getCurrentPage());
        
        // Override the assignment change handler
        this.assignmentManager.onAssignmentChanged = async (assignment) => {
            await this.loadAssignment(assignment);
        };
    }
    
    bindEvents() {
        this.pdfUpload.addEventListener('change', (e) => this.handleFileUpload(e));
        this.highlightBtn.addEventListener('click', () => this.highlightSimilarText());
        this.clearBtn.addEventListener('click', () => this.clearHighlights());
        this.thresholdSlider.addEventListener('input', (e) => {
            this.thresholdValue.textContent = e.target.value;
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.pageNavigator.handleKeydown(e);
        });
    }
    
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const result = await this.pdfHandler.handleFileUpload(file);
            
            // Clear previous comments and highlights
            this.commentSystem.clearComments();
            this.textHighlighter.clearHighlights();
            
            // Render all pages in overview mode
            await this.pdfRenderer.renderAllPages(this.pdfContainer);
            this.pageNavigator.updatePageInfo();
            
        } catch (error) {
            alert(error.message);
        }
    }
    
    
    highlightSimilarText() {
        const searchTerm = this.searchText.value.trim();
        const threshold = parseFloat(this.thresholdSlider.value);
        
        if (!searchTerm) {
            alert('Please enter search text.');
            return;
        }
        
        if (!this.pdfHandler.pdfDoc) {
            alert('Please upload a PDF file first.');
            return;
        }
        
        try {
            const highlights = this.textHighlighter.highlightSimilarText(
                searchTerm, 
                threshold, 
                this.pdfHandler
            );
            
            console.log(`Highlighted ${highlights.length} text elements`);
            
            // Show stats if there are highlights
            if (highlights.length > 0) {
                const stats = this.textHighlighter.getHighlightStats();
                console.log('Highlight statistics:', stats);
            }
        } catch (error) {
            console.error('Error highlighting text:', error);
            alert('Error highlighting text: ' + error.message);
        }
    }
    
    clearHighlights() {
        this.textHighlighter.clearHighlights();
    }
    
    async loadInitialAssignment() {
        try {
            const assignment = await this.assignmentManager.initialize();
            if (assignment) {
                await this.loadAssignment(assignment);
            } else {
                this.pdfRenderer.showUploadPrompt(this.pdfContainer);
            }
        } catch (error) {
            console.error('Error loading initial assignment:', error);
            this.pdfRenderer.showUploadPrompt(this.pdfContainer);
        }
    }
    
    async loadAssignment(assignment) {
        try {
            // Clear previous comments and highlights
            this.commentSystem.clearComments();
            this.textHighlighter.clearHighlights();
            
            // Set current assignment in comment system
            this.commentSystem.setCurrentAssignment(assignment.id);
            
            // Load the PDF from the assignment
            const pdfUrl = this.assignmentManager.getAssignmentPDFUrl();
            
            if (pdfUrl) {
                await this.loadPDFFromUrl(pdfUrl);
                
                // Load comments for this assignment
                await this.commentSystem.loadCommentsForAssignment(assignment.id);
                
                // Render all pages with comments
                await this.pdfRenderer.renderAllPages(this.pdfContainer);
                this.pageNavigator.updatePageInfo();
                
            } else {
                this.pdfRenderer.showUploadPrompt(this.pdfContainer);
            }
            
        } catch (error) {
            console.error('Error loading assignment:', error);
            alert('Failed to load assignment: ' + error.message);
            this.pdfRenderer.showUploadPrompt(this.pdfContainer);
        }
    }
    
    async loadPDFFromUrl(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            const result = await this.pdfHandler.loadPDFFromBuffer(uint8Array);
            return result;
            
        } catch (error) {
            console.error('Error loading PDF from URL:', error);
            throw error;
        }
    }
    
    
    // Utility methods for external access
    exportComments() {
        return this.commentSystem.exportComments();
    }
    
    importComments(jsonString) {
        if (this.commentSystem.importComments(jsonString)) {
            this.commentSystem.renderCommentsForPage(
                this.pdfHandler.getCurrentPage(), 
                this.pdfContainer
            );
            return true;
        }
        return false;
    }
    
    getHighlightStatistics() {
        return this.textHighlighter.getHighlightStats();
    }
    
    getCurrentPageComments() {
        return this.commentSystem.getCommentsForPage(this.pdfHandler.getCurrentPage());
    }
    
    getAllComments() {
        return this.commentSystem.getAllComments();
    }
    
    getPDFInfo() {
        return {
            currentPage: this.pdfHandler.getCurrentPage(),
            totalPages: this.pdfHandler.getTotalPages(),
            scale: this.pdfHandler.getScale(),
            hasDocument: !!this.pdfHandler.pdfDoc
        };
    }
    
    getCurrentAssignment() {
        return this.assignmentManager.getCurrentAssignment();
    }
    
    async updateAssignmentStatus(status, grade = null) {
        return await this.assignmentManager.updateAssignmentStatus(status, grade);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pdfHighlighterApp = new PDFHighlighterApp();
});