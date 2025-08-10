class PageNavigator {
    constructor(pdfHandler, viewManager) {
        this.pdfHandler = pdfHandler;
        this.viewManager = viewManager;
        
        // UI elements
        this.prevBtn = null;
        this.nextBtn = null;
        this.pageInfo = null;
        this.zoomInBtn = null;
        this.zoomOutBtn = null;
        
        // State
        this.isZooming = false;
        
        // Callbacks
        this.onPageRerender = null;
        this.onStateChange = null; // Callback to save state
    }
    
    initializeElements(prevBtn, nextBtn, pageInfo, zoomInBtn, zoomOutBtn) {
        this.prevBtn = prevBtn;
        this.nextBtn = nextBtn;
        this.pageInfo = pageInfo;
        this.zoomInBtn = zoomInBtn;
        this.zoomOutBtn = zoomOutBtn;
        
        this.bindEvents();
    }
    
    bindEvents() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.changePage(-1));
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.changePage(1));
        }
        if (this.zoomInBtn) {
            this.zoomInBtn.addEventListener('click', () => this.changeZoom(0.2));
        }
        if (this.zoomOutBtn) {
            this.zoomOutBtn.addEventListener('click', () => this.changeZoom(-0.2));
        }
    }
    
    changePage(delta) {
        // Only allow page changes in focused mode (not overview mode)
        if (!this.viewManager.isInOverviewMode()) {
            const currentPage = this.viewManager.getFocusedPageNumber() || this.pdfHandler.getCurrentPage();
            const newPage = currentPage + delta;
            const totalPages = this.pdfHandler.getTotalPages();
            
            if (newPage >= 1 && newPage <= totalPages) {
                this.pdfHandler.currentPage = newPage;
                this.viewManager.updateFocusedPage(newPage);
                
                // Save state after page change
                if (this.onStateChange) {
                    console.log('Page changed, calling state save callback');
                    this.onStateChange();
                } else {
                    console.log('Page changed but no state save callback set');
                }
                
                return true;
            }
        }
        return false;
    }
    
    changeZoom(delta) {
        // Only allow zoom changes in focused mode and prevent concurrent operations
        if (!this.viewManager.isInOverviewMode() && !this.isZooming) {
            const oldScale = this.pdfHandler.getScale();
            
            if (this.pdfHandler.changeZoom(delta)) {
                const newScale = this.pdfHandler.getScale();
                console.log(`Zoom changed: ${Math.round(oldScale * 100)}% → ${Math.round(newScale * 100)}%`);
                
                // Update page info to show new zoom level immediately
                this.updatePageInfo();
                
                // Set zooming flag to prevent concurrent operations
                this.isZooming = true;
                
                // Save state after zoom change
                if (this.onStateChange) {
                    this.onStateChange();
                }
                
                // Notify that pages need re-rendering
                if (this.onPageRerender) {
                    this.onPageRerender().finally(() => {
                        this.isZooming = false;
                    });
                }
                return true;
            }
        }
        return false;
    }
    
    updatePageInfo() {
        if (!this.pageInfo) return;
        
        const currentPage = this.pdfHandler.getCurrentPage();
        const totalPages = this.pdfHandler.getTotalPages();
        const currentScale = this.pdfHandler.getScale();
        
        this.pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${Math.round(currentScale * 100)}%)`;
        
        if (this.prevBtn) {
            this.prevBtn.disabled = currentPage <= 1;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = currentPage >= totalPages;
        }
    }
    
    setPageRerenderCallback(callback) {
        this.onPageRerender = callback;
    }
    
    setStateChangeCallback(callback) {
        this.onStateChange = callback;
    }
    
    // Handle keyboard navigation
    handleKeydown(e) {
        // Don't interfere if user is typing in an input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return false;
        }
        
        switch(e.key) {
            case 'Escape':
                e.preventDefault();
                this.viewManager.switchToOverviewMode();
                return true;
                
            case 'Enter':
                if (this.viewManager.isInOverviewMode()) {
                    e.preventDefault();
                    this.viewManager.focusHighlightedPage();
                    return true;
                }
                break;
                
            case 'ArrowLeft':
                if (this.viewManager.isInOverviewMode()) {
                    e.preventDefault();
                    this.viewManager.navigateHighlight(-1);
                    return true;
                } else {
                    e.preventDefault();
                    this.changePage(-1);
                    return true;
                }
                break;
                
            case 'ArrowRight':
                if (this.viewManager.isInOverviewMode()) {
                    e.preventDefault();
                    this.viewManager.navigateHighlight(1);
                    return true;
                } else {
                    e.preventDefault();
                    this.changePage(1);
                    return true;
                }
                break;
                
            case 'ArrowUp':
                if (this.viewManager.isInOverviewMode()) {
                    e.preventDefault();
                    this.viewManager.navigateHighlight(-1);
                    return true;
                }
                break;
                
            case 'ArrowDown':
                if (this.viewManager.isInOverviewMode()) {
                    e.preventDefault();
                    this.viewManager.navigateHighlight(1);
                    return true;
                }
                break;
        }
        return false;
    }
}