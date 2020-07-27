import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

// Images used to explain how to play the game.
import left from './images/left.png';
import right from './images/right.png';
import space from './images/space.png';

// Simple component to draw a square of the board.
class Square extends React.Component {
  render() {
    return (
      <button className={"square " + this.props.class} ></button>
    );
  }
}

// This component draws the game current state of the game.
class Board extends React.Component {
  
  renderSquare(i) {
    return <Square key={i} class={this.props.squares[i]} />;
  }

  // Function to draw a row in the board. 'index' is the first square of the row.
  generateRow(index, max) {
    let rows = [];

    for (index; index < max; index++) {
      rows.push(this.renderSquare(index));
    }
    return rows;
  };

  // Function to draw a board given the number of columns and rows.
  generateBoard(columns, rows) {
    let board = [];

    // Each "columns" squares it is added a new row.
    for (let i = 0; i < columns*rows; i+=columns) {
        board.push(
          <div className="board-row" key={i}>
            {this.generateRow(i, i + columns)}
          </div>
        ); 
    }

    return board;
  };
 
  render() {
    return (
      <div>
        {this.generateBoard(this.props.width, this.props.height)}
      </div>
    );
  }
}

// Main component that contains the description of the state and the functions to update it.
class Game extends React.Component {

  constructor(props){
    super(props);
    const width = 40;
    const height = 30;
    const brickWidth = 8; 
    const brickLines = 2;
    const paddleWidth = 7;
    const numberSquares = width*height;
    this.state = {
      width: width,
      height: height,
      brickWidth: brickWidth,
      brickLines: brickLines,
      paddleWidth: paddleWidth,
      squares: Array(numberSquares).fill(null),
      ballPosition: null,
      ballDirection: 'north-east',
      paddlePosition: null,
      gameState: 'playing',
      score: 0,
      brickNumber: null,
    };
    this.handleKeyboardEvents = this.handleKeyboardEvents.bind(this);
    this.handleFormChange = this.handleFormChange.bind(this);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  // Built-in method used to set up a timer of 0.2 seconds.
  componentDidMount() {
    // The timer is represented for the 'tick' function.
    this.interval = setInterval(() => this.tick(), 200);
    // For convenience, the game is initialized with three key parameters: brick width, brick lines and paddle width.
    this.initValues(this.state.brickWidth,this.state.brickLines,this.state.paddleWidth);
    document.addEventListener("keydown", this.handleKeyboardEvents, false);
  }

  // The 'tick' function makes an one-step update in the game state.
  tick() {
    if (this.state.gameState === 'playing') {
      this.generateNextPosition();
    }
  }

  // Function to initialize the state of the game. It is called for a new game.
  initValues(brickWidth,brickLines,paddleWidth) {
    const width = this.state.width;
    const height = this.state.height;
    const numberSquares = width*height;
    let squares = Array(numberSquares).fill(null);

    // Ball position: penultimate line and in the middle of the board.
    const ballPosition = (this.state.height - 2)*width + Math.floor(width/2);
    squares[ballPosition] = 'ball';

    // It is defined the position of the bricks (the north-west corner).
    const bricksPerLine = Math.floor(width/brickWidth);
    let bricks = [];
    for (let j = 0; j < brickLines; j++) {
      for (let i = 0; i < bricksPerLine; i++) {
        // It is considered bricks of a height equal to 2 squares, so the line j is in 2*width*j.
        bricks.push(2*width*j + brickWidth*i);
      }
    }

    // Given the brick positions, it is drawn each brick.
    for (let brick of bricks) {
      // Left end of the brick.
      squares[brick] = 'nw-brick';
      squares[brick + width] = 'sw-brick';
      // Center of the brick.
      for (let i = 1; i < brickWidth - 1; i++) {
        squares[brick + i] = 'n-brick';
        squares[brick + width + i] = 's-brick'; 
      }
      // Right end of the brick.
      squares[brick + brickWidth - 1] = 'ne-brick';
      squares[brick + width + brickWidth - 1] = 'se-brick';
    } 

    // Paddle position: last line and in the middle of the board.
    const bottomMiddle = (this.state.height - 1)*width + Math.floor(width/2);
    // For drawing the paddle: it is calculated the half of the paddle.
    const halfPaddleWidth = Math.floor(paddleWidth/2);
    
    // Left end of the paddle.
    squares[bottomMiddle - halfPaddleWidth] = 'paddle-left';
    // Center of the paddle.
    for (let i = 1; i < paddleWidth - 1; i++) {
      squares[bottomMiddle - halfPaddleWidth + i] = 'paddle';   
    }
    // Right end of the paddle.
    squares[bottomMiddle + halfPaddleWidth] = 'paddle-right';
    
    // State update.
    this.setState({
      squares: squares,
      ballPosition: ballPosition,
      paddlePosition: bottomMiddle,
      brickNumber: bricksPerLine*brickLines,
    });
  }

  // In this function is generated the next valid position and it is checked the effect in the game. 
  generateNextPosition() {
    const width = this.state.width;
    const height = this.state.height;

    let squares = this.state.squares.slice();
    let ballPosition = this.state.ballPosition;
    let ballDirection = this.state.ballDirection;
    let gameState = this.state.gameState;
    
    /* 'nextPosition' and 'nextDirection' are used to estimate the next position and direction only 
    considering the limits of the board (the walls). */
    let nextPosition = ballPosition;
    let nextDirection = ballDirection;

    /* 'newPosition' and 'newDirection' are used to estimate the definitive position and direction 
    considering the bricks and the paddle. */
    let newPosition = null;
    let newDirection = null;

    // It is determined the new direction. Multiple scenarios are considered for each case.
    switch(ballDirection) {
      case 'north-east':
        if (ballPosition + 1 === width) // The ball reached the top-east corner.
          nextDirection = 'south-west';
        else if (ballPosition + 1 < width) // The ball reached the top wall.
          nextDirection = 'south-east';
        else if ((ballPosition + 1) % width === 0) // The ball reached the right wall.
          nextDirection = 'north-west';  
        break;
      case 'north-west':
        if (ballPosition === 0) // The ball reached the top-west corner.
          nextDirection = 'south-east';
        else if (ballPosition < width) // The ball reached the top wall.
          nextDirection = 'south-west';
        else if (ballPosition % width === 0) // The ball reached the left wall.
          nextDirection = 'north-east'; 
        break;
      case 'south-east':
        if ((ballPosition + 1) % width === 0) // The ball reached the right wall.
          nextDirection = 'south-west';
        break;
      case 'south-west':
        if (ballPosition % width === 0) // The ball reached the left wall.
          nextDirection = 'south-east';
        break;
      default:
        break;
    }

    // It is set the next position based in the next direction.
    const horizontalMove = nextDirection.substring(0, 5) === 'south' ? width : -width;
    const verticalMove = nextDirection.substring(6, 10) === 'east' ? 1 : -1; 
    nextPosition = ballPosition + horizontalMove + verticalMove;

    // It is checked if the game is lost.
    if (nextPosition > width*height){
      gameState = 'lost';
    }

    // If the game is not lost, it is calculated the definitive position considering the bricks and the paddle.
    if (gameState !== 'lost') {
      [newPosition,newDirection] = this.processPosition(nextPosition,nextDirection);
    };

    /* It is relevant the copy of the 'squares' variable in this point because the 'processPosition' function
    updates the state of the game if it is needed to remove a brick. */
    squares = this.state.squares.slice();
    
    // In any case, the ball is deleted from the previous position.
    squares[ballPosition] = null;
    // If the game is not lost, it is updated the new ball position.
    if (gameState !== 'lost') {
      squares[newPosition] = 'ball';
    }

    // It is checked if the game is won based in the remaining bricks.
    const brickNumber = this.state.brickNumber;
    if (brickNumber === 0) {
      gameState = 'won';
    }

    // State update.
    this.setState({
      squares: squares,
      ballPosition: newPosition,
      ballDirection: newDirection,
      gameState: gameState,
    });

  }

  /* Given the next position and direction, it is calculated the definitive new position and direction
  considering the bricks and the paddle. */
  processPosition(nextPosition,nextDirection){
    const width = this.state.width;
    let squares = this.state.squares;
    let nextSquare = squares[nextPosition];
    let newPosition = nextPosition;
    let newDirection = nextDirection;

    switch(nextSquare) {
      // Regarding the bricks, for simplicity, it is only considered the case when the ball is coming from below.
      case 'sw-brick':
      case 'se-brick':
      case 's-brick':
        this.removeBrick(nextPosition);
        // Direction update.
        if (nextDirection === 'north-west')
          newDirection = 'south-west';
        else if (nextDirection === 'north-east')
          newDirection = 'south-east';
        newPosition = newPosition + 2*width;
        break;
      // Paddle scenario.
      case 'paddle':
      case 'paddle-left':
      case 'paddle-right':
        // Direction update.
        if (nextDirection === 'south-west')
          newDirection = 'north-west';
        else if (nextDirection === 'south-east')
          newDirection = 'north-east';
        // Position update.
        newPosition = newPosition - 2*width;
        break;
      default:
        break;
    }

    return [newPosition,newDirection];
  }

  // Given a square position, it is removed the brick in that position. 
  removeBrick(position){
    let squares = this.state.squares.slice();
    let score = this.state.score;
    let brickNumber = this.state.brickNumber;

    // It is searched the south west corner of the brick.
    let SWCorner = position - (position % this.state.brickWidth);

    // For simplicity, it is assumed that the given position it is a south position of the brick.
    for (let i = 0; i < this.state.brickWidth; i++) {
      // It is removed the south part of the brick.
      squares[SWCorner + i] = null;
      // It is removed the north part of the brick.
      squares[SWCorner - this.state.width + i] = null;
    }

    // It is updated the score and the brick number.
    score++;
    brickNumber--;

    // State update.
    this.setState({
      squares: squares,
      score: score,
      brickNumber: brickNumber,
    });
  }

  // Function to handle the keyboard inputs.
  handleKeyboardEvents(event){

    // Left and right keys.
    if (event.keyCode === 37 || event.keyCode === 39) {
      let direction = (event.keyCode === 37) ? 'left' : 'right';
      this.paddleMove(direction);
    }
    // Space key.
    if (event.keyCode === 32 ) {
      event.preventDefault();
      this.playerShot();
    }
  }

  // This function move the paddle given a direction (left or right).
  paddleMove(direction) {
    const width = this.state.width;
    const height = this.state.height;
    let paddlePosition = this.state.paddlePosition;
    let squares = this.state.squares.slice();

    // For re-drawing the paddle: it is calculated the half of the paddle.
    const halfPaddleWidth = Math.floor(this.state.paddleWidth/2);
    // They are set right and left limits of the paddle movement.
    const leftLimit = (height - 1)*width + halfPaddleWidth;
    const rightLimit = height*width - halfPaddleWidth - 1;

    // It is updated the position of the paddle.
    if (direction === 'left' && paddlePosition > leftLimit){
      paddlePosition--;
      squares[paddlePosition + halfPaddleWidth + 1] = null;
    } else if (direction === 'right' && paddlePosition < rightLimit){
      paddlePosition++;
      squares[paddlePosition - halfPaddleWidth - 1] = null;
    }

    // It is drown the left end of the paddle.
    squares[paddlePosition - halfPaddleWidth] = 'paddle-left';
    // Center of the paddle.
    for (let i = 1; i < this.state.paddleWidth - 1; i++) {
      squares[paddlePosition - halfPaddleWidth + i] = 'paddle';   
    }
    // Right end of the paddle.
    squares[paddlePosition + halfPaddleWidth] = 'paddle-right';

    // State update.
    this.setState({
      squares: squares,
      paddlePosition: paddlePosition,
    });  
  }

  // Function to handle the form inputs for a new game.
  handleFormChange(event) {
    var value = parseInt(event.target.value);
    if (Number.isInteger(value)) {
      /* For each case, they are reviewed basic limits considering a proper display of the board. This revision is not
      exhaustive, for example, it is allowed a 'brick-width' higher than the board width. The new values are stored
      in new variables until the form submit. */
      switch(event.target.id) {
        case 'brick-width':
          if (value > 0 && value < 101) {
            this.setState({
              nextBrickWidth: event.target.value,
            });
          };
          break;
        case 'brick-lines':
          if (value > 0 && value < 11) {
            this.setState({
              nextBrickLines: event.target.value,
            });
          };
          break;
        case 'paddle-width':
          if (value > 0 && value < 21) {
            this.setState({
              nextPaddleWidth: event.target.value,
            });
          };
          break;
        default:
          break;
      }
    }  
  }

  // Function to handle the form submit for a new game.
  handleFormSubmit(event) {
    event.preventDefault();
    const width = this.state.width;
    const height = this.state.height;
    const numberSquares = width*height;
    let squares = Array(numberSquares).fill(null);

    // The variable that set the game state are updated with the values saved previously, if they exists.
    const brickWidth = this.state.nextBrickWidth === undefined ? this.state.brickWidth : this.state.nextBrickWidth; 
    const brickLines = this.state.nextBrickLines === undefined ? this.state.brickLines : this.state.nextBrickLines; 
    const paddleWidth = this.state.nextPaddleWidth === undefined ? this.state.paddleWidth : this.state.nextPaddleWidth; 
    this.setState({
      width: width,
      height: height,
      brickWidth: brickWidth,
      brickLines: brickLines,
      paddleWidth: paddleWidth,
      squares: squares,
      ballPosition: null,
      ballDirection: 'north-east',
      paddlePosition: null,
      gameState: 'playing',
      score: 0,
      brickNumber: null,
    });
    // A new call to 'initValues' is made.
    this.initValues(parseInt(brickWidth),parseInt(brickLines),parseInt(paddleWidth));

  }

  // This function simulates a shot removing the first brick find it in a row.
  playerShot() {
    let squares = this.state.squares.slice();
    let paddlePosition = this.state.paddlePosition;

    // Starting in the paddle position, it is reviewed the bricks in the same row until the top of the board.
    for (let i = paddlePosition; i > 0; i-= this.state.width){
      if (squares[i] === 'sw-brick' || squares[i] === 'se-brick' || squares[i] === 's-brick') {
        this.removeBrick(i);
        break; 
      }  
    }
  }

  // Rendering the game.
  render() {
    return (
      <div className="game">
        <div className="intro">
          <h2>Brick breaker</h2>
          Use <img height="20" alt="" src={left}/> and <img height="20" alt="" src={right}/> to move the paddle,
          <img height="20" alt="" src={space}/> to shot.
        </div>
        <div className="game-board">
          <Board
            squares = {this.state.squares}
            width = {this.state.width}
            height = {this.state.height}            
          />
        </div>
        <h3> State: {this.state.gameState}! </h3>
        <h3> Score: {this.state.score} </h3>
        <div className="game-info">
          <form onSubmit={this.handleFormSubmit} className="new-game">
            <label htmlFor="brick-width">Brick width: </label>
            <input
              id="brick-width"
              onChange={this.handleFormChange}
              defaultValue={this.state.brickWidth}
              className="input"
            /><span className="span"> Between 1 and 100.</span><br/>
            <label htmlFor="brick-lines">Brick lines: </label>
            <input
              id="brick-lines"
              onChange={this.handleFormChange}
              defaultValue={this.state.brickLines}
              className="input"
            /><span className="span"> Between 1 and 10.</span><br/>
            <label htmlFor="paddle-width">Paddle width: </label>
            <input
              id="paddle-width"
              onChange={this.handleFormChange}
              defaultValue={this.state.paddleWidth}
              className="input"
            /><span className="span"> Between 1 and 20.</span><br/>
            <button className="button">
              New game
            </button>
          </form>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game/>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
