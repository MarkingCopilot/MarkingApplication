class ViewManager {
    constructor(pdfContainer, controlsContainer, modeIndicator) {
        this.pdfContainer = pdfContainer;
        this.controlsContainer = controlsContainer;
        this.modeIndicator = modeIndicator;
        
        // View state
        this.isOverviewMode = true;
        this.focusedPageNumber = null;
        this.highlightedPageNumber = null;
        
        // Callbacks
        this.onPageFocused = null;
        this.onModeChanged = null;
        
        // Initialize in overview mode
        this.switchToOverviewMode();
    }
    
    switchToOverviewMode() {
        this.isOverviewMode = true;
        this.focusedPageNumber = null;
        
        // Initialize highlighting to first page
        this.highlightedPageNumber = 1;
        
        // Update container class
        this.pdfContainer.className = '';
        this.pdfContainer.classList.add('overview-mode');
        
        // Update controls
        this.controlsContainer.className = 'controls overview-mode';
        this.modeIndicator.textContent = 'Overview Mode - Use arrows to navigate, Enter to focus';
        
        // Hide page navigation controls in overview mode
        this.hidePageControls();
        
        // Show all pages, remove focused class, add highlight to first page
        const pageWrappers = this.pdfContainer.querySelectorAll('.pdf-page-wrapper');
        pageWrappers.forEach(wrapper => {
            const pageNumber = parseInt(wrapper.dataset.pageNumber);
            wrapper.classList.remove('focused');
            wrapper.style.display = 'block';
            
            // Add highlight class to first page
            if (pageNumber === 1) {
                wrapper.classList.add('highlighted');
            } else {
                wrapper.classList.remove('highlighted');
            }
        });
        
        // Notify listeners
        if (this.onModeChanged) {
            this.onModeChanged('overview', null);
        }
    }
    
    focusPage(pageNumber) {
        this.isOverviewMode = false;
        this.focusedPageNumber = pageNumber;
        
        // Update container class
        this.pdfContainer.className = '';
        this.pdfContainer.classList.add('focused-mode');
        
        // Update controls
        this.controlsContainer.className = 'controls focused-mode';
        this.modeIndicator.textContent = `Page ${pageNumber}`;
        
        // Show page navigation controls
        this.showPageControls();
        
        // Show all pages but highlight the focused one
        const pageWrappers = this.pdfContainer.querySelectorAll('.pdf-page-wrapper');
        pageWrappers.forEach(wrapper => {
            const wrapperPageNumber = parseInt(wrapper.dataset.pageNumber);
            wrapper.style.display = 'block';
            
            if (wrapperPageNumber === pageNumber) {
                wrapper.classList.add('focused');
            } else {
                wrapper.classList.remove('focused');
            }
        });
        
        // Scroll to the focused page
        this.scrollToPage(pageNumber);
        
        // Notify listeners
        if (this.onPageFocused) {
            this.onPageFocused(pageNumber);
        }
        
        if (this.onModeChanged) {
            this.onModeChanged('focused', pageNumber);
        }
    }
    
    // Navigate highlighted page in overview mode
    navigateHighlight(direction) {
        if (!this.isOverviewMode) return false;
        
        const totalPages = this.pdfContainer.querySelectorAll('.pdf-page-wrapper').length;
        let newHighlightedPage = this.highlightedPageNumber + direction;
        
        // Wrap around at boundaries
        if (newHighlightedPage < 1) {
            newHighlightedPage = totalPages;
        } else if (newHighlightedPage > totalPages) {
            newHighlightedPage = 1;
        }
        
        this.setHighlightedPage(newHighlightedPage);
        return true;
    }
    
    // Set which page is highlighted in overview mode
    setHighlightedPage(pageNumber) {
        if (!this.isOverviewMode) return;
        
        this.highlightedPageNumber = pageNumber;
        
        // Update highlight classes
        const pageWrappers = this.pdfContainer.querySelectorAll('.pdf-page-wrapper');
        pageWrappers.forEach(wrapper => {
            const wrapperPageNumber = parseInt(wrapper.dataset.pageNumber);
            if (wrapperPageNumber === pageNumber) {
                wrapper.classList.add('highlighted');
                // Scroll the highlighted page into view
                wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                wrapper.classList.remove('highlighted');
            }
        });
        
        // Update mode indicator
        this.modeIndicator.textContent = `Overview Mode - Page ${pageNumber} selected - Press Enter to focus`;
    }
    
    // Focus the currently highlighted page
    focusHighlightedPage() {
        if (!this.isOverviewMode || !this.highlightedPageNumber) return false;
        
        this.focusPage(this.highlightedPageNumber);
        return true;
    }
    
    isInOverviewMode() {
        return this.isOverviewMode;
    }
    
    getFocusedPageNumber() {
        return this.focusedPageNumber;
    }
    
    setPageFocusedCallback(callback) {
        this.onPageFocused = callback;
    }
    
    setModeChangedCallback(callback) {
        this.onModeChanged = callback;
    }
    
    // Scroll to a specific page smoothly
    scrollToPage(pageNumber) {
        const targetWrapper = this.pdfContainer.querySelector(`[data-page-number="${pageNumber}"]`);
        
        if (targetWrapper) {
            // Use different scrolling approaches for different modes
            if (this.isOverviewMode) {
                // In overview mode, use scrollIntoView
                targetWrapper.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            } else {
                // In focused mode, calculate position and scroll container
                const containerRect = this.pdfContainer.getBoundingClientRect();
                const wrapperRect = targetWrapper.getBoundingClientRect();
                const scrollTop = this.pdfContainer.scrollTop + wrapperRect.top - containerRect.top - (containerRect.height / 2) + (wrapperRect.height / 2);
                
                this.pdfContainer.scrollTo({
                    top: scrollTop,
                    behavior: 'smooth'
                });
            }
        }
    }
    
    // Update focused page (for when user clicks different page in focused mode)
    updateFocusedPage(pageNumber) {
        if (this.isOverviewMode) return;
        
        this.focusedPageNumber = pageNumber;
        this.modeIndicator.textContent = `Page ${pageNumber}`;
        
        // Update focused class
        const pageWrappers = this.pdfContainer.querySelectorAll('.pdf-page-wrapper');
        pageWrappers.forEach(wrapper => {
            const wrapperPageNumber = parseInt(wrapper.dataset.pageNumber);
            if (wrapperPageNumber === pageNumber) {
                wrapper.classList.add('focused');
            } else {
                wrapper.classList.remove('focused');
            }
        });
        
        // Scroll to the new focused page (with slight delay to ensure DOM update)
        setTimeout(() => this.scrollToPage(pageNumber), 10);
        
        // Notify listeners
        if (this.onPageFocused) {
            this.onPageFocused(pageNumber);
        }
    }

    // Show page navigation controls
    showPageControls() {
        const pageControls = this.controlsContainer.querySelectorAll('#prev-page, #next-page, #page-info, #zoom-in, #zoom-out');
        pageControls.forEach(control => {
            if (control) control.style.display = 'inline-block';
        });
    }
    
    // Hide page navigation controls
    hidePageControls() {
        const pageControls = this.controlsContainer.querySelectorAll('#prev-page, #next-page, #page-info');
        pageControls.forEach(control => {
            if (control) control.style.display = 'none';
        });
    }
    
    // Helper method to set up page click handlers
    setupPageClickHandlers() {
        const pageWrappers = this.pdfContainer.querySelectorAll('.pdf-page-wrapper');
        
        pageWrappers.forEach(wrapper => {
            const pageNumber = parseInt(wrapper.dataset.pageNumber);
            
            // Add click handler to the wrapper with proper delegation
            wrapper.addEventListener('click', (e) => {
                // In overview mode, any click on the page wrapper should focus it
                if (this.isOverviewMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.focusPage(pageNumber);
                    return;
                }
                
                // In focused mode, only handle clicks on wrapper background or label
                const isWrapperClick = e.target === wrapper || 
                                     e.target.classList.contains('page-label') ||
                                     (e.target.closest('.pdf-page-wrapper') === wrapper && 
                                      !e.target.closest('.pdf-page'));
                
                if (isWrapperClick) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.updateFocusedPage(pageNumber);
                }
                // Let PDF page clicks through for comment system in focused mode
            });
        });
    }
}