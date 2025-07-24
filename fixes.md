# Game Logic Fixes Needed

## Issue 1: Banner Persistence
**Problem**: Stage clear UI vanishes on refresh even when user reaches goal score.

**Fix**: In `initializeGameWithData()` function, after the banner reset code, add:
```javascript
// Show banner if level has been cleared and score is above target
if (levelCleared && totalScore >= getTargetScore()) {
  console.log('Showing banner for cleared level');
  showLevelClearedBanner();
}
```

## Issue 2: Level Progression
**Problem**: When finishing level 1, it shows "Level 1 cleared" but doesn't move to level 2 with fresh star layout.

**Fix**: 
1. Add `forceNewLevel` parameter to `initializeGameWithData()` function
2. Update level completion logic to use `forceNewLevel=true`

**Current code**:
```javascript
setTimeout(initializeGameWithData, 1000);
```

**Should be**:
```javascript
setTimeout(() => initializeGameWithData(null, true), 1000);
```

## Issue 3: isFinish() Function
**Problem**: Game doesn't properly detect when no more stars can be popped.

**Fix**: Already implemented - the `isFinish()` function now properly checks for remaining stars and linked groups.

## Summary of Changes Needed:
1. Add banner persistence check in `initializeGameWithData()`
2. Update both `setTimeout(initializeGameWithData, 1000)` calls to use `forceNewLevel=true`
3. The `isFinish()` function is already fixed 