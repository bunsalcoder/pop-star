import { GameAPI } from './api.js';

const gameAPI = new GameAPI(); // Move to top-level scope

// Global variables for game state
var table;//游戏桌面
var squareWidth = 50;//每个方块的宽度
var boardWidth = 10;//有多少行和列的方块
var squareSet = [];//当前桌面上的方块集合（二维数组，最左下角是0，0位置）
var timer = null;//闪烁定时器
var choose = [];//被选中的方块
var flag = true;//对点击事件加锁，消除过程中不允许有其他移入和点击操作
var tempSquare = null;//消除过程中如果输入移入其他方块，进行记录
var baseScore = 5;//基础分数
var stepScore = 10;//一次每多消除一个额外增加的分数
var totalScore = 0;//当前总分数
var targetScore = 2000;//目标分数
var currentLevel = 1;
var levelScoreMap = [1500, 3000, 6000, 9000, 12000, 15000, 18000, 21000, 24000, 27000];
var levelCleared = false; // Track if current level has been cleared

// Function to initialize game with API data
async function initializeGameWithData(starLayout = null, forceNewLevel = false) {
  // Reset level cleared flag when starting a new level (unless loading from API)
  if (!starLayout) {
    resetLevelCleared();
  }
  
  // If no starLayout provided, try to fetch from API
  if (!starLayout && !forceNewLevel) {
    try {
      const response = await gameAPI.getGameData();
      console.log('Loaded game data response:', response);
      
      // Handle nested response structure
      let data = response;
      if (response && response.data && response.data.data) {
        data = response.data.data;
      }
      
      console.log('Processed game data:', data);
      
      // Update game state with API data
      if (data.score !== undefined) {
        totalScore = data.score;
        console.log('Updated totalScore to:', totalScore);
      }
      if (data.level !== undefined) {
        currentLevel = data.level;
        console.log('Updated currentLevel to:', currentLevel);
      }
      
      // Check if level has been cleared
      if (data.levelCleared !== undefined) {
        levelCleared = data.levelCleared;
        console.log('Updated levelCleared to:', levelCleared);
      } else {
        // If no levelCleared data, assume level is not cleared
        levelCleared = false;
      }
      
      // Use the star layout from API
      if (data.starLayout) {
        starLayout = data.starLayout;
        console.log('Using starLayout from API:', starLayout);
      }
    } catch (err) {
      console.error('Failed to load game data:', err);
      // Continue with null starLayout (will generate random)
    }
  }
  const banner = document.getElementById("levelClearBanner");

  if (banner) {
    banner.classList.remove("shown");
    banner.style.opacity = 0;
    banner.style.top = "40%";
    banner.style.left = "50%";
    banner.style.right = "auto";
    banner.style.transform = "translate(-50%, -50%) scale(1)";
    
    // Show banner if score is above target (regardless of levelCleared flag)
    if (totalScore >= getTargetScore()) {
      console.log('Score above target - showing banner - totalScore:', totalScore, 'targetScore:', getTargetScore(), 'levelCleared:', levelCleared);
      if (!levelCleared) {
        levelCleared = true;
        console.log('Setting levelCleared to true');
        // Save the levelCleared state to API
        setTimeout(() => {
          saveGameDataOnLevelComplete();
        }, 100);
      }
      showLevelClearedBanner();
    }
  }

  table = document.getElementById("pop_star");

  const screenHeight = window.innerHeight;
  const screenWidth = window.innerWidth;
  const topBarsHeight = 100;
  const usableHeight = screenHeight - topBarsHeight;

  const boardSize = Math.min(screenWidth, usableHeight);

  table.style.width = boardSize + "px";
  table.style.height = boardSize + "px";

  squareWidth = boardSize / boardWidth;

  // document.getElementById("targetScore").innerHTML = "Target Score：" + targetScore;
  document.getElementById("nowScore").innerHTML = "Current Score：" + totalScore;

  // ********************************************* //
  document.getElementById("targetScore").innerHTML = "Target Score: " + getTargetScore();
  document.getElementById("levelInfo").innerHTML = "Level: " + currentLevel;
  // ********************************************* //
  
  console.log('Initializing game with - Score:', totalScore, 'Level:', currentLevel, 'LevelCleared:', levelCleared);

  table.innerHTML = "";
  squareSet = [];

  if (starLayout) {
    for (var i = 0; i < boardWidth; i++) {
      squareSet[i] = new Array();
      for (var j = 0; j < boardWidth; j++) {
        if (starLayout[i][j] !== null) {
          var square = createSquare(starLayout[i][j], i, j);
          square.onmouseover = function () {
            mouseOver(this);
          };
          square.onclick = async function () {
            if (!flag || choose.length === 0) {
              return;
            }
            flag = false;
            tempSquare = null;

            var score = 0;
            for (var k = 0; k < choose.length; k++) {
              score += baseScore + k * stepScore;
            }
            totalScore += score;
            document.getElementById("nowScore").innerHTML = "Current Score：" + totalScore;

            // Calculate highScore and highLevel
            let highScore = Number(localStorage.getItem('highScore')) || 0;
            let highLevel = Number(localStorage.getItem('highLevel')) || 1;
            if (totalScore > highScore) {
              highScore = totalScore;
              localStorage.setItem('highScore', highScore);
            }
            if (currentLevel > highLevel) {
              highLevel = currentLevel;
              localStorage.setItem('highLevel', highLevel);
            }

            // 🔥 Show banner if user reaches the goal for the first time
            if (totalScore >= getTargetScore() && !levelCleared) {
              showLevelClearedBanner();
              levelCleared = true;
            }

            // Animate and remove blocks one-by-one
            for (var k = 0; k < choose.length; k++) {
              (function (index) {
                const sq = choose[index];
                setTimeout(() => {
                  createBreakEffect(sq);
                  setTimeout(() => {
                    squareSet[sq.row][sq.col] = null;
                    table.removeChild(sq);

                    if (index === choose.length - 1) {
                      setTimeout(function () {
                        move(); // 💡 Drop immediately after pop

                        setTimeout(async function () {
                          // Save game data after board has been updated
                          try {
                            const currentStarLayout = squareSet.map(row => row.map(sq => sq ? sq.num : null));
                            const saveData = {
                              highLevel,
                              highScore,
                              level: currentLevel,
                              score: totalScore,
                              starLayout: currentStarLayout
                            };
                            saveData.levelCleared = levelCleared;
                            console.log('Saving game data after pop:', saveData);
                            await gameAPI.saveGameData(saveData);
                            console.log('Game data saved successfully after pop');
                          } catch (e) {
                            console.error('Failed to save game data after pop:', e);
                          }

                          var finished = isFinish();
                          console.log('Game finished check - finished:', finished, 'totalScore:', totalScore, 'targetScore:', getTargetScore());
                          if (finished) {
                            console.log('Game is finished, checking score...');
                            if (totalScore >= getTargetScore()) {
                              console.log('Level completed! Moving to next level');
                              showAlert("Level " + currentLevel + " cleared!");
                              currentLevel++;
                              // Save game data when level is completed
                              await saveGameDataOnLevelComplete();
                              setTimeout(async () => {
                                await initializeGameWithData(null, true);
                                await saveNewLevelLayout();
                              }, 1000);
                            } else {
                              console.log('Game over - score not high enough');
                              gameOverAlert("Game over!");
                              currentLevel = 1;
                              totalScore = 0;
                              // Save game data when game over
                              await saveGameDataOnGameOver();
                              // setTimeout(init, 1000);
                            }
                          } else {
                            console.log('Game can continue, resetting for next move');
                            choose = [];
                            flag = true;
                            mouseOver(tempSquare);
                          }
                        }, 300);
                      }, 200);
                    }
                  }, 100); // remove DOM after effect
                }, index * 150); // stagger each pop
              })(k);
            }
          };
          squareSet[i][j] = square;
          table.appendChild(square);
        } else {
          squareSet[i][j] = null;
        }
      }
    }
  } else {
    for (var i = 0; i < boardWidth; i++) {
      squareSet[i] = new Array();
      for (var j = 0; j < boardWidth; j++) {
        var square = createSquare(Math.floor(Math.random() * 5), i, j);
        square.onmouseover = function () {
          mouseOver(this);
        };
        square.onclick = async function () {
          if (!flag || choose.length === 0) {
            return;
          }
          flag = false;
          tempSquare = null;

          var score = 0;
          for (var k = 0; k < choose.length; k++) {
            score += baseScore + k * stepScore;
          }
          totalScore += score;
          document.getElementById("nowScore").innerHTML = "Current Score：" + totalScore;

          // Calculate highScore and highLevel
          let highScore = Number(localStorage.getItem('highScore')) || 0;
          let highLevel = Number(localStorage.getItem('highLevel')) || 1;
          if (totalScore > highScore) {
            highScore = totalScore;
            localStorage.setItem('highScore', highScore);
          }
          if (currentLevel > highLevel) {
            highLevel = currentLevel;
            localStorage.setItem('highLevel', highLevel);
          }

          // 🔥 Show banner if user reaches the goal for the first time
          if (totalScore >= getTargetScore() && !levelCleared) {
            showLevelClearedBanner();
            levelCleared = true;
          }

          // Animate and remove blocks one-by-one
          for (var k = 0; k < choose.length; k++) {
            (function (index) {
              const sq = choose[index];
              setTimeout(() => {
                createBreakEffect(sq);
                setTimeout(() => {
                  squareSet[sq.row][sq.col] = null;
                  table.removeChild(sq);

                  if (index === choose.length - 1) {
                    setTimeout(function () {
                      move(); // 💡 Drop immediately after pop

                      setTimeout(async function () {
                        // Save game data after board has been updated
                        try {
                          const currentStarLayout = squareSet.map(row => row.map(sq => sq ? sq.num : null));
                          const saveData = {
                            highLevel,
                            highScore,
                            level: currentLevel,
                            score: totalScore,
                            starLayout: currentStarLayout
                          };
                          saveData.levelCleared = levelCleared;
                          console.log('Saving game data after pop:', saveData);
                          await gameAPI.saveGameData(saveData);
                          console.log('Game data saved successfully after pop');
                        } catch (e) {
                          console.error('Failed to save game data after pop:', e);
                        }

                        var finished = isFinish();
                        console.log('Game finished check - finished:', finished, 'totalScore:', totalScore, 'targetScore:', getTargetScore());
                        if (finished) {
                          console.log('Game is finished, checking score...');
                          if (totalScore >= getTargetScore()) {
                            console.log('Level completed! Moving to next level');
                            showAlert("Level " + currentLevel + " cleared!");
                            currentLevel++;
                            // Save game data when level is completed
                            await saveGameDataOnLevelComplete();
                            setTimeout(async () => {
                              await initializeGameWithData(null, true);
                              await saveNewLevelLayout();
                            }, 1000);
                          } else {
                            console.log('Game over - score not high enough');
                            gameOverAlert("Game over!");
                            currentLevel = 1;
                            totalScore = 0;
                            // Save game data when game over
                            await saveGameDataOnGameOver();
                            // setTimeout(init, 1000);
                          }
                        } else {
                          console.log('Game can continue, resetting for next move');
                          choose = [];
                          flag = true;
                          mouseOver(tempSquare);
                        }
                      }, 300);
                    }, 200);
                  }
                }, 100); // remove DOM after effect
              }, index * 150); // stagger each pop
            })(k);
          }
        };
        squareSet[i][j] = square;
        table.appendChild(square);
      }
    }
  }
  refresh();
  flag = true;
  
  // Check if level should be automatically completed
  setTimeout(() => {
    checkAndTriggerLevelCompletion();
    
    // Also check if game is finished and should move to next level
    if (isFinish() && totalScore >= getTargetScore() && levelCleared) {
      console.log('Game is finished and level is cleared - should move to next level');
      // Don't auto-advance here, let user see the banner first
      // The next click will trigger the level completion
    }
    
    // If game is finished and score is above target but level not marked as cleared,
    // automatically mark it as cleared and show banner
    if (isFinish() && totalScore >= getTargetScore() && !levelCleared) {
      console.log('Game is finished with score above target - marking level as cleared');
      levelCleared = true;
      showLevelClearedBanner();
      // Save the cleared state
      saveGameDataOnLevelComplete();
    }
    
    // Set up periodic check for level completion
    setInterval(() => {
      checkForLevelCompletion();
    }, 2000);
  }, 500);
}

function getTargetScore() {
    if (currentLevel <= levelScoreMap.length) {
        return levelScoreMap[currentLevel - 1];
    } else {
        let lastDefined = levelScoreMap[levelScoreMap.length - 1];
        let extraLevel = currentLevel - levelScoreMap.length;
        return Math.floor(lastDefined + extraLevel * 6000 + extraLevel ** 2 * 500);
    }
}

// Function to reset game with fresh layout
async function resetGame() {
  console.log('Resetting game with fresh layout');
  totalScore = 0;
  currentLevel = 1;
  levelCleared = false;
  
  // Initialize with fresh random layout
  await initializeGameWithData(null, true);
  
  // Save the fresh layout to API
  try {
    const freshStarLayout = squareSet.map(row => row.map(sq => sq ? sq.num : null));
    let highScore = Number(localStorage.getItem('highScore')) || 0;
    let highLevel = Number(localStorage.getItem('highLevel')) || 1;
    
    await gameAPI.saveGameData({
      highLevel,
      highScore,
      level: currentLevel,
      score: totalScore,
      starLayout: freshStarLayout,
      levelCleared: false
    });
    console.log('Fresh game layout saved to API');
  } catch (e) {
    console.error('Failed to save fresh game layout:', e);
  }
}

// Function to save new level star layout after progression
async function saveNewLevelLayout() {
  try {
    const newStarLayout = squareSet.map(row => row.map(sq => sq ? sq.num : null));
    let highScore = Number(localStorage.getItem('highScore')) || 0;
    let highLevel = Number(localStorage.getItem('highLevel')) || 1;
    
    if (totalScore > highScore) {
      highScore = totalScore;
      localStorage.setItem('highScore', highScore);
    }
    if (currentLevel > highLevel) {
      highLevel = currentLevel;
      localStorage.setItem('highLevel', highLevel);
    }

    await gameAPI.saveGameData({
      highLevel,
      highScore,
      level: currentLevel,
      score: totalScore,
      starLayout: newStarLayout,
      levelCleared: false // Reset for new level
    });
    console.log('New level star layout saved to API');
  } catch (e) {
    console.error('Failed to save new level star layout:', e);
  }
}

// Function to manually advance to next level
function advanceToNextLevel() {
  if (totalScore >= getTargetScore() && levelCleared) {
    console.log('Manually advancing to next level');
    showAlert("Level " + currentLevel + " cleared!");
    currentLevel++;
    // Save game data when level is completed
    saveGameDataOnLevelComplete();
    
    // Initialize new level with fresh layout and save it
    setTimeout(async () => {
      await initializeGameWithData(null, true);
      await saveNewLevelLayout();
    }, 1000);
  }
}

// Function to manually check for level completion
function checkForLevelCompletion() {
  console.log('Checking for level completion - totalScore:', totalScore, 'targetScore:', getTargetScore(), 'isFinish:', isFinish(), 'levelCleared:', levelCleared);
  
  if (totalScore >= getTargetScore() && !levelCleared) {
    console.log('Level completion conditions met - showing banner');
    levelCleared = true;
    showLevelClearedBanner();
    saveGameDataOnLevelComplete();
  } else if (totalScore >= getTargetScore() && levelCleared) {
    console.log('Score above target and level already cleared - banner should be visible');
    // Ensure banner is visible
    const banner = document.getElementById("levelClearBanner");
    if (banner && banner.style.opacity === "0") {
      console.log('Re-showing banner for cleared level');
      showLevelClearedBanner();
    }
  }
  
  // Also check if game is finished and should move to next level
  if (isFinish() && totalScore >= getTargetScore() && levelCleared) {
    console.log('Game is finished and level is cleared - ready for next level');
  }
}

// Function to check and trigger level completion automatically
function checkAndTriggerLevelCompletion() {
  if (isFinish() && totalScore >= getTargetScore() && !levelCleared) {
    console.log('Auto-triggering level completion');
    showLevelClearedBanner();
    levelCleared = true;
    
    // Auto-save the current state
    saveGameDataOnLevelComplete();
  }
}

// Function to start a new level with fresh random layout
function startNewLevel() {
  console.log('Starting new level with fresh random layout');
  initializeGameWithData(null, true);
}

// Function to reset level cleared flag for new level
function resetLevelCleared() {
  levelCleared = false;
  console.log('Reset levelCleared flag for new level');
}

// Function to save game data when level is completed
async function saveGameDataOnLevelComplete() {
    try {
        const starLayout = squareSet.map(row => row.map(sq => sq ? sq.num : null));
        let highScore = Number(localStorage.getItem('highScore')) || 0;
        let highLevel = Number(localStorage.getItem('highLevel')) || 1;
        
        if (totalScore > highScore) {
            highScore = totalScore;
            localStorage.setItem('highScore', highScore);
        }
        if (currentLevel > highLevel) {
            highLevel = currentLevel;
            localStorage.setItem('highLevel', highLevel);
        }

        await gameAPI.saveGameData({
            highLevel,
            highScore,
            level: currentLevel,
            score: totalScore,
            starLayout,
            levelCleared: levelCleared
        });
        console.log('Game data saved on level completion');
    } catch (e) {
        console.error('Failed to save game data on level completion:', e);
    }
}

// Function to save game data when game over
async function saveGameDataOnGameOver() {
    try {
        const starLayout = squareSet.map(row => row.map(sq => sq ? sq.num : null));
        let highScore = Number(localStorage.getItem('highScore')) || 0;
        let highLevel = Number(localStorage.getItem('highLevel')) || 1;
        
        if (totalScore > highScore) {
            highScore = totalScore;
            localStorage.setItem('highScore', highScore);
        }
        if (currentLevel > highLevel) {
            highLevel = currentLevel;
            localStorage.setItem('highLevel', highLevel);
        }

        await gameAPI.saveGameData({
            highLevel,
            highScore,
            level: currentLevel,
            score: totalScore,
            starLayout,
            levelCleared: levelCleared
        });
        console.log('Game data saved on game over');
    } catch (e) {
        console.error('Failed to save game data on game over:', e);
    }
}

function showLevelClearedBanner() {
    const banner = document.getElementById("levelClearBanner");
    banner.style.opacity = 1;
    banner.style.transform = "translate(0%, -50%) scale(1)";
    // banner.style.fontSize = "18px"

    // Add click handler to advance to next level
    banner.onclick = function() {
        if (totalScore >= getTargetScore() && levelCleared) {
            advanceToNextLevel();
        }
    };
    banner.style.cursor = "pointer";

    setTimeout(() => {
        banner.style.top = "10px";
        banner.style.left = "auto";
        banner.style.right = "10px";
        banner.style.transform = "scale(0.6)";
    }, 2000);
}

function createBreakEffect(square) {
    const numParticles = 6;
    const container = document.getElementById("pop_star");
    const squareRect = square.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const left = squareRect.left - containerRect.left;
    const bottom = containerRect.bottom - squareRect.bottom;

    for (let i = 0; i < numParticles; i++) {
        const frag = document.createElement("div");
        frag.className = "break-piece";
        const size = squareWidth / 4;
        frag.style.width = size + "px";
        frag.style.height = size + "px";
        frag.style.position = "absolute";
        frag.style.left = left + "px";
        frag.style.bottom = bottom + "px";
        frag.style.backgroundImage = square.style.backgroundImage;
        frag.style.backgroundSize = "cover";
        container.appendChild(frag);

        const angle = Math.random() * 2 * Math.PI;
        const radius = Math.random() * 30 + 10;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        frag.animate([
            { transform: "translate(0, 0) scale(1)", opacity: 1 },
            { transform: `translate(${x}px, ${y}px) scale(0.5)`, opacity: 0 }
        ], {
            duration: 400,
            easing: "ease-out"
        });

        setTimeout(() => container.removeChild(frag), 400);
    }
}

// ******************************************************** //
let alertActive = false;

function isFinish() {
    // Check if there are any stars left on the board
    let totalStars = 0;
    let linkedGroups = 0;
    
    for (var i = 0 ; i < squareSet.length ; i ++) {
        for (var j = 0 ; j < squareSet[i].length ; j ++) {
            if (squareSet[i][j] != null) {
                totalStars++;
                // There are still stars on the board, check if any can be linked
                var temp = [];
                checkLinked(squareSet[i][j], temp);
                if (temp.length > 1) {
                    linkedGroups++;
                    console.log('Found linked group of', temp.length, 'stars at position', i, j);
                }
            }
        }
    }
    
    console.log('isFinish check - totalStars:', totalStars, 'linkedGroups:', linkedGroups);
    
    if (totalStars === 0) {
        console.log('No stars left on board - game finished');
        return true;
    }
    
    if (linkedGroups === 0) {
        console.log('No linked groups found - game finished');
        return true;
    }
    
    console.log('Game can continue - found', linkedGroups, 'linked groups');
    return false;
}

function move() {
    // First, drop stars down (vertical movement)
    for (var i = 0; i < boardWidth; i++) {
        var pointer = 0;
        for (var j = 0; j < boardWidth; j++) {
            if (squareSet[j][i] != null) {
                if (j != pointer) {
                    squareSet[pointer][i] = squareSet[j][i];
                    squareSet[j][i].row = pointer;
                    squareSet[j][i] = null;
                }
                pointer++;
            }
        }
    }
    
    // Then, remove empty columns (horizontal movement)
    for (var i = squareSet[0].length - 1; i >= 0; i--) {
        var isEmptyColumn = true;
        for (var j = 0; j < boardWidth; j++) {
            if (squareSet[j][i] != null) {
                isEmptyColumn = false;
                break;
            }
        }
        if (isEmptyColumn) {
            // Remove the empty column
            for (var j = 0; j < boardWidth; j++) {
                squareSet[j].splice(i, 1);
            }
        }
    }
    
    refresh();
    
    // Check for level completion after move
    setTimeout(() => {
        checkForLevelCompletion();
    }, 100);
}

function goBack() {
    if (timer != null) {
        clearInterval(timer);
    }
    for (var i = 0 ; i < squareSet.length ; i ++) {
        for (var j = 0 ; j < squareSet[i].length ; j ++) {
            if (squareSet[i][j] == null) {
                continue;
            }
            squareSet[i][j].style.transform = "scale(0.95)";
            squareSet[i][j].style.border = "0px solid white";
        }
    }
}

function flicker(arr) {
    var num = 0;
    timer = setInterval(function () {
        for (var i = 0 ; i < arr.length ; i ++) {
            arr[i].style.border = "3px solid #BFEFFF";
            arr[i].style.transform = "scale(" + (0.90 + 0.05 * Math.pow(-1, num)) + ")";
        }
        num ++;
    }, 300);
}

function checkLinked(square, arr) {
    if (square == null) {
        return;
    }
    arr.push(square);
    if (square.col > 0 && squareSet[square.row][square.col - 1] && squareSet[square.row][square.col - 1].num == square.num && arr.indexOf(squareSet[square.row][square.col - 1]) == -1) {
        checkLinked(squareSet[square.row][square.col - 1], arr);
    }
    if (square.col < boardWidth - 1 && squareSet[square.row][square.col + 1] && squareSet[square.row][square.col + 1].num == square.num && arr.indexOf(squareSet[square.row][square.col + 1]) == -1) {
        checkLinked(squareSet[square.row][square.col + 1], arr);
    }
    if (square.row < boardWidth - 1 && squareSet[square.row + 1][square.col] && squareSet[square.row + 1][square.col].num == square.num && arr.indexOf(squareSet[square.row + 1][square.col]) == -1) {
        checkLinked(squareSet[square.row + 1][square.col], arr);
    }
    if (square.row > 0 && squareSet[square.row - 1][square.col] && squareSet[square.row - 1][square.col].num == square.num && arr.indexOf(squareSet[square.row - 1][square.col]) == -1) {
        checkLinked(squareSet[square.row - 1][square.col], arr);
    }
}

function refresh() {
    for (var i = 0 ; i < squareSet.length ; i ++) {
        for (var j = 0 ; j < squareSet[i].length ; j ++) {
            if (squareSet[i][j] == null) {
                continue;
            }
            squareSet[i][j].row = i;
            squareSet[i][j].col = j;
            squareSet[i][j].style.transition = "left 0.3s, bottom 0.3s";
            squareSet[i][j].style.left = squareSet[i][j].col * squareWidth + "px";
            squareSet[i][j].style.bottom = squareSet[i][j].row * squareWidth + "px";
            squareSet[i][j].style.backgroundImage = "url('./pic/" + squareSet[i][j].num + ".png')";
            squareSet[i][j].style.backgroundSize = "cover";
            squareSet[i][j].style.transform = "scale(0.95)";

        }
    }
}

function createSquare(value, row, col) {
    var temp = document.createElement("div");
    temp.style.width = squareWidth + "px";
    temp.style.height = squareWidth + "px";
    temp.style.display = "inline-block";
    temp.style.position = "absolute";
    temp.style.boxSizing = "border-box";
    temp.style.borderRadius = "12px";
    temp.num = value;
    temp.row = row;
    temp.col = col;
    return temp;
}

function selectScore() {
    var score = 0;
    for (var i = 0 ; i < choose.length ; i ++) {
        score += baseScore + i * stepScore;
    }
    if (score == 0) {
        return;
    }
    document.getElementById("selectScore").innerHTML = choose.length + " stars " + score + " points";
    document.getElementById("selectScore").style.transition = null;
    document.getElementById("selectScore").style.opacity = 1;
    setTimeout(function () {
        document.getElementById("selectScore").style.transition = "opacity 1s";
        document.getElementById("selectScore").style.opacity = 0;
    }, 1000);
}

function mouseOver(obj) {
    if (!flag) {
        tempSquare = obj;
        return;
    }
    goBack();
    choose = [];
    checkLinked(obj, choose);
    if (choose.length <= 1) {
        choose = [];
        return;
    }
    flicker(choose);
    selectScore();
}

function gameOverAlert(message) {
    if (alertActive) return;
    
    alertActive = true;

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9998;
    `;

    const alertBox = document.createElement("div");
    alertBox.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 10px;
      z-index: 9999;
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
      text-align: center;
      min-width: 200px;
    `;

    alertBox.innerHTML = `
      <p style="margin-bottom: 20px; font-size: 20px;">${message}</p>
      <button id="alert-ok-btn" style="
        padding: 8px 16px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      ">OK</button>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(alertBox);

    const okBtn = document.getElementById("alert-ok-btn");
    okBtn?.addEventListener("click", () => {
      alertBox.style.display = 'none';
      overlay.style.display = 'none';
      
      setTimeout(async () => {
        document.body.removeChild(alertBox);
        document.body.removeChild(overlay);
        alertActive = false;
        // Reset game with fresh layout
        await resetGame();
      }, 10);
    }, { once: true });
};

function showAlert(message) {
  if (alertActive) return;
  alertActive = true;

  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9998;
    background: rgba(0, 0, 0, 0.2);
  `;

  const alertBox = document.createElement("div");
  alertBox.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px 30px;
    border-radius: 10px;
    z-index: 9999;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
    text-align: center;
    font-size: 20px;
    min-width: 200px;
  `;

  alertBox.textContent = message;

  document.body.appendChild(overlay);
  document.body.appendChild(alertBox);

  setTimeout(() => {
    alertBox.style.opacity = '0';
    overlay.style.opacity = '0';
    alertBox.style.transition = 'opacity 0.3s ease';
    overlay.style.transition = 'opacity 0.3s ease';

    setTimeout(() => {
      document.body.removeChild(alertBox);
      document.body.removeChild(overlay);
      alertActive = false;
    }, 300); // match the fade-out duration
  }, 2000); // display for 2.5 seconds
}


function adjustPopStarSize() {
    const wrapper = document.getElementById('game-wrapper');
    const popStar = document.getElementById('pop_star');

    const safeTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('padding-top')) || 0;
    const safeBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('padding-bottom')) || 0;

    const totalHeight = wrapper.clientHeight;
    const scoreBars = 100; // 2 score bars (50px each)

    const maxSize = Math.min(
        wrapper.clientWidth,
        totalHeight - scoreBars - safeTop - safeBottom
    );

    popStar.style.width = maxSize + 'px';
    popStar.style.height = maxSize + 'px';
}

window.addEventListener('load', adjustPopStarSize);
window.addEventListener('resize', adjustPopStarSize);

// Handle authentication and API data loading
document.addEventListener('DOMContentLoaded', async function() {
  const token = localStorage.getItem("token");

  if (typeof mos !== 'undefined') {
    console.log('MOS is available');

    if (token) {
      // Already logged in, fetch game data and initialize
      await initializeGameWithData();
    } else {
      // Not logged in, authenticate first
      const appKey = import.meta.env.VITE_APP_KEY;
      console.log('AppKey:', appKey);

      try {
        await gameAPI.authenticate();
        console.log('Login successful');
        await initializeGameWithData();
      } catch (error) {
        console.error('Login or data load failed:', error);
        // Fallback to default initialization
        await initializeGameWithData();
      }
    }
  } else {
    console.error('MOS not available');
    // Fallback to default initialization
    await initializeGameWithData();
  }
});

// window.onload is handled by DOMContentLoaded for proper API integration

window.onresize = initializeGameWithData;
window.onresize = initializeGameWithData;

// Global function to manually check level completion (can be called from console)
window.checkLevelCompletion = function() {
  console.log('Manual level completion check triggered');
  checkForLevelCompletion();
};

// Global function to manually advance to next level (can be called from console)
window.advanceLevel = function() {
  console.log('Manual level advancement triggered');
  advanceToNextLevel();
};