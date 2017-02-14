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

/* global _ */

'use strict';

var canvas = document.getElementById('canvas'),
    context = canvas.getContext('2d'),
    scoreCounter = $('#score-counter'),
    highScoreCounter = $('#high-score-counter'),
    timeCounter = $('#time-counter'),
    leaderboard = $('#leaderboard > tbody'),
    youDiedModal = $('#you-died-modal'),
    youDiedModalPlayerName = $('#you-died-modal #player-name'),
    youDiedModalScore = $('#you-died-modal #statistics-score'),
    youDiedModalTime = $('#you-died-modal #statistics-time'),
    gameLoopInterval, timeUpdateInterval;

var CANVAS_TO_PARENT_SIZE_PROPORTION = 1.1;
canvas.height = canvas.width = $(canvas).parent().width() / CANVAS_TO_PARENT_SIZE_PROPORTION;

var FIELD_WIDTH = 30, // Field width in cells
    FIELD_HEIGHT = 30, // Field height in cells
    CELL_SIZE = canvas.width / FIELD_WIDTH,
    GAME_LOOP_INTERVAL_MS = 100,
    SNAKE_BLINKING_INTERVAL_MS = 150, // Snake blinks after death
    SNAKE_BLINKING_TIME_MS = 2000; // How many snake will be blinking

// Adding responsivity for canvas
$(window).on('resize', _.debounce(function() {
    // Size values are recalculated on each resize
    canvas.height = canvas.width = $(canvas).parent().width() / CANVAS_TO_PARENT_SIZE_PROPORTION;
    CELL_SIZE = canvas.width / FIELD_WIDTH;
}, GAME_LOOP_INTERVAL_MS));

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
    if (!_.isEmpty(name))
        leaderboard.prepend(
            '<tr>' +
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

context.fillCircle = function fillCircle(x, y, radius) {
    this.beginPath();
    var centerX = x * CELL_SIZE + radius;
    var centerY = y * CELL_SIZE + radius;
    this.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    this.fill();
};

// canTurn is used as fix for this bug: if player presses two keys in one game loop interval, snake can turn around
var snake, fruit, score, time, canTurn, highScore = 0;

$(document.body).on('keydown', function(evt) {
    if (canTurn) {
        canTurn = false;
        var keyCode = evt.keyCode;
        var head = _.head(snake);
        if ((keyCode == KEY_CODES.leftArrow || keyCode == KEY_CODES.a) && head.direction != 'right')
            head.direction = 'left';
        else if ((keyCode == KEY_CODES.upArrow || keyCode == KEY_CODES.w) && head.direction != 'down')
            head.direction = 'up';
        else if ((keyCode == KEY_CODES.rightArrow || keyCode == KEY_CODES.d) && head.direction != 'left')
            head.direction = 'right';
        else if ((keyCode == KEY_CODES.downArrow || keyCode == KEY_CODES.s) && head.direction != 'up')
            head.direction = 'down';
    }
});

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
    canTurn = true;
}

function drawScore() {
    scoreCounter.html(score);
    if (score > highScore)
        highScore = score;
    highScoreCounter.html(highScore);
}

function draw() {
    context.strokeStyle = 'black';
    context.fillStyle = 'black';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeRect(0, 0, canvas.width, canvas.height);

    context.fillCircle(fruit.x, fruit.y, CELL_SIZE / 2 - 1);

    // Saving data from previous last cell, to spawn there new cell, if snake eats fruit
    var prevLastX = _.last(snake).x,
        prevLastY = _.last(snake).y,
        prevLastDirection = _.last(snake).direction;

    var head = _.head(snake);

    // Checking if head touches any cell from tail
    var cell, i;
    for (i = 1; i < snake.length; i++) {
        cell = snake[i];
        if (head.x == cell.x && head.y == cell.y) {
            clearInterval(gameLoopInterval);
            clearInterval(timeUpdateInterval);

            var blinkingIsVisible = true;
            var blinkingInterval = setInterval(function() {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.strokeRect(0, 0, canvas.width, canvas.height);

                if (blinkingIsVisible) {
                    for (i = 0; i < snake.length; i++) {
                        cell = snake[i];
                        context.fillRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    }
                }

                blinkingIsVisible = !blinkingIsVisible;
            }, SNAKE_BLINKING_INTERVAL_MS);

            setTimeout(function() {
                clearInterval(blinkingInterval);
                youDiedModalScore.html(score);
                youDiedModalTime.html(time + ' sec');
                youDiedModal.modal('show');
            }, SNAKE_BLINKING_TIME_MS);

            return;
        }
    }

    for (i = 0; i < snake.length; i++) {
        cell = snake[i];
        context.fillRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

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

    canTurn = true;
}

function normalizeCoord(coord, maxValue) {
    coord = coord % maxValue;
    if (coord < 0) coord = maxValue + coord;
    return coord;
}

function runGame() {
    setup();
    timeUpdateInterval = setInterval(function() {
        timeCounter.html(time + ' sec');
        time++;
    }, 1000);
    gameLoopInterval = setInterval(draw, GAME_LOOP_INTERVAL_MS);
}

runGame();
