/*
 * Copyright (c) 2017 Dmytro Meleshko
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    scoreCounter = document.getElementById('score-counter'),
    highScoreCounter = document.getElementById('high-score-counter'),
    timeCounter = document.getElementById('time-counter'),
    leaderboardBody = $('#leaderboard > tbody'),
    youDiedModal = $('#you-died-modal'),
    youDiedModalPlayerName = $('#you-died-modal #player-name'),
    gameLoopInterval, timeUpdateInterval;

canvas.height = canvas.width = $(document).width() / 2.4;

var FIELD_WIDTH = 30, // Field width in cells
    FIELD_HEIGHT = 30, // Field height in cells
    CELL_WIDTH = canvas.width / FIELD_WIDTH,
    CELL_HEIGHT = canvas.height / FIELD_HEIGHT,
    GAME_LOOP_INTERVAL_MS = 100,
    SNAKE_BLINKING_INTERVAL_MS = 150, // Snake blinks after death
    SNAKE_BLINKING_TIME_MS = 2000; // How many snake will be blinking

var KEY_CODES = {
    leftArrow: 37,
    upArrow: 38,
    rightArrow: 39,
    downArrow: 40,
    w: 87,
    a: 65,
    s: 83,
    d: 68,
    enter: 13
};

// Setting up "You Died!" modal
youDiedModal.on('shown.bs.modal', function() {
    youDiedModalPlayerName.focus();
});
youDiedModal.on('hidden.bs.modal', function() {
    var name = youDiedModalPlayerName.val();
    if (name !== null && name != undefined && name.length > 0)
        leaderboardBody.prepend('<tr>' +
            '<td>' + name + '</td>' +
            '<td>' + score + '</td>' +
            '<td>' + time + ' sec</td>' +
            '</tr>');
    youDiedModalPlayerName.val('');
    runGame();
});
// Setting up "You Died!" modal's player name text field
youDiedModalPlayerName.keyup(function(evt) {
    if (evt.keyCode == KEY_CODES.enter)
        youDiedModal.modal('hide');
});

context.drawCircle = function drawCircle(x, y, radius) {
    this.beginPath();
    var centerX = x * CELL_WIDTH + radius;
    var centerY = y * CELL_HEIGHT + radius;
    this.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.fill();
};

var snake, fruit, score, highScore = 0,
    time;

function setup() {
    snake = [
        // First element is the head of the snake
        {
            x: Math.floor(FIELD_WIDTH / 2),
            y: Math.floor(FIELD_HEIGHT / 2),
            // Getting random direction
            direction: ['left', 'up', 'right', 'down'][Math.floor(Math.random() * 4)]
        }
    ];

    // First fruit will be spawned on random cell
    fruit = {
        x: Math.floor(Math.random() * FIELD_WIDTH),
        y: Math.floor(Math.random() * FIELD_HEIGHT)
    };

    score = 0;
    drawScore();

    time = 0;
}

function drawScore() {
    scoreCounter.innerHTML = score;
    if (score > highScore)
        highScore = score;
    highScoreCounter.innerHTML = highScore;
}

function draw() {
    context.strokeStyle = 'black';
    context.fillStyle = 'black';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeRect(0, 0, canvas.width, canvas.height);

    context.drawCircle(fruit.x, fruit.y, CELL_WIDTH / 2 - 1);

    // Saving data from previous last cell, to spawn there new cell, if snake eats fruit
    var prevLastX = snake[snake.length - 1].x,
        prevLastY = snake[snake.length - 1].y,
        prevLastDirection = snake[snake.length - 1].direction;

    var head = snake[0];

    var i, cell;
    // Checking if head touches any cell from tail
    for (i = 1; i < snake.length; i++) {
        cell = snake[i];
        if (head.x == cell.x && head.y == cell.y) {
            clearInterval(gameLoopInterval);
            clearInterval(timeUpdateInterval);

            var blinkingIsVisible = true;
            var blinkingInterval = setInterval(function() {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.strokeRect(0, 0, canvas.width, canvas.height);

                for (i = 0; i < snake.length; i++) {
                    cell = snake[i];
                    if (blinkingIsVisible)
                        context.fillRect(cell.x * CELL_WIDTH, cell.y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
                }

                blinkingIsVisible = !blinkingIsVisible;
            }, SNAKE_BLINKING_INTERVAL_MS);

            setTimeout(function() {
                clearInterval(blinkingInterval);
                youDiedModal.modal('show');
            }, SNAKE_BLINKING_TIME_MS);

            return;
        }
    }

    for (i = 0; i < snake.length; i++) {
        cell = snake[i];
        context.fillRect(cell.x * CELL_WIDTH, cell.y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);

        if (cell.direction == 'left') cell.x--;
        else if (cell.direction == 'up') cell.y--;
        else if (cell.direction == 'right') cell.x++;
        else if (cell.direction == 'down') cell.y++;

        cell.x = normalizeCoord(cell.x, FIELD_WIDTH);
        cell.y = normalizeCoord(cell.y, FIELD_HEIGHT);
    }

    if (head.x == fruit.x && head.y == fruit.y) {
        // Adding new cell to tail of the snake
        snake.push({ x: prevLastX, y: prevLastY, direction: prevLastDirection });
        // Respawning fruit
        fruit = {
            x: Math.floor(Math.random() * FIELD_WIDTH),
            y: Math.floor(Math.random() * FIELD_HEIGHT)
        };

        score++;
        drawScore();
    }

    // Changing direction of cells
    for (i = snake.length - 1; i >= 1; i--) {
        cell = snake[i];
        var nextCell = snake[i - 1];
        cell.direction = nextCell.direction;
    }
}

function normalizeCoord(coord, maxValue) {
    coord = coord % maxValue;
    if (coord < 0) coord = maxValue + coord;
    return coord;
}

function changeDirectionEvent(evt) { // eslint-disable-line no-unused-vars
    var keyCode = evt.keyCode;
    var headDirection = snake[0].direction;
    if ((keyCode == KEY_CODES.leftArrow || keyCode == KEY_CODES.a) && headDirection != 'right')
        snake[0].direction = 'left';
    else if ((keyCode == KEY_CODES.upArrow || keyCode == KEY_CODES.w) && headDirection != 'down')
        snake[0].direction = 'up';
    else if ((keyCode == KEY_CODES.rightArrow || keyCode == KEY_CODES.d) && headDirection != 'left')
        snake[0].direction = 'right';
    else if ((keyCode == KEY_CODES.downArrow || keyCode == KEY_CODES.s) && headDirection != 'up')
        snake[0].direction = 'down';
}

function runGame() {
    setup();
    timeUpdateInterval = setInterval(function() {
        timeCounter.innerHTML = time + ' sec';
        time++;
    }, 1000);
    gameLoopInterval = setInterval(draw, GAME_LOOP_INTERVAL_MS);
}

runGame();
