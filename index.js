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

function getTargetScore() {
    if (currentLevel <= levelScoreMap.length) {
        return levelScoreMap[currentLevel - 1];
    } else {
        let lastDefined = levelScoreMap[levelScoreMap.length - 1];
        let extraLevel = currentLevel - levelScoreMap.length;
        return Math.floor(lastDefined + extraLevel * 6000 + extraLevel ** 2 * 500);
    }
}

function showLevelClearedBanner() {
    const banner = document.getElementById("levelClearBanner");
    banner.style.opacity = 1;
    banner.style.transform = "translate(0%, -50%) scale(1)";
    // banner.style.fontSize = "18px"

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
    var flag = true;
    for (var i = 0 ; i < squareSet.length ; i ++) {
        for (var j = 0 ; j < squareSet[i].length ; j ++) {
            var temp = [];
            checkLinked(squareSet[i][j], temp);
            if (temp.length > 1) {
                return false;
            }
        }
    }
    return flag;
}

function move() {
    for (var i = 0 ; i < boardWidth ; i ++) {//纵向移动
        var pointer = 0;
        for (var j = 0 ; j < boardWidth ; j ++) {
            if(squareSet[j][i] != null) {
                if (j != pointer) {
                    squareSet[pointer][i] = squareSet[j][i];
                    squareSet[j][i].row = pointer;
                    squareSet[j][i] = null;
                }
                pointer ++;
            }
        }
    }
    for (var i = 0 ; i < squareSet[0].length ; ) {//横向移动
        if (squareSet[0][i] == null) {
            for (var j = 0 ; j < boardWidth ; j ++) {
                squareSet[j].splice(i, 1);
            }
            continue;
        }
        i ++;
    }
    refresh();
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
      
      setTimeout(() => {
        document.body.removeChild(alertBox);
        document.body.removeChild(overlay);
        alertActive = false;
        totalScore = 0;
        init();
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

function init() {
    const banner = document.getElementById("levelClearBanner");

    if (banner) {
        banner.classList.remove("shown");
        banner.style.opacity = 0;
        banner.style.top = "40%";
        banner.style.left = "50%";
        banner.style.right = "auto";
        banner.style.transform = "translate(-50%, -50%) scale(1)";
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

    table.innerHTML = "";
    squareSet = [];

    for (var i = 0; i < boardWidth; i++) {
        squareSet[i] = new Array();
        for (var j = 0; j < boardWidth; j++) {
            var square = createSquare(Math.floor(Math.random() * 5), i, j);
            square.onmouseover = function () {
                mouseOver(this);
            };
            square.onclick = function () {
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

                // 🔥 Show banner if user reaches the goal for the first time
                if (totalScore >= getTargetScore() && !document.getElementById("levelClearBanner").classList.contains("shown")) {
                    showLevelClearedBanner();
                    document.getElementById("levelClearBanner").classList.add("shown");
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

                                        setTimeout(function () {
                                            var finished = isFinish();
                                            if (finished) {
                                                if (totalScore >= getTargetScore()) {
                                                    showAlert("Level " + currentLevel + " cleared!");
                                                    currentLevel++;
                                                    setTimeout(init, 1000);
                                                } else {
                                                    gameOverAlert("Game over!");
                                                    currentLevel = 1;
                                                    totalScore = 0;
                                                    // setTimeout(init, 1000);
                                                }
                                            } else {
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
    refresh();
    flag = true;
}

window.onload = function () {
    init();
}

window.onresize = init;