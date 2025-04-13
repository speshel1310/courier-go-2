class Game {
    constructor() {
        this.score = 0;
        this.timeLeft = 60; // 60 seconds game time
        this.isJumping = false;
        this.currentLane = 1; // 0: left, 1: center, 2: right
        this.obstacles = [];
        this.coins = [];
        this.gameInterval = null;
        this.timerInterval = null;
        this.isGameOver = false;
        this.isMuted = true; // Start with sound muted
        this.playerName = '';
        this.playerPhone = '';
        this.bestScore = 0;
        this.playerResults = [];
        this.allResults = [];

        // Initialize audio
        this.initializeAudio();
        
        // Define obstacle types
        this.obstacleTypes = [
            { emoji: '🐕', name: 'собака' },
            { emoji: '🚐', name: 'газель' },
            { emoji: '🚌', name: 'автобус' }
        ];

        // Save lane positions
        this.lanePositions = [16.66, 50, 83.33];

        // Initialize game elements
        this.initializeElements();
        
        // Auth form handling
        this.setupAuthForm();
        
        // Leaderboard handling
        this.setupLeaderboard();
    }

    initializeAudio() {
        try {
            this.audio = {
                background: new Audio('audio/background.mp3'),
                coin: new Audio('audio/coin.mp3'),
                collision: new Audio('audio/collision.mp3'),
                jump: new Audio('audio/jump.mp3'),
                gameOver: new Audio('audio/gameover.mp3'),
                win: new Audio('audio/win.mp3')
            };

            // Configure background music
            if (this.audio.background) {
                this.audio.background.loop = true;
                this.audio.background.volume = 0; // Start with volume 0
            }

            // Configure sound effects
            Object.values(this.audio).forEach(sound => {
                if (sound && sound !== this.audio.background) {
                    sound.volume = 0; // Start with volume 0
                }
            });
        } catch (error) {
            console.error('Error initializing audio:', error);
        }
    }

    initializeElements() {
        // Find main game elements
        this.player = document.getElementById('player');
        this.gameArea = document.querySelector('.game-area');
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.gameOverScreen = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        this.resultMessageElement = document.querySelector('.result-message');
        this.bestScoreElement = document.getElementById('best-score');
        this.gameContainer = document.getElementById('game-container');
        this.authScreen = document.getElementById('auth-screen');

        // Check if elements are found
        if (!this.player) console.error("Player element not found!");
        if (!this.gameArea) console.error("Game area element not found!");
        if (!this.scoreElement) console.error("Score element not found!");
        if (!this.timerElement) console.error("Timer element not found!");
        if (!this.gameOverScreen) console.error("Game Over screen not found!");

        // Hide screens at the beginning
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');

        // Add sound button to game area
        this.initializeSoundButton();

        // Set event listeners
        this.setupEventListeners();
        
        // Set initial player position
        this.updatePlayerPosition();
    }

    initializeSoundButton() {
        try {
            const soundButton = document.createElement('button');
            soundButton.id = 'sound-toggle';
            soundButton.innerHTML = '🔇'; // Start with mute icon
            soundButton.className = 'sound-button';

            if (this.gameArea) {
                this.gameArea.appendChild(soundButton);
                soundButton.addEventListener('click', () => {
                    this.toggleSound();
                    soundButton.innerHTML = this.isMuted ? '🔇' : '🔊';
                });
            }
        } catch (error) {
            console.error('Error initializing sound button:', error);
        }
    }

    setupAuthForm() {
        const authForm = document.getElementById('auth-form');
        const playerNameInput = document.getElementById('player-name');
        const playerPhoneInput = document.getElementById('player-phone');
        
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.playerName = playerNameInput.value.trim();
                this.playerPhone = playerPhoneInput.value.trim();
                
                // Load player's previous results
                this.loadPlayerResults();
                
                // Start game
                this.authScreen.classList.add('hidden');
                this.gameContainer.classList.remove('hidden');
                this.startGame();
            });
        }
        
        // Handle change player button
        const changePlayerBtn = document.getElementById('change-player');
        if (changePlayerBtn) {
            changePlayerBtn.addEventListener('click', () => {
                this.gameOverScreen.classList.add('hidden');
                this.gameContainer.classList.add('hidden');
                this.authScreen.classList.remove('hidden');
                
                // Reset form fields for new player
                if (playerNameInput) playerNameInput.value = '';
                if (playerPhoneInput) playerPhoneInput.value = '';
            });
        }
    }

    setupLeaderboard() {
        const leaderboardBtn = document.getElementById('leaderboard-btn');
        const leaderboard = document.getElementById('leaderboard');
        const closeLeaderboardBtn = document.getElementById('close-leaderboard');
        
        if (leaderboardBtn && leaderboard) {
            leaderboardBtn.addEventListener('click', () => {
                this.updateLeaderboard();
                leaderboard.classList.remove('hidden');
            });
        }
        
        if (closeLeaderboardBtn && leaderboard) {
            closeLeaderboardBtn.addEventListener('click', () => {
                leaderboard.classList.add('hidden');
            });
        }
    }

    updateLeaderboard() {
        const leaderboardList = document.getElementById('leaderboard-list');
        if (!leaderboardList) return;
        
        // Clear current leaderboard
        leaderboardList.innerHTML = '';
        
        // Load all results and sort by score
        this.loadAllResults();
        
        // Get top 5 unique players
        const topPlayers = this.getTopPlayers(5);
        
        // Add players to leaderboard
        topPlayers.forEach((player, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            const rank = document.createElement('div');
            rank.className = 'leaderboard-rank';
            rank.textContent = `${index + 1}.`;
            
            const name = document.createElement('div');
            name.className = 'leaderboard-name';
            name.textContent = player.name;
            
            const score = document.createElement('div');
            score.className = 'leaderboard-score';
            score.textContent = player.score;
            
            item.appendChild(rank);
            item.appendChild(name);
            item.appendChild(score);
            
            leaderboardList.appendChild(item);
        });
    }

    getTopPlayers(count) {
        // Get unique players with their best scores
        const playersMap = new Map();
        
        this.allResults.forEach(result => {
            const key = `${result.name}-${result.phone}`;
            if (!playersMap.has(key) || playersMap.get(key).score < result.score) {
                playersMap.set(key, {
                    name: result.name,
                    phone: result.phone,
                    score: result.score
                });
            }
        });
        
        // Convert to array and sort
        const uniquePlayers = Array.from(playersMap.values());
        uniquePlayers.sort((a, b) => b.score - a.score);
        
        // Return top N players
        return uniquePlayers.slice(0, count);
    }

    loadPlayerResults() {
        try {
            // In a real implementation, this would read from local storage or a file
            // For demo purposes, we'll use localStorage
            const storedResults = localStorage.getItem('gameResults');
            if (storedResults) {
                this.allResults = JSON.parse(storedResults);
                
                // Filter current player's results
                this.playerResults = this.allResults.filter(result => 
                    result.name === this.playerName && 
                    result.phone === this.playerPhone
                );
                
                // Get player's best score
                if (this.playerResults.length > 0) {
                    this.bestScore = Math.max(...this.playerResults.map(r => r.score));
                }
            }
        } catch (error) {
            console.error('Error loading player results:', error);
            this.playerResults = [];
            this.bestScore = 0;
        }
    }

    loadAllResults() {
        try {
            // In a real implementation, this would read from a file
            // For demo purposes, we'll use localStorage
            const storedResults = localStorage.getItem('gameResults');
            if (storedResults) {
                this.allResults = JSON.parse(storedResults);
            } else {
                this.allResults = [];
            }
        } catch (error) {
            console.error('Error loading all results:', error);
            this.allResults = [];
        }
    }

    saveResult() {
        try {
            // Create new result
            const result = {
                name: this.playerName,
                phone: this.playerPhone,
                date: new Date().toISOString().split('T')[0],
                score: this.score
            };
            
            // Add to player results
            this.playerResults.push(result);
            
            // Update best score
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
            }
            
            // Add to all results
            this.loadAllResults();
            this.allResults.push(result);
            
            // Save to localStorage (for demo)
            localStorage.setItem('gameResults', JSON.stringify(this.allResults));
            
            // Update message
            if (this.resultMessageElement) {
                if (this.score > this.bestScore && this.playerResults.length > 1) {
                    this.resultMessageElement.textContent = 'Новый рекорд!';
                } else if (this.playerResults.length > 1) {
                    this.resultMessageElement.textContent = 
                        `Ваш лучший результат: ${this.bestScore}. Попробуй ещё!`;
                }
            }
            
            // Update best score display
            if (this.bestScoreElement) {
                this.bestScoreElement.textContent = this.bestScore;
            }
        } catch (error) {
            console.error('Error saving results:', error);
        }
    }

    clearGame() {
        // Hide screens
        if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');

        // Remove existing obstacles and coins from DOM
        const existingObstacles = document.querySelectorAll('.obstacle');
        const existingCoins = document.querySelectorAll('.coin');
        existingObstacles.forEach(obstacle => obstacle.remove());
        existingCoins.forEach(coin => coin.remove());

        // Clear arrays
        this.obstacles = [];
        this.coins = [];
        this.isGameOver = false;
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Touch controls (only left/right swipes)
        let touchStartX = 0;
        let touchStartY = 0;

        if (this.gameArea) {
            this.gameArea.addEventListener('touchstart', (e) => {
                // Ignore tap on sound button
                if (e.target.closest('.sound-button')) return;
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                e.preventDefault();
            }, { passive: false });

            this.gameArea.addEventListener('touchmove', (e) => {
                if (this.isGameOver || e.touches.length === 0) return;
                // Ignore if movement started from a button
                if (e.target.closest('.sound-button')) return;

                const touchEndX = e.touches[0].clientX;
                const touchEndY = e.touches[0].clientY;
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;

                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    const swipeThreshold = 50;
                    if (deltaX > swipeThreshold) {
                        this.moveRight();
                        touchStartX = touchEndX;
                        touchStartY = touchEndY;
                    } else if (deltaX < -swipeThreshold) {
                        this.moveLeft();
                        touchStartX = touchEndX;
                        touchStartY = touchEndY;
                    }
                }
                e.preventDefault();
            }, { passive: false });
        }

        // Button controls (only left/right)
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');

        if (btnLeft) {
            btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); if (!this.isGameOver) this.moveLeft(); });
            btnLeft.addEventListener('click', () => { if (!this.isGameOver) this.moveLeft(); });
        }
        if (btnRight) {
            btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); if (!this.isGameOver) this.moveRight(); });
            btnRight.addEventListener('click', () => { if (!this.isGameOver) this.moveRight(); });
        }

        // Restart buttons
        const restartButtons = [
            document.getElementById('restart'),
            document.getElementById('play-again')
        ];

        restartButtons.forEach(button => {
            if (button) {
                button.addEventListener('click', () => {
                    console.log('Restart button clicked');
                    this.restartGame();
                });
            }
        });
    }

    handleKeyPress(e) {
        if (this.isGameOver) return;
        switch (e.key) {
            case 'ArrowLeft': this.moveLeft(); break;
            case 'ArrowRight': this.moveRight(); break;
            // Add M for mute/unmute
            case 'm':
            case 'M':
            case 'ь': // Russian M
                this.toggleSound();
                // Update icon on button if it exists
                const soundButton = document.getElementById('sound-toggle');
                if (soundButton) {
                     soundButton.innerHTML = this.isMuted ? '🔇' : '🔊';
                }
                break;
        }
    }

    moveLeft() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.updatePlayerPosition();
        }
    }

    moveRight() {
        if (this.currentLane < this.lanePositions.length - 1) {
            this.currentLane++;
            this.updatePlayerPosition();
        }
    }

    updatePlayerPosition() {
        if (this.player) {
            this.player.style.left = `${this.lanePositions[this.currentLane]}%`;
        }
    }

    createObstacle() {
        const obstacle = document.createElement('div');
        obstacle.className = 'obstacle';
        const randomType = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
        obstacle.innerHTML = randomType.emoji;
        obstacle.title = randomType.name;
        const lane = Math.floor(Math.random() * this.lanePositions.length);
        obstacle.style.left = `${this.lanePositions[lane]}%`;
        obstacle.style.top = '0';
        if (this.gameArea) {
            this.gameArea.appendChild(obstacle);
            this.obstacles.push({ element: obstacle, lane: lane, type: randomType.name });
        }
    }

    createCoin() {
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.innerHTML = '🥙';
        const lane = Math.floor(Math.random() * this.lanePositions.length);
        coin.style.left = `${this.lanePositions[lane]}%`;
        coin.style.top = '0';
        if (this.gameArea) {
            this.gameArea.appendChild(coin);
            this.coins.push({ element: coin, lane: lane });
        }
    }

    moveObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const currentTop = parseInt(obstacle.element.style.top || '0');
            const newTop = currentTop + 5;
            obstacle.element.style.top = `${newTop}px`;
            const removalThreshold = this.gameArea ? this.gameArea.offsetHeight : 400;
            if (newTop > removalThreshold) {
                obstacle.element.remove();
                this.obstacles.splice(i, 1);
            } else if (this.checkCollision(obstacle)) {
                this.handleCollision(obstacle, i);
            }
        }
    }

    moveCoins() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const currentTop = parseInt(coin.element.style.top || '0');
            const newTop = currentTop + 5;
            coin.element.style.top = `${newTop}px`;
            const removalThreshold = this.gameArea ? this.gameArea.offsetHeight : 400;
            if (newTop > removalThreshold) {
                coin.element.remove();
                this.coins.splice(i, 1);
            } else if (this.checkCoinCollision(coin)) {
                this.handleCoinCollection(coin, i);
            }
        }
    }

    checkCollision(obstacle) {
        if (!this.player) return false;
        const playerRect = this.player.getBoundingClientRect();
        const obstacleRect = obstacle.element.getBoundingClientRect();
        return obstacle.lane === this.currentLane &&
               obstacleRect.bottom > playerRect.top &&
               obstacleRect.top < playerRect.bottom;
    }

    checkCoinCollision(coin) {
        if (!this.player) return false;
        const playerRect = this.player.getBoundingClientRect();
        const coinRect = coin.element.getBoundingClientRect();
        return coin.lane === this.currentLane &&
               coinRect.bottom > playerRect.top &&
               coinRect.top < playerRect.bottom;
    }

    handleCollision(obstacle, index) {
        // Show collision message
        if (this.gameArea) {
            const message = document.createElement('div');
            message.className = 'collision-message';
            message.style.position = 'absolute';
            message.style.left = obstacle.element.style.left;
            message.style.top = obstacle.element.style.top;
            message.textContent = `Ай! ${obstacle.type}!`;
            this.gameArea.appendChild(message);
            setTimeout(() => message.remove(), 1000);
        }

        obstacle.element.remove();
        this.obstacles.splice(index, 1);
    }

    handleCoinCollection(coin, index) {
        this.score += 10;
        if (this.scoreElement) {
            this.scoreElement.textContent = this.score;
        }
        
        if (!this.isMuted && this.audio.coin) {
            this.audio.coin.currentTime = 0;
            this.audio.coin.play().catch(e => console.warn('Error playing coin sound:', e));
        }
        
        coin.element.remove();
        this.coins.splice(index, 1);
    }

    updateTimer() {
        this.timeLeft--;
        if (this.timerElement) {
            this.timerElement.textContent = this.timeLeft;
        }
        
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    endGame() {
        this.isGameOver = true;
        clearInterval(this.gameInterval);
        clearInterval(this.timerInterval);
        this.stopSound(); // Stop background music
        
        if (this.finalScoreElement) this.finalScoreElement.textContent = this.score;
        if (this.bestScoreElement) this.bestScoreElement.textContent = this.bestScore;
        
        // Save the result
        this.saveResult();
        
        if (this.gameOverScreen) this.gameOverScreen.classList.remove('hidden');
    }

    startGame() {
        // Reset game state
        this.score = 0;
        this.timeLeft = 60;
        this.isGameOver = false;
        
        // Update UI
        if (this.scoreElement) {
            this.scoreElement.textContent = '0';
        }
        if (this.timerElement) {
            this.timerElement.textContent = '60';
        }
        
        // Start playing background music
        this.playSound();

        // Game speed and probabilities
        const gameSpeed = 20;
        const obstacleProbability = 0.02;
        const coinProbability = 0.03;

        // Start game loop
        this.gameInterval = setInterval(() => {
            if (this.isGameOver) return;
            if (Math.random() < obstacleProbability) this.createObstacle();
            if (Math.random() < coinProbability) this.createCoin();
            this.moveObstacles();
            this.moveCoins();
        }, gameSpeed);
        
        // Start timer
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    restartGame() {
        try {
            console.log('Restarting game...');
            
            // Clear intervals
            if (this.gameInterval) {
                clearInterval(this.gameInterval);
            }
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }

            // Clear game field
            this.clearGame();

            // Hide Game Over screen
            if (this.gameOverScreen) {
                this.gameOverScreen.classList.add('hidden');
            }

            // Update player position
            this.updatePlayerPosition();

            // Reset audio
            this.stopSound();
            if (this.audio.background) {
                this.audio.background.currentTime = 0;
            }

            // Start the game again
            this.startGame();
        } catch (error) {
            console.error('Error in restartGame:', error);
        }
    }

    toggleSound() {
        this.isMuted = !this.isMuted;
        
        // Set volume for background music
        if (this.audio.background) {
            this.audio.background.volume = this.isMuted ? 0 : 0.5;
        }
        
        // Set volume for sound effects
        Object.values(this.audio).forEach(sound => {
            if (sound && sound !== this.audio.background) {
                sound.volume = this.isMuted ? 0 : 0.3;
            }
        });

        // If sound is on and game is running, start background music
        if (!this.isMuted && !this.isGameOver && this.audio.background) {
            this.audio.background.play().catch(error => {
                console.error('Error playing sound:', error);
            });
        }
    }

    // Play background music only
    playSound() {
        if (!this.isMuted && this.audio.background && this.audio.background.paused) {
            this.audio.background.play().catch(e => console.warn(`Error playing background sound:`, e));
        }
    }

    // Stop background music only
    stopSound() {
         if (this.audio.background) {
            this.audio.background.pause();
         }
    }
}

// Start game when page loads
window.addEventListener('load', () => {
    new Game();
});
