class CommentSystem {
    constructor(suggestionSystem) {
        this.comments = new Map();
        this.currentInput = null;
        this.inputWrapper = null;
        this.suggestionSystem = suggestionSystem;
    }
    
    addClickHandler(pageContainer) {
        pageContainer.addEventListener('click', (event) => {
            if (event.target.closest('.comment-box') || event.target.closest('.comment-input')) {
                return;
            }
            
            const rect = pageContainer.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            const canvas = pageContainer.querySelector('canvas');
            const relativeX = x / canvas.width;
            const relativeY = y / canvas.height;
            
            this.createInput(x, y, pageContainer, relativeX, relativeY);
        });
    }
    
    createInput(x, y, container, relativeX, relativeY) {
        if (this.currentInput) {
            this.currentInput.remove();
        }
        if (this.inputWrapper) {
            this.inputWrapper.remove();
        }
        
        this.inputWrapper = document.createElement('div');
        this.inputWrapper.className = 'comment-input-wrapper';
        this.inputWrapper.style.left = x + 'px';
        this.inputWrapper.style.top = y + 'px';
        
        const background = document.createElement('div');
        background.className = 'comment-input-background';
        
        const suggestionOverlay = document.createElement('div');
        suggestionOverlay.className = 'comment-input-suggestion';
        
        const input = document.createElement('textarea');
        input.className = 'comment-input';
        input.placeholder = 'Type your comment and press Enter...';
        
        this.inputWrapper.appendChild(background);
        this.inputWrapper.appendChild(suggestionOverlay);
        this.inputWrapper.appendChild(input);
        
        container.appendChild(this.inputWrapper);
        this.currentInput = input;
        
        input.focus();
        
        this.setupInputEventListeners(input, suggestionOverlay, x, y, container, relativeX, relativeY);
    }
    
    setupInputEventListeners(input, suggestionOverlay, x, y, container, relativeX, relativeY) {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Tab' && this.suggestionSystem.hasInlineSuggestion()) {
                event.preventDefault();
                this.suggestionSystem.acceptInlineSuggestion(input);
                return;
            }
            
            if (this.suggestionSystem.hasDropdown()) {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    this.suggestionSystem.navigateDropdown(1);
                    return;
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    this.suggestionSystem.navigateDropdown(-1);
                    return;
                } else if (event.key === 'Enter' && this.suggestionSystem.getSelectedIndex() >= 0) {
                    event.preventDefault();
                    this.suggestionSystem.selectFromDropdown(input);
                    return;
                }
            }
            
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.suggestionSystem.hideDropdown();
                this.suggestionSystem.clearInlineSuggestion();
                this.saveComment(x, y, input.value.trim(), container, relativeX, relativeY);
            } else if (event.key === 'Escape') {
                this.suggestionSystem.hideDropdown();
                this.suggestionSystem.clearInlineSuggestion();
                this.cancelInput();
            }
        });
        
        input.addEventListener('input', () => {
            this.suggestionSystem.showDropdown(input);
            this.suggestionSystem.updateInlineSuggestion(input, suggestionOverlay);
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => {
                this.suggestionSystem.hideDropdown();
                if (input.value.trim()) {
                    this.saveComment(x, y, input.value.trim(), container, relativeX, relativeY);
                } else {
                    this.cancelInput();
                }
            }, 150);
        });
    }
    
    saveComment(x, y, text, container, relativeX, relativeY) {
        if (!text) {
            this.cancelInput();
            return;
        }
        
        const commentId = `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const commentData = {
            id: commentId,
            page: this.getCurrentPage(),
            x: x,
            y: y,
            relativeX: relativeX,
            relativeY: relativeY,
            text: text,
            timestamp: new Date().toISOString()
        };
        
        this.comments.set(commentId, commentData);
        this.createCommentBox(commentData, container);
        this.cancelInput();
    }
    
    createCommentBox(commentData, container) {
        const commentBox = document.createElement('div');
        commentBox.className = 'comment-box';
        commentBox.dataset.commentId = commentData.id;
        
        const canvas = container.querySelector('canvas');
        const scaledX = commentData.relativeX ? commentData.relativeX * canvas.width : commentData.x;
        const scaledY = commentData.relativeY ? commentData.relativeY * canvas.height : commentData.y;
        
        commentBox.style.left = scaledX + 'px';
        commentBox.style.top = scaledY + 'px';
        commentBox.textContent = commentData.text;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'comment-delete';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteComment(commentData.id);
        };
        
        commentBox.appendChild(deleteBtn);
        container.appendChild(commentBox);
        
        // Add double-click to edit functionality
        commentBox.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editComment(commentData, commentBox, container);
        });
        
        this.makeDraggable(commentBox, commentData);
    }
    
    makeDraggable(element, commentData) {
        let isDragging = false;
        let startX, startY;
        
        element.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('comment-delete')) return;
            
            isDragging = true;
            startX = e.clientX - element.offsetLeft;
            startY = e.clientY - element.offsetTop;
            element.style.cursor = 'grabbing';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const newX = e.clientX - startX;
            const newY = e.clientY - startY;
            
            element.style.left = newX + 'px';
            element.style.top = newY + 'px';
            
            const canvas = element.parentElement.querySelector('canvas');
            commentData.x = newX;
            commentData.y = newY;
            commentData.relativeX = newX / canvas.width;
            commentData.relativeY = newY / canvas.height;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
            }
        });
    }
    
    cancelInput() {
        if (this.currentInput) {
            this.currentInput.remove();
            this.currentInput = null;
        }
        if (this.inputWrapper) {
            this.inputWrapper.remove();
            this.inputWrapper = null;
        }
        this.suggestionSystem.clearInlineSuggestion();
    }
    
    deleteComment(commentId) {
        this.comments.delete(commentId);
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.remove();
        }
    }
    
    editComment(commentData, commentBox, container) {
        // Create edit input in place of comment box
        const editInput = document.createElement('textarea');
        editInput.className = 'comment-input comment-edit';
        editInput.style.left = commentBox.style.left;
        editInput.style.top = commentBox.style.top;
        editInput.style.width = Math.max(commentBox.offsetWidth, 150) + 'px';
        editInput.style.minHeight = commentBox.offsetHeight + 'px';
        editInput.value = commentData.text;
        
        // Hide original comment box
        commentBox.style.display = 'none';
        
        // Add edit input to container
        container.appendChild(editInput);
        editInput.focus();
        editInput.select();
        
        // Save on Enter or blur
        const saveEdit = () => {
            const newText = editInput.value.trim();
            if (newText && newText !== commentData.text) {
                // Update comment data
                commentData.text = newText;
                commentData.timestamp = new Date().toISOString();
                this.comments.set(commentData.id, commentData);
                
                // Update display
                const textNode = Array.from(commentBox.childNodes).find(node => 
                    node.nodeType === Node.TEXT_NODE || 
                    (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('comment-delete'))
                );
                if (textNode) {
                    if (textNode.nodeType === Node.TEXT_NODE) {
                        textNode.textContent = newText;
                    } else {
                        commentBox.firstChild.textContent = newText;
                    }
                } else {
                    // If no text node found, set textContent (will preserve delete button)
                    const deleteBtn = commentBox.querySelector('.comment-delete');
                    commentBox.textContent = newText;
                    if (deleteBtn) commentBox.appendChild(deleteBtn);
                }
            }
            
            // Remove edit input and show comment box
            editInput.remove();
            commentBox.style.display = 'block';
        };
        
        const cancelEdit = () => {
            editInput.remove();
            commentBox.style.display = 'block';
        };
        
        // Event handlers
        editInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveEdit();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                cancelEdit();
            }
        });
        
        editInput.addEventListener('blur', saveEdit);
    }
    
    renderCommentsForPage(pageNumber, container) {
        const pageContainer = container.querySelector('.pdf-page');
        if (!pageContainer) return;
        
        // Remove existing comments
        const existingComments = pageContainer.querySelectorAll('.comment-box');
        existingComments.forEach(comment => comment.remove());
        
        // Render comments for current page
        for (const [commentId, commentData] of this.comments) {
            if (commentData.page === pageNumber) {
                this.createCommentBox(commentData, pageContainer);
            }
        }
    }
    
    setCurrentPageGetter(pageGetter) {
        this.getCurrentPage = pageGetter;
    }
    
    getCommentsForPage(pageNumber) {
        const pageComments = [];
        for (const [commentId, commentData] of this.comments) {
            if (commentData.page === pageNumber) {
                pageComments.push(commentData);
            }
        }
        return pageComments;
    }
    
    getAllComments() {
        return Array.from(this.comments.values());
    }
    
    // Clear all comments
    clearComments() {
        this.comments.clear();
        // Remove all comment elements from DOM
        const commentElements = document.querySelectorAll('.comment-box');
        commentElements.forEach(element => element.remove());
    }
    
    // Set current assignment ID for database integration
    setCurrentAssignment(assignmentId) {
        this.currentAssignmentId = assignmentId;
    }
    
    // Load comments for a specific assignment from database
    async loadCommentsForAssignment(assignmentId) {
        try {
            const response = await fetch(`/api/assignments/${assignmentId}/comments`);
            if (response.ok) {
                const comments = await response.json();
                this.comments.clear();
                comments.forEach(comment => {
                    this.comments.set(comment.id, comment);
                });
                console.log(`Loaded ${comments.length} comments for assignment ${assignmentId}`);
            }
        } catch (error) {
            console.error('Error loading comments from database:', error);
        }
    }
    
    exportComments() {
        return JSON.stringify(this.getAllComments(), null, 2);
    }
    
    importComments(jsonString) {
        try {
            const comments = JSON.parse(jsonString);
            this.comments.clear();
            comments.forEach(comment => {
                this.comments.set(comment.id, comment);
            });
            return true;
        } catch (error) {
            console.error('Error importing comments:', error);
            return false;
        }
    }
}