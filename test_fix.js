// Test file to demonstrate the fixes needed

// Fix 1: Banner persistence - show banner if level is cleared and score is above target
function showBannerIfLevelCleared() {
  const banner = document.getElementById("levelClearBanner");
  if (banner && levelCleared && totalScore >= getTargetScore()) {
    showLevelClearedBanner();
  }
}

// Fix 2: Level progression - ensure new levels get fresh random layouts
function startNewLevel() {
  // Force new level initialization without API data
  initializeGameWithData(null, true);
}

// Fix 3: Update the level completion logic
function handleLevelCompletion() {
  showAlert("Level " + currentLevel + " cleared!");
  currentLevel++;
  // Save game data when level is completed
  saveGameDataOnLevelComplete();
  setTimeout(startNewLevel, 1000);
}

// The main fixes needed in index.js:
// 1. Add banner persistence check in initializeGameWithData
// 2. Add forceNewLevel parameter to initializeGameWithData
// 3. Update level completion to use forceNewLevel=true
// 4. Update isFinish function to properly detect game completion 