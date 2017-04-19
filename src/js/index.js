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

(function() {
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

    var PARENT_SIZE_TO_CANVAS_PROPORTION = 1.1;
    var canvasSize = resizeCanvas();

    function resizeCanvas() {
        var newCanvasSize = $(canvas).parent().width() / PARENT_SIZE_TO_CANVAS_PROPORTION;
        canvas.height = canvas.width = newCanvasSize;
        return newCanvasSize;
    }

    var FIELD_WIDTH = 30, // Field width in cells
        FIELD_HEIGHT = 30, // Field height in cells
        CELL_SIZE = canvasSize / FIELD_WIDTH,
        GAME_LOOP_INTERVAL_MS = 100,
        SNAKE_BLINKING_INTERVAL_MS = 150, // How fast snake blinks after death
        SNAKE_BLINKING_TIME_MS = 2000; // How long snake blinks after death

    // Adding responsivity for canvas
    $(window).on('resize', _.debounce(function() {
        // Size values are recalculated on each resize
        canvasSize = resizeCanvas();
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
        var playerName = youDiedModalPlayerName.val();
        if (!_.isEmpty(playerName))
            leaderboard.prepend(
                '<tr>' +
                '<td>' + playerName + '</td>' +
                '<td>' + score + '</td>' +
                '<td>' + startTime + ' sec</td>' +
                '</tr>');
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

    // canTurn is used as fix for this bug: if player presses two keys in one game loop interval, snake can hit itself
    var snake, fruit, score, startTime, canTurn, highScore = 0;

    $(document.body).on('keydown', function(evt) {
        if (canTurn) {
            canTurn = false;
            var keyCode = evt.keyCode;
            var head = _.head(snake);
            if ((keyCode == KEY_CODES.leftArrow || keyCode == KEY_CODES.a) && head.direction != 'right')
                head.direction = 'left';
            else if ((keyCode == KEY_CODES.upArrow || keyCode == KEY_CODES.w) && head.direction != 'down')
                head.direction = 'up';
            else if ((keyCode == KEY_CODES.rightArrow || keyCode == KEY_CODES.d) && head.direction !=
                'left')
                head.direction = 'right';
            else if ((keyCode == KEY_CODES.downArrow || keyCode == KEY_CODES.s) && head.direction != 'up')
                head.direction = 'down';
        }
    });

    function setup() {
        snake = [
            // First element is the head of the snake
            {
                // Spawn snake in the center of the field
                x: Math.floor(FIELD_WIDTH / 2),
                y: Math.floor(FIELD_HEIGHT / 2),
                // Getting random direction
                direction: _.sample(['left', 'up', 'right', 'down'])
            }
        ];

        // First fruit will be spawned on random cell
        fruit = {
            x: _.random(FIELD_WIDTH),
            y: _.random(FIELD_HEIGHT)
        };

        score = 0;
        drawScore();

        startTime = _.now();
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

        var msSinceStart = _.now() - startTime;
        var secSinceStart = Math.floor(msSinceStart / 1000);
        timeCounter.html(secSinceStart + ' sec');

        // Saving data from previous last cell, to spawn there new cell, if snake eats fruit
        var prevTail = _.clone(_.last(snake));

        if (isHeadTouchingCell()) {
            killSnake();
            return;
        }

        moveSnake();
        checkIfSnakeEatsFruit(prevTail);
        updateCellDirections();

        canTurn = true;
    }

    function isHeadTouchingCell() {
        var head = _.head(snake);

        for (var i = 1; i < snake.length; i++) {
            var cell = snake[i];
            if (head.x == cell.x && head.y == cell.y) {
                return true;
            }
        }

        return false;
    }

    function killSnake() {
        clearInterval(gameLoopInterval);
        clearInterval(timeUpdateInterval);

        var blinkingIsVisible = true;
        var blinkingInterval = setInterval(function() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.strokeRect(0, 0, canvas.width, canvas.height);

            if (blinkingIsVisible) {
                for (var i = 0; i < snake.length; i++) {
                    var cell = snake[i];
                    context.fillRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                }
            }

            blinkingIsVisible = !blinkingIsVisible;
        }, SNAKE_BLINKING_INTERVAL_MS);

        setTimeout(function() {
            clearInterval(blinkingInterval);
            youDiedModalScore.html(score);
            youDiedModalTime.html(startTime + ' sec');
            youDiedModal.modal('show');
        }, SNAKE_BLINKING_TIME_MS);
    }

    function moveSnake() {
        for (var i = 0; i < snake.length; i++) {
            var cell = snake[i];
            context.fillRect(cell.x * CELL_SIZE, cell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            if (cell.direction == 'left') cell.x--;
            else if (cell.direction == 'up') cell.y--;
            else if (cell.direction == 'right') cell.x++;
            else if (cell.direction == 'down') cell.y++;

            cell.x = normalizeCoord(cell.x, FIELD_WIDTH);
            cell.y = normalizeCoord(cell.y, FIELD_HEIGHT);
        }
    }

    function checkIfSnakeEatsFruit(tailCell) {
        var head = _.head(snake);

        if (head.x == fruit.x && head.y == fruit.y) {
            snake.push(tailCell);

            fruit = {
                x: _.random(FIELD_WIDTH),
                y: _.random(FIELD_HEIGHT)
            };

            score++;
            drawScore();
        }
    }

    function updateCellDirections() {
        for (var i = snake.length - 1; i >= 1; i--) {
            var cell = snake[i];
            var nextCell = snake[i - 1];
            cell.direction = nextCell.direction;
        }
    }

    function normalizeCoord(coord, maxValue) {
        coord = coord % maxValue;
        if (coord < 0) coord = maxValue + coord;
        return coord;
    }

    function runGame() {
        setup();
        gameLoopInterval = setInterval(draw, GAME_LOOP_INTERVAL_MS);
    }

    runGame();
}());
