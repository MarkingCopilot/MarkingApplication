class PDFRenderer {
    constructor(pdfHandler, commentSystem, viewManager, container) {
        this.pdfHandler = pdfHandler;
        this.commentSystem = commentSystem;
        this.viewManager = viewManager;
        this.container = container;
    }
    
    // Render all pages in overview mode
    async renderAllPages(container) {
        if (!this.pdfHandler.pdfDoc) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        const totalPages = this.pdfHandler.getTotalPages();
        
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            await this.renderPageWrapper(pageNum, container);
        }
        
        // Set up click handlers for page navigation
        this.viewManager.setupPageClickHandlers();
    }
    
    // Render a single page wrapper (for both overview and focused modes)
    async renderPageWrapper(pageNum, container) {
        // Create page wrapper
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'pdf-page-wrapper';
        pageWrapper.dataset.pageNumber = pageNum;
        
        // Create page label
        const pageLabel = document.createElement('div');
        pageLabel.className = 'page-label';
        pageLabel.textContent = `Page ${pageNum}`;
        pageWrapper.appendChild(pageLabel);
        
        // Create page container
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page';
        pageWrapper.appendChild(pageContainer);
        
        // Add to main container
        container.appendChild(pageWrapper);
        
        try {
            // Render the actual PDF page
            await this.pdfHandler.renderPage(pageNum, pageContainer);
            
            // Add comment system click handler
            this.commentSystem.addClickHandler(pageContainer);
            
            // Render comments for this page
            this.commentSystem.renderCommentsForPage(pageNum, pageContainer);
            
        } catch (error) {
            console.error(`Error rendering page ${pageNum}:`, error);
            pageContainer.innerHTML = `<div class="page-error">Error loading page ${pageNum}</div>`;
        }
        
        return pageWrapper;
    }
    
    // Render focused page (re-render current page with new zoom)
    async renderFocusedPage() {
        if (!this.pdfHandler.pdfDoc || this.viewManager.isInOverviewMode()) return;
        
        const currentPage = this.viewManager.getFocusedPageNumber() || this.pdfHandler.getCurrentPage();
        const pageWrapper = this.container.querySelector(`[data-page-number="${currentPage}"]`);
        
        if (pageWrapper) {
            const pageContainer = pageWrapper.querySelector('.pdf-page');
            if (pageContainer) {
                // Clear existing content
                pageContainer.innerHTML = '';
                
                try {
                    // Re-render the page
                    await this.pdfHandler.renderPage(currentPage, pageContainer);
                    
                    // Re-add comment system
                    this.commentSystem.addClickHandler(pageContainer);
                    this.commentSystem.renderCommentsForPage(currentPage, pageContainer);
                    
                } catch (error) {
                    console.error(`Error re-rendering page ${currentPage}:`, error);
                    pageContainer.innerHTML = `<div class="page-error">Error loading page ${currentPage}</div>`;
                }
            }
        }
    }
    
    // Show upload prompt when no PDF is loaded
    showUploadPrompt(container) {
        container.innerHTML = `
            <div class="upload-prompt">
                <p>Upload a PDF file to get started</p>
            </div>
        `;
    }
}