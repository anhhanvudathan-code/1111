/**
 * UndoRedo - Quản lý Undo/Redo khi điền form
 */
class UndoRedoManager {
    constructor(maxSteps = 50) {
        this.undoStack = [];
        this.redoStack = [];
        this.maxSteps = maxSteps;
        this.currentState = null;
    }

    /**
     * Lưu trạng thái hiện tại
     */
    saveState(state, action = 'Update') {
        // Xóa redo stack khi có action mới
        this.redoStack = [];

        // Thêm state hiện tại vào undo stack
        if (this.currentState !== null) {
            this.undoStack.push({
                state: this.currentState,
                action: action,
                timestamp: Date.now()
            });
        }

        // Giới hạn undo stack
        if (this.undoStack.length > this.maxSteps) {
            this.undoStack.shift();
        }

        this.currentState = { ...state };
    }

    /**
     * Undo
     */
    undo() {
        if (this.undoStack.length === 0) return null;

        // Lưu state hiện tại vào redo stack
        if (this.currentState !== null) {
            this.redoStack.push({
                state: this.currentState,
                timestamp: Date.now()
            });
        }

        // Lấy state từ undo stack
        const item = this.undoStack.pop();
        this.currentState = item.state;

        return this.currentState;
    }

    /**
     * Redo
     */
    redo() {
        if (this.redoStack.length === 0) return null;

        // Lưu state hiện tại vào undo stack
        if (this.currentState !== null) {
            this.undoStack.push({
                state: this.currentState,
                timestamp: Date.now()
            });
        }

        // Lấy state từ redo stack
        const item = this.redoStack.pop();
        this.currentState = item.state;

        return this.currentState;
    }

    /**
     * Kiểm tra có thể undo
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Kiểm tra có thể redo
     */
    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Clear tất cả
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.currentState = null;
    }

    /**
     * Lấy lịch sử
     */
    getHistory() {
        return {
            undo: this.undoStack,
            redo: this.redoStack,
            current: this.currentState
        };
    }
}