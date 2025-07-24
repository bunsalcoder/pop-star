# Star Layout Save Fix

## Issue Fixed:
When moving to the next level, the new star layout was not being saved to the API, causing it to revert to the previous level's layout on refresh.

## Solution Applied:

### 1. **Added `saveNewLevelLayout()` Helper Function**
```javascript
async function saveNewLevelLayout() {
  try {
    const newStarLayout = squareSet.map(row => row.map(sq => sq ? sq.num : null));
    // ... save to API with levelCleared: false for new level
  } catch (e) {
    console.error('Failed to save new level star layout:', e);
  }
}
```

### 2. **Updated Level Progression Logic**
- **`advanceToNextLevel()`**: Now saves the new layout after generating it
- **onclick handlers**: Both setTimeout calls now save the new layout after level progression

### 3. **Key Changes Made:**

#### Before:
```javascript
setTimeout(() => initializeGameWithData(null, true), 1000);
```

#### After:
```javascript
setTimeout(async () => {
  await initializeGameWithData(null, true);
  await saveNewLevelLayout();
}, 1000);
```

## What This Fixes:

1. **Level 2 Layout Persistence**: When you move to Level 2, the new random star layout will be saved
2. **Refresh Consistency**: After refresh, you'll see the correct Level 2 layout, not Level 1's layout
3. **API State Sync**: The API will always have the current level's star layout

## Expected Behavior Now:

1. **Complete Level 1** → Click banner → Move to Level 2
2. **Level 2 loads** with fresh random star layout
3. **New layout is saved** to API automatically
4. **Refresh the page** → Level 2 layout persists correctly
5. **Target score updates** to Level 2's target
6. **Current score carries over** from Level 1

The star layout will now persist correctly across refreshes for each level! 