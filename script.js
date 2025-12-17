// --- ゲーム定数と変数 ---
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const ngCountDisplay = document.getElementById('ng-count');
const startButton = document.getElementById('start-button');
const speedSelect = document.getElementById('speed-select');
const messageArea = document.getElementById('message-area');
const gameStatusMessage = document.getElementById('game-status-message');

const GRID_SIZE = 20; // 蛇と餌のサイズ
const TILE_COUNT = canvas.width / GRID_SIZE; // 縦横のタイルの数
const MAX_NG = 10;

let snake = [];
let food = {};
let dx = GRID_SIZE; // x方向の移動量 (最初は右)
let dy = 0;         // y方向の移動量
let gameLoopInterval;
let gameSpeed = 100; // デフォルトは並み (ms)
let isGameRunning = false;
let ngCount = 0;
let score = 0;
let changingDirection = false;

// --- ゲーム初期化 ---
function initGame() {
    // 蛇を初期位置に配置
    snake = [
        { x: Math.floor(TILE_COUNT / 2) * GRID_SIZE, y: Math.floor(TILE_COUNT / 2) * GRID_SIZE },
        { x: (Math.floor(TILE_COUNT / 2) - 1) * GRID_SIZE, y: Math.floor(TILE_COUNT / 2) * GRID_SIZE }
    ];
    
    // 初期方向は右
    dx = GRID_SIZE;
    dy = 0;
    score = 0;
    ngCount = 0;
    isGameRunning = false;
    changingDirection = false;
    
    // スコアとNG回数をリセット
    scoreDisplay.textContent = score;
    ngCountDisplay.textContent = ngCount;

    // メッセージを非表示に
    messageArea.classList.add('hidden');
    gameStatusMessage.textContent = '';

    // 餌をランダムな位置に配置
    placeFood();

    // 初期描画
    drawGame();
}

// --- 描画関数 ---
function drawSnakePart(snakePart) {
    ctx.fillStyle = '#4a148c'; // 蛇の色
    ctx.strokeStyle = '#2e005d';
    ctx.fillRect(snakePart.x, snakePart.y, GRID_SIZE, GRID_SIZE);
    ctx.strokeRect(snakePart.x, snakePart.y, GRID_SIZE, GRID_SIZE);
}

function drawFood() {
    ctx.fillStyle = '#ff6f00'; // 餌の色
    ctx.fillRect(food.x, food.y, GRID_SIZE, GRID_SIZE);
}

function drawGame() {
    // 1. キャンバス全体をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. 餌を描画
    drawFood();
    
    // 3. 蛇を描画
    snake.forEach(drawSnakePart);
}

// --- 餌の配置 ---
function placeFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * TILE_COUNT) * GRID_SIZE,
            y: Math.floor(Math.random() * TILE_COUNT) * GRID_SIZE
        };
    } while (isFoodOnSnake(newFood)); // 蛇の上に餌がないかチェック
    
    food = newFood;
}

function isFoodOnSnake(newFood) {
    return snake.some(part => part.x === newFood.x && part.y === newFood.y);
}


// --- 蛇の移動とゲームロジック ---
function advanceSnake() {
    // 新しい頭の位置を計算
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // 蛇の配列の先頭に新しい頭を追加
    snake.unshift(head);
    
    // 餌を食べたかチェック
    const didEatFood = snake[0].x === food.x && snake[0].y === food.y;
    
    if (didEatFood) {
        // 餌を食べた場合: スコアを増やし、新しい餌を配置 (pop()しない)
        score++;
        scoreDisplay.textContent = score;
        placeFood();
    } else {
        // 餌を食べていない場合: 尻尾を削除
        snake.pop();
    }
    
    changingDirection = false;
}

// --- 衝突判定 ---
function checkCollision() {
    const head = snake[0];

    // 1. 自分の体への衝突 (頭が体の他の部分に触れたか)
    for (let i = 1; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) return true;
    }

    // 2. 壁への衝突
    const hitLeftWall = head.x < 0;
    const hitRightWall = head.x >= canvas.width;
    const hitTopWall = head.y < 0;
    const hitBottomWall = head.y >= canvas.height;

    return hitLeftWall || hitRightWall || hitTopWall || hitBottomWall;
}

// --- ゲームオーバー処理 ---
function gameOver(reason) {
    isGameRunning = false;
    clearInterval(gameLoopInterval);
    
    ngCount++;
    ngCountDisplay.textContent = ngCount;

    let message;
    if (reason === 'collision') {
        message = `NG! ぶつかりました。現在のNG回数: ${ngCount} / ${MAX_NG}`;
    } else if (reason === 'max_ng') {
        message = `ゲーム終了！ 最大NG回数 (${MAX_NG}回) に達しました。最終スコア: ${score}`;
    }

    messageArea.classList.remove('hidden');
    gameStatusMessage.textContent = message;

    if (ngCount < MAX_NG) {
        startButton.textContent = '▶️ リトライ';
        // リトライのために初期状態に戻す (スコアとNG回数は保持)
        dx = GRID_SIZE; dy = 0; 
        snake = [
            { x: Math.floor(TILE_COUNT / 2) * GRID_SIZE, y: Math.floor(TILE_COUNT / 2) * GRID_SIZE },
            { x: (Math.floor(TILE_COUNT / 2) - 1) * GRID_SIZE, y: Math.floor(TILE_COUNT / 2) * GRID_SIZE }
        ];
        placeFood();
        drawGame(); 
    } else {
        startButton.textContent = '最初からやり直す';
    }
}


// --- メインゲームループ ---
function mainLoop() {
    if (!isGameRunning) return; 

    if (checkCollision()) {
        if (ngCount + 1 >= MAX_NG) {
            gameOver('max_ng');
        } else {
            gameOver('collision');
        }
        return;
    }

    advanceSnake();
    drawGame();
}

// --- ゲーム開始/再開 ---
function startGame() {
    if (isGameRunning) return;

    if (ngCount >= MAX_NG) {
        initGame(); // MAX NGなら完全リセット
    } else if (ngCount > 0) {
        // NGカウントが1～9の場合のリトライ
        messageArea.classList.add('hidden');
    }
    
    // 初回またはリセット後の開始処理
    gameSpeed = parseInt(speedSelect.value);
    isGameRunning = true;
    clearInterval(gameLoopInterval); 
    gameLoopInterval = setInterval(mainLoop, gameSpeed);
    startButton.textContent = 'プレイ中...';
}

// --- イベントリスナー (方向転換) ---
document.addEventListener('keydown', changeDirection);

function changeDirection(event) {
    const LEFT_KEY = 37;
    const UP_KEY = 38;
    const RIGHT_KEY = 39;
    const DOWN_KEY = 40;

    if (!isGameRunning || changingDirection) return;

    changingDirection = true;

    const keyPressed = event.keyCode;
    const goingUp = dy === -GRID_SIZE;
    const goingDown = dy === GRID_SIZE;
    const goingRight = dx === GRID_SIZE;
    const goingLeft = dx === -GRID_SIZE;

    // 逆方向への即時変更は禁止
    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -GRID_SIZE; dy = 0;
    } else if (keyPressed === UP_KEY && !goingDown) {
        dx = 0; dy = -GRID_SIZE;
    } else if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = GRID_SIZE; dy = 0;
    } else if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0; dy = GRID_SIZE;
    }
}

// スタートボタンのクリックイベント
startButton.addEventListener('click', startGame);


// --- ゲーム開始 ---
initGame();