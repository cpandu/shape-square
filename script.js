class LatinSquareSolver {
    constructor() {
        this.size = 3;
        this.symbols = [];
        this.grid = [];
        this.originalGrid = [];
        this.allSolutions = [];
        this.initializeApp();
    }

    initializeApp() {
        this.bindEvents();
        this.updateGridSize();
        this.generateGrid();
    }

    bindEvents() {
        document.getElementById('gridSize').addEventListener('change', () => {
            this.updateGridSize();
            this.generateGrid();
            this.hideMessage();
            this.hideSolutions();
        });

        document.getElementById('generateGrid').addEventListener('click', () => {
            this.generateGrid();
            this.hideMessage();
            this.hideSolutions();
        });

        document.getElementById('solvePuzzle').addEventListener('click', () => {
            this.solvePuzzle();
        });

        document.getElementById('resetGrid').addEventListener('click', () => {
            this.resetGrid();
        });
    }

    updateGridSize() {
        this.size = parseInt(document.getElementById('gridSize').value);
        this.symbols = this.getSymbolsForSize(this.size);
        this.updateSymbolsInfo();
    }

    getSymbolsForSize(size) {
        const symbolSets = {
            3: ["□", "△", "+"],
            4: ["□", "△", "+", "○"],
            5: ["□", "△", "+", "○", "★"]
        };
        return symbolSets[size] || [];
    }

    updateSymbolsInfo() {
        const info = document.getElementById('symbolsInfo');
        info.textContent = `Fill some cells with shapes as constraints, set ONE cell to "?" for solving, leave rest empty`;
    }

    generateGrid() {
        const puzzleGrid = document.getElementById('puzzleGrid');
        puzzleGrid.innerHTML = '';

        this.grid = [];
        
        for (let row = 0; row < this.size; row++) {
            const tr = document.createElement('tr');
            const gridRow = [];
            
            for (let col = 0; col < this.size; col++) {
                const td = document.createElement('td');
                const select = document.createElement('select');
                
                select.dataset.row = row;
                select.dataset.col = col;
                
                // Add empty option (default - completely empty)
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = '';
                emptyOption.selected = true;
                select.appendChild(emptyOption);
                
                // Add '?' option for cells to be solved
                const solveOption = document.createElement('option');
                solveOption.value = '?';
                solveOption.textContent = '?';
                select.appendChild(solveOption);
                
                // Add symbol options
                for (const symbol of this.symbols) {
                    const option = document.createElement('option');
                    option.value = symbol;
                    option.textContent = symbol;
                    select.appendChild(option);
                }
                
                select.addEventListener('change', (e) => {
                    this.updateGridValue(e.target);
                });
                
                select.addEventListener('keydown', (e) => {
                    this.handleKeyNavigation(e);
                });
                
                td.appendChild(select);
                tr.appendChild(td);
                gridRow.push(''); // Default to completely empty
            }
            
            puzzleGrid.appendChild(tr);
            this.grid.push(gridRow);
        }
        
        this.originalGrid = this.grid.map(row => [...row]);
    }

    updateGridValue(select) {
        const row = parseInt(select.dataset.row);
        const col = parseInt(select.dataset.col);
        const value = select.value;
        this.grid[row][col] = value;
    }

    handleKeyNavigation(e) {
        const select = e.target;
        const row = parseInt(select.dataset.row);
        const col = parseInt(select.dataset.col);
        
        let newRow = row;
        let newCol = col;
        
        switch (e.key) {
            case 'ArrowUp':
                newRow = Math.max(0, row - 1);
                e.preventDefault();
                break;
            case 'ArrowDown':
                newRow = Math.min(this.size - 1, row + 1);
                e.preventDefault();
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, col - 1);
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'Tab':
                if (e.key === 'Tab' && e.shiftKey) return;
                newCol = Math.min(this.size - 1, col + 1);
                if (e.key === 'Tab') e.preventDefault();
                break;
        }
        
        if (newRow !== row || newCol !== col) {
            const newSelect = document.querySelector(`select[data-row="${newRow}"][data-col="${newCol}"]`);
            if (newSelect) {
                newSelect.focus();
            }
        }
    }

    solvePuzzle() {
        this.hideMessage();
        this.hideSolutions();
        
        // Get current grid state
        this.updateGridFromInputs();
        
        // Find the cell marked with '?'
        const questionCell = this.findQuestionMarkCell();
        
        if (!questionCell) {
            this.showMessage('Please mark exactly one cell with "?" to see possible shapes.', 'error');
            return;
        }
        
        // Find possible shapes for the '?' cell
        const possibleShapes = this.findPossibleShapes(questionCell[0], questionCell[1]);
        
        if (possibleShapes.length > 0) {
            this.displayPossibleShapes(possibleShapes, questionCell);
            const message = possibleShapes.length === 1 
                ? 'Found 1 possible shape!' 
                : `Found ${possibleShapes.length} possible shapes!`;
            this.showMessage(message, 'success');
        } else {
            this.showMessage('No valid shapes can be placed in the marked cell. Check your constraints.', 'error');
        }
    }

    updateGridFromInputs() {
        const selects = document.querySelectorAll('#puzzleGrid select');
        selects.forEach(select => {
            const row = parseInt(select.dataset.row);
            const col = parseInt(select.dataset.col);
            const value = select.value;
            this.grid[row][col] = value;
        });
    }

    findQuestionMarkCell() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.grid[row][col] === '?') {
                    return [row, col];
                }
            }
        }
        return null;
    }
    
    findPossibleShapes(row, col) {
        const possibleShapes = [];
        
        for (const symbol of this.symbols) {
            if (this.isValidPlacement(this.grid, row, col, symbol)) {
                possibleShapes.push(symbol);
            }
        }
        
        return possibleShapes;
    }

    findEmptyCell(grid) {
        // First, look for cells marked with '?' (specifically requested to be solved)
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (grid[row][col] === '?') {
                    return [row, col];
                }
            }
        }
        
        // If no '?' found, look for completely empty cells
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (grid[row][col] === '') {
                    return [row, col];
                }
            }
        }
        
        return null;
    }

    isValidPlacement(grid, row, col, symbol) {
        // Check row constraint
        for (let c = 0; c < this.size; c++) {
            if (c !== col && grid[row][c] === symbol) {
                return false;
            }
        }
        
        // Check column constraint
        for (let r = 0; r < this.size; r++) {
            if (r !== row && grid[r][col] === symbol) {
                return false;
            }
        }
        
        return true;
    }

    displayPossibleShapes(possibleShapes, questionCell) {
        const solutionsDisplay = document.getElementById('solutionsDisplay');
        solutionsDisplay.innerHTML = '';
        
        // Add title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'solution-count';
        titleDiv.textContent = `Possible shapes for cell (${questionCell[0] + 1}, ${questionCell[1] + 1}):`;
        solutionsDisplay.appendChild(titleDiv);
        
        // Create container for shapes
        const shapesContainer = document.createElement('div');
        shapesContainer.className = 'possible-shapes-container';
        
        possibleShapes.forEach((shape, index) => {
            const shapeItem = document.createElement('div');
            shapeItem.className = 'shape-item';
            shapeItem.textContent = shape;
            shapesContainer.appendChild(shapeItem);
        });
        
        solutionsDisplay.appendChild(shapesContainer);
        solutionsDisplay.classList.add('show');
    }

    resetGrid() {
        const selects = document.querySelectorAll('#puzzleGrid select');
        selects.forEach(select => {
            select.value = ''; // Reset to completely empty
        });
        
        this.grid = this.grid.map(row => row.map(() => ''));
        this.hideMessage();
        this.hideSolutions();
    }

    showMessage(text, type) {
        const message = document.getElementById('message');
        message.textContent = text;
        message.className = `message ${type}`;
    }

    hideMessage() {
        const message = document.getElementById('message');
        message.style.display = 'none';
        message.className = 'message';
    }

    hideSolutions() {
        const solutionsDisplay = document.getElementById('solutionsDisplay');
        solutionsDisplay.classList.remove('show');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new LatinSquareSolver();
});
