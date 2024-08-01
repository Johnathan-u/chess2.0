// jshint esversion: 6
// jshint browser: true

// Array to hold all pieces
let pieces = [];

// Array to hold all board squares
let boardSquares = [];

// Variable to keep track of the selected square
let selectedSquare = null;

// Player constructor function to initialize player properties
let Player = function(color) {
    this.checked = false; // If the player is in check
    this.color = color; // Color of the player
    this.castled = false; // If the player has castled
    this.king = null; // Reference to the player's king
    this.kingMoved = false; // If the king has moved
    this.promote = null; // Piece to be promoted
    this.moved = null; // Last moved piece
};

// Variable to keep track of the current turn number
let turn = 1;

// Instantiate white and black players
let white = new Player("white");
let black = new Player("black");

// Variable to keep track of the current player
let currentPlayer = white;

// SquareObject constructor function to initialize square properties
let SquareObject = function(x, y, color, selected, element, piece) {
    this.x = x; // X coordinate
    this.y = y; // Y coordinate
    this.color = color; // Color of the square (light or dark)
    this.selected = selected; // If the square is selected
    this.element = element; // DOM element representing the square
    this.piece = piece; // Piece on the square (if any)
};

// Method to set a piece on the square
SquareObject.prototype.setPiece = function(piece) {
    this.piece = piece;
    this.update();
};

// Method to unset a piece from the square
SquareObject.prototype.unsetPiece = function() {
    this.piece = null;
    this.update();
};

// Method to update the square's appearance based on its properties
SquareObject.prototype.update = function() {
    this.element.className = "square " + this.color + " " + (this.selected ? "selected" : "") + " " + (this.piece === null ? "empty" : this.piece.color + "-" + this.piece.type);
};

// Method to select the square
SquareObject.prototype.select = function() {
    this.selected = true;
    this.update();
};

// Method to deselect the square
SquareObject.prototype.deselect = function() {
    this.selected = false;
    this.update();
};

// Method to check if the square has a piece
SquareObject.prototype.hasPiece = function() {
    return this.piece !== null;
};

// Piece constructor function to initialize piece properties
let Piece = function(x, y, color, type) {
    this.color = color; // Color of the piece
    this.type = type; // Type of the piece (e.g., "king", "queen")
    this.x = x; // X coordinate
    this.y = y; // Y coordinate
    this.captured = false; // If the piece is captured
    this.lastmoved = 0; // Turn number when the piece was last moved
    this.advancedtwo = 0; // Turn number when the pawn advanced two squares
};

// Method to capture the piece
Piece.prototype.capture = function() {
    this.captured = true;
};

// Helper function to check if the path between two squares is clear
Piece.prototype.isPathClear = function(toSquare) {
    let directionX = (toSquare.x - this.x) ? (toSquare.x - this.x) / Math.abs(toSquare.x - this.x) : 0;
    let directionY = (toSquare.y - this.y) ? (toSquare.y - this.y) / Math.abs(toSquare.y - this.y) : 0;
    for (let testX = this.x + directionX, testY = this.y + directionY;
         testX != toSquare.x || testY != toSquare.y;
         testX += directionX, testY += directionY) {
        if (getSquare(testX, testY).hasPiece()) {
            return false;
        }
    }
    return true;
};

// Helper function to validate a move and check for captures
Piece.prototype.validateMove = function(toSquare) {
    if (!toSquare.hasPiece()) {
        return { valid: true, capture: null };
    } else if (toSquare.piece.color != this.color) {
        return { valid: true, capture: toSquare };
    }
    return { valid: false, capture: null };
};

// Castle (Rook) specific move logic
let Castle = function(x, y, color) {
    Piece.call(this, x, y, color, "castle");
};

// Inherit from Piece
Castle.prototype = Object.create(Piece.prototype);
Castle.prototype.constructor = Castle;

// Method to check if a move is valid for a Castle (Rook)
Castle.prototype.isValidMove = function(toSquare, n = 1) {
    if (n == 0) return { valid: false, capture: null };
    if ((toSquare.x == this.x || toSquare.y == this.y) && this.isPathClear(toSquare)) {
        return this.validateMove(toSquare);
    }
    return { valid: false, capture: null };
};

// Knight specific move logic
let Knight = function(x, y, color) {
    Piece.call(this, x, y, color, "knight");
};

// Inherit from Piece
Knight.prototype = Object.create(Piece.prototype);
Knight.prototype.constructor = Knight;

// Method to check if a move is valid for a Knight
Knight.prototype.isValidMove = function(toSquare, n = 1) {
    if (n == 0) return { valid: false, capture: null };
    let movementY = toSquare.y - this.y;
    let movementX = toSquare.x - this.x;
    if ((Math.abs(movementX) == 2 && Math.abs(movementY) == 1) || (Math.abs(movementX) == 1 && Math.abs(movementY) == 2)) {
        return this.validateMove(toSquare);
    }
    return { valid: false, capture: null };
};

// Bishop specific move logic
let Bishop = function(x, y, color) {
    Piece.call(this, x, y, color, "bishop");
};

// Inherit from Piece
Bishop.prototype = Object.create(Piece.prototype);
Bishop.prototype.constructor = Bishop;

// Method to check if a move is valid for a Bishop
Bishop.prototype.isValidMove = function(toSquare, n = 1) {
    if (n == 0) return { valid: false, capture: null };
    let movementY = toSquare.y - this.y;
    let movementX = toSquare.x - this.x;
    if (Math.abs(movementX) == Math.abs(movementY) && this.isPathClear(toSquare)) {
        return this.validateMove(toSquare);
    }
    return { valid: false, capture: null };
};

// Queen specific move logic
let Queen = function(x, y, color) {
    Piece.call(this, x, y, color, "queen");
};

// Inherit from Piece
Queen.prototype = Object.create(Piece.prototype);
Queen.prototype.constructor = Queen;

// Method to check if a move is valid for a Queen
Queen.prototype.isValidMove = function(toSquare, n = 1) {
    if (n == 0) return { valid: false, capture: null };
    let movementY = toSquare.y - this.y;
    let movementX = toSquare.x - this.x;
    if ((Math.abs(movementX) == Math.abs(movementY) || movementX == 0 || movementY == 0) && this.isPathClear(toSquare)) {
        return this.validateMove(toSquare);
    }
    return { valid: false, capture: null };
};

// King specific move logic
let King = function(x, y, color) {
    Piece.call(this, x, y, color, "king");
    this.checkedBy = null; // Piece putting the king in check
};

// Inherit from Piece
King.prototype = Object.create(Piece.prototype);
King.prototype.constructor = King;

// Method to check if a move is valid for a King
King.prototype.isValidMove = function(toSquare, n = 1) {
    if (n == 0) return { valid: false, capture: null };
    let movementY = toSquare.y - this.y;
    let movementX = toSquare.x - this.x;
    if (Math.abs(movementX) <= 1 && Math.abs(movementY) <= 1) {
        let result = this.validateMove(toSquare);
        if (!result.valid) return result;

        let oldPiece = toSquare.piece;
        toSquare.unsetPiece();
        for (let i = 0; i < pieces.length; i++) {
            if (pieces[i].color != this.color && pieces[i].isValidMove(toSquare, n - 1).valid) {
                result.valid = false;
                break;
            }
        }
        toSquare.setPiece(oldPiece);
        return result;
    }
    return { valid: false, capture: null };
};

// Pawn specific move logic
let Pawn = function(x, y, color) {
    Piece.call(this, x, y, color, "pawn");
};

// Inherit from Piece
Pawn.prototype = Object.create(Piece.prototype);
Pawn.prototype.constructor = Pawn;

// Method to check if a move is valid for a Pawn
Pawn.prototype.isValidMove = function(toSquare, n = 1) {
    if (n == 0) return { valid: false, capture: null };
    let movementY = toSquare.y - this.y;
    let movementX = toSquare.x - this.x;
    let direction = this.color == "white" ? -1 : 1;
    let result = { valid: false, capture: null };

    // Check for pawn's double move from the initial position
    if (movementY == direction * 2 && movementX == 0 && this.y == (this.color == "white" ? 7 : 2) && !getSquare(this.x, this.y + direction).hasPiece() && !toSquare.hasPiece()) {
        result = { valid: true, capture: null };
        this.advancedtwo = turn;
    } else if (movementY == direction) {
        // Check for normal pawn movement and captures
        if (Math.abs(movementX) == 1) {
            if (toSquare.hasPiece() && toSquare.piece.color != this.color) {
                result = { valid: true, capture: toSquare };
            } else {
                let passantSquare = getSquare(this.x + movementX, this.y);
                if (passantSquare.hasPiece() && passantSquare.piece.color != this.color && passantSquare.piece.type == "pawn" && passantSquare.piece.advancedtwo == turn - 1) {
                    result = { valid: true, capture: passantSquare };
                }
            }
        } else if (movementX == 0 && !toSquare.hasPiece()) {
            result = { valid: true, capture: null };
        }
    }

    // Check for promotion
    if (result.valid && (toSquare.y == 1 || toSquare.y == 8)) {
        result.promote = true;
    }

    return result;
};

// Function to set up the board and pieces
let setup = function() {
    let boardContainer = document.getElementById("board");
    for (let i = 1; i <= 8; i++) {
        for (let j = 1; j <= 8; j++) {
            let squareElement = document.createElement("div");
            let color = (j + i) % 2 ? "dark" : "light";
            squareElement.addEventListener("click", squareClicked);
            squareElement.setAttribute("data-x", j);
            squareElement.setAttribute("data-y", i);
            let square = new SquareObject(j, i, color, false, squareElement, null);
            square.update();
            boardSquares.push(square);
            boardContainer.appendChild(squareElement);
        }
    }
    // Place kings on the board
    white.king = new King(5, 8, "white");
    black.king = new King(5, 1, "black");
    pieces.push(white.king);
    pieces.push(black.king);

    // Array of initial pieces for both players
    let initialPieces = [
        new Castle(1, 1, "black"), new Knight(2, 1, "black"), new Bishop(3, 1, "black"), new Queen(4, 1, "black"),
        new Bishop(6, 1, "black"), new Knight(7, 1, "black"), new Castle(8, 1, "black"),
        new Pawn(1, 2, "black"), new Pawn(2, 2, "black"), new Pawn(3, 2, "black"), new Pawn(4, 2, "black"),
        new Pawn(5, 2, "black"), new Pawn(6, 2, "black"), new Pawn(7, 2, "black"), new Pawn(8, 2, "black"),
        new Pawn(1, 7, "white"), new Pawn(2, 7, "white"), new Pawn(3, 7, "white"), new Pawn(4, 7, "white"),
        new Pawn(5, 7, "white"), new Pawn(6, 7, "white"), new Pawn(7, 7, "white"), new Pawn(8, 7, "white"),
        new Castle(1, 8, "white"), new Knight(2, 8, "white"), new Bishop(3, 8, "white"), new Queen(4, 8, "white"),
        new Bishop(6, 8, "white"), new Knight(7, 8, "white"), new Castle(8, 8, "white")
    ];

    pieces.push(...initialPieces);

    // Place all initial pieces on the board
    for (let i = 0; i < pieces.length; i++) {
        getSquare(pieces[i].x, pieces[i].y).setPiece(pieces[i]);
    }
};

// Function to display an error message
let showError = function(message) {
    document.getElementById("errorText").innerHTML = message;
    document.getElementById("errorMessage").className = "overlay show";
};

// Function to close the error message
let closeError = function() {
    document.getElementById("errorMessage").className = "overlay";
};

// Function to display the end of the game message
let showEnd = function(message) {
    document.getElementById("endText").innerHTML = message;
    document.getElementById("endMessage").className = "overlay show";
};

// Function to get the square object by its coordinates
let getSquare = function(x, y) {
    return boardSquares[(y - 1) * 8 + (x - 1)];
};

// Function to handle a square being clicked
let squareClicked = function(e) {
    let x = Number(this.getAttribute("data-x"));
    let y = Number(this.getAttribute("data-y"));
    let square = getSquare(x, y);
    if (selectedSquare === null) {
        if (square.piece === null) {
            showError("There is no piece here!");
        } else if (square.piece.color != currentPlayer.color) {
            showError("This is not your piece!");
        } else {
            selectedSquare = getSquare(x, y);
            selectedSquare.select();
        }
    } else {
        if (selectedSquare.x == x && selectedSquare.y == y) {
            selectedSquare.deselect();
            selectedSquare = null;
        } else {
            if (square.piece != null && square.piece.color == currentPlayer.color) {
                selectedSquare.deselect();
                selectedSquare = getSquare(x, y);
                selectedSquare.select();
            } else {
                move(selectedSquare, square);
            }
        }
    }
};

// Function to move a piece from one square to another
let move = function(start, end) {
    let piece = start.piece;
    currentPlayer.moved = start.piece;
    let moveResult = piece.isValidMove(end);
    if (currentPlayer == white) {
        black.checked = false;
        black.king.checkedBy = null;
    } else {
        white.checked = false;
        white.king.checkedBy = null;
    }
    if (moveResult.valid) {
        let capturedPiece = null;
        if (moveResult.capture !== null) {
            moveResult.capture.piece.capture();
            capturedPiece = moveResult.capture.piece;
            moveResult.capture.unsetPiece();
        }
        piece.x = end.x;
        piece.y = end.y;
        end.setPiece(piece);
        start.unsetPiece();
        if (kingExposed(currentPlayer.king)) {
            showError("That is an invalid move!");
            end.unsetPiece();
            piece.x = start.x;
            piece.y = start.y;
            start.setPiece(piece);
            if (moveResult.capture !== null) {
                capturedPiece.captured = false;
                moveResult.capture.setPiece(capturedPiece);
            }
            return;
        }
        end.piece.lastmoved = turn;
        start.unsetPiece();
        start.deselect();
        selectedSquare = null;
        if (moveResult.promote) {
            currentPlayer.promote = end.piece;
            showPromotion(currentPlayer);
            return;
        }
        if (currentPlayer == white) {
            if (end.piece.isValidMove(getSquare(black.king.x, black.king.y), 2).valid) {
                showError("Check");
                black.checked = true;
                black.king.checkedBy = end.piece;
            }
            if (kingExposed(black.king)) {
                black.checked = true;
                if (isCheckmate(black.king)) {
                    showError("Checkmate");
                    return;
                }
                showError("Check");
            }
        } else {
            if (end.piece.isValidMove(getSquare(white.king.x, white.king.y), 2).valid) {
                showError("Check");
                white.checked = true;
                white.king.checkedBy = end.piece;
            }
            if (kingExposed(white.king)) {
                white.checked = true;
                if (isCheckmate(white.king)) {
                    showError("Checkmate");
                    return;
                }
                showError("Check");
            }
        }
        nextTurn();
    } else {
        showError("That is an invalid move!");
        piece.x = start.x;
        piece.y = start.y;
        start.setPiece(start.piece);
    }
};

// Function to check if a move results in checkmate
let isCheckmate = function(king) {
    let myPlayer = currentPlayer;
    let otherPlayer = currentPlayer == white ? black : white;
    currentPlayer = otherPlayer;
    if (!currentPlayer.checked) {
        currentPlayer = myPlayer;
        return false;
    }

    // Check all adjacent squares for a valid move
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            if (king.x + i <= 8 && king.x + i >= 1 && king.y + j <= 8 && king.y + j >= 1) {
                if (i != 0 || j != 0) {
                    let square = getSquare(king.x + i, king.y + j);
                    if (square.piece != null && square.piece.color == currentPlayer.color) {
                        continue;
                    }
                    if (king.isValidMove(square).valid && !square.hasPiece()) {
                        let oldsquare = getSquare(king.x, king.y);
                        oldsquare.unsetPiece(king);
                        square.setPiece(king);
                        let kingId = (king.color == "white") ? 0 : 1;
                        pieces[kingId].x = king.x + i;
                        pieces[kingId].y = king.y + j;
                        if (!kingExposed(currentPlayer.king)) {
                            square.unsetPiece(king);
                            oldsquare.setPiece(king);
                            pieces[kingId].x = oldsquare.x;
                            pieces[kingId].y = oldsquare.y;
                            currentPlayer = myPlayer;
                            return false;
                        }
                        square.unsetPiece(king);
                        oldsquare.setPiece(king);
                        pieces[kingId].x = oldsquare.x;
                        pieces[kingId].y = oldsquare.y;
                    }
                }
            }
        }
    }

    // Check if any piece can capture the attacking piece
    for (let i = 0; i < pieces.length; i++) {
        if (currentPlayer.color == pieces[i].color) {
            if (pieces[i].isValidMove(getSquare(king.checkedBy.x, king.checkedBy.y), 2).valid) {
                currentPlayer = myPlayer;
                return false;
            }
        }
    }

    // Check if any piece can block the attacking piece
    if (!(king.checkedBy instanceof Knight)) {
        for (let i = 0; i < pieces.length; i++) {
            if (pieces[i].captured) continue;
            if (currentPlayer.color == pieces[i].color) {
                if (pieces[i] instanceof Pawn) {
                    for (let dir = 1; dir <= 2; dir++) {
                        let direction = currentPlayer.color == "white" ? -1 : 1;
                        let square = getSquare(pieces[i].x, pieces[i].y + direction * dir);
                        if (pieces[i].isValidMove(square, 2).valid) {
                            square.setPiece(pieces[i]);
                            if (!kingExposed(currentPlayer.king)) {
                                square.unsetPiece(pieces[i]);
                                currentPlayer = myPlayer;
                                return false;
                            }
                            square.unsetPiece(pieces[i]);
                        }
                    }
                } else {
                    // Check other pieces (Knight, Bishop, Castle, Queen) for blocking moves
                    // similar to the above pattern
                }
            }
        }
    }

    return true;
};

// Function to display the promotion message
let showPromotion = function(player) {
    document.getElementById("promotionMessage").className = "overlay show";
    document.getElementById("promotionList").className = player.color;
};

// Function to close the promotion message
let closePromotion = function() {
    document.getElementById("promotionMessage").className = "overlay";
};

// Function to handle the promotion of a pawn
let promote = function(type) {
    let newPiece;
    let oldPiece = currentPlayer.promote;
    let index = pieces.indexOf(oldPiece);
    switch (type) {
        case "queen":
            newPiece = new Queen(oldPiece.x, oldPiece.y, oldPiece.color);
            break;
        case "castle":
            newPiece = new Castle(oldPiece.x, oldPiece.y, oldPiece.color);
            break;
        case "bishop":
            newPiece = new Bishop(oldPiece.x, oldPiece.y, oldPiece.color);
            break;
        case "knight":
            newPiece = new Knight(oldPiece.x, oldPiece.y, oldPiece.color);
            break;
    }
    if (index != -1) {
        getSquare(oldPiece.x, oldPiece.y).unsetPiece();
        pieces[index] = newPiece;
        getSquare(oldPiece.x, oldPiece.y).setPiece(newPiece);
        currentPlayer.promote = null;
        closePromotion();
        if (currentPlayer == white) {
            if (newPiece.isValidMove(getSquare(black.king.x, black.king.y), 2).valid) {
                showError("Check");
                black.checked = true;
                black.king.checkedBy = newPiece;
            }
            if (kingExposed(black.king)) {
                showError("Check");
                black.checked = true;
                black.king.checkedBy = newPiece;
            }
        } else {
            if (newPiece.isValidMove(getSquare(white.king.x, white.king.y), 2).valid) {
                showError("Check");
                white.checked = true;
            }
            if (kingExposed(white.king)) {
                showError("Check");
                white.checked = true;
            }
        }
        nextTurn();
    }
};

// Function to check if the king is exposed (in check)
let kingExposed = function(at) {
    for (let i = 0; i < pieces.length; i++) {
        let square = getSquare(pieces[i].x, pieces[i].y);
        if (pieces[i].color != at.color && pieces[i].captured == false) {
            if (pieces[i] instanceof Pawn) {
                let direction = pieces[i].color == "white" ? -1 : 1;
                let movementY = (at.y - pieces[i].y);
                let movementX = (at.x - pieces[i].x);
                if (movementY == direction && Math.abs(movementX) == 1) {
                    at.checkedBy = pieces[i];
                    return true;
                }
            } else {
                if (square.piece.isValidMove(getSquare(at.x, at.y)).valid) {
                    at.checkedBy = pieces[i];
                    return true;
                }
            }
        }
    }
    return false;
};

// Function to proceed to the next turn
let nextTurn = function() {
    turn++;
    if (currentPlayer.color == "white") {
        currentPlayer = black;
        document.getElementById("turnInfo").innerHTML = "Player's turn: <b>Black</b>";
    } else {
        currentPlayer = white;
        document.getElementById("turnInfo").innerHTML = "Player's turn: <b>White</b>";
    }
};

// Initialize the game
setup();
