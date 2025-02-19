// ================== GLOBAL VARIABLES & HELPER FUNCTIONS ==================

// Replace with your Render API URL for the leaderboard backend
const API_URL = 'https://leaderboard-backend-9a9q.onrender.com';

// Global object for player state; will be loaded from localStorage or initialized.
let playerData = null;

// Default initial state for the player data.
function getInitialStats() {
  return {
    name: null,
    catch: {
      luckyStreak: 0,
      dryStreak: 0,
      fish: 0,
      junk: 0,
      types: {}, // Example: { "🐟": 5, "🥫": 3 }
    },
    trap: {
      active: false,
      start: 0,
      end: 0,
      duration: 0,
    },
    readyTimestamp: 0,
    coins: 10,
    lifetime: {
      fish: 0,
      coins: 0,
      sold: 0,
      baitUsed: 0,
      attempts: 0,
      dryStreak: 0,
      luckyStreak: 0,
      maxFishSize: 0,
      maxFishType: '',
      trap: { times: 0, timeSpent: 0, bestFishCatch: 0, cancelled: 0 },
    },
  };
}

// Load state from localStorage or initialize a new one.
function loadState() {
  const stored = localStorage.getItem('fishData');
  if (stored) {
    try {
      playerData = JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing saved state. Initializing new state.');
      playerData = getInitialStats();
      saveState();
    }
  } else {
    playerData = getInitialStats();
    saveState();
  }
}

// Save the current state to localStorage.
function saveState() {
  localStorage.setItem('fishData', JSON.stringify(playerData));
}

// Update the UI (for example, the stats panel).
function updateUI() {
  const statsDiv = document.getElementById('stats');
  statsDiv.innerHTML = `
      <p>Coins: ${playerData.coins}</p>
      <p>Fish in collection: ${playerData.catch.fish || 0}</p>
      <p>Junk in collection: ${playerData.catch.junk || 0}</p>
      <p>Fishing attempts: ${playerData.lifetime.attempts}</p>
      <p>Max fish size: ${playerData.lifetime.maxFishSize} cm ${
    playerData.lifetime.maxFishType
      ? '(' + playerData.lifetime.maxFishType + ')'
      : ''
  }</p>
      <p>Trap active: ${playerData.trap.active ? 'Yes' : 'No'}</p>
    `;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

// Format a given time difference in milliseconds as "X min Y sec".
function formatTimeDelta(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes} min ${seconds} sec`;
  }
  return `${seconds} sec`;
}

// ================== LOGGING FUNCTION ==================

// Append a message to the "log" container; keeping only 3 messages visible.
function logMessage(message) {
  const logDiv = document.getElementById('log');
  const time = new Date().toLocaleTimeString();
  const msgEl = document.createElement('div');
  msgEl.className = 'message';
  msgEl.innerHTML = `<div class="timestamp">[${time}]</div>
                     <div class="text">${message}</div>`;
  logDiv.appendChild(msgEl);
  // Keep only the last 3 message bubbles.
  while (logDiv.getElementsByClassName('message').length > 3) {
    logDiv.removeChild(logDiv.firstChild);
  }
  logDiv.scrollTop = logDiv.scrollHeight;
}

// ================== GAME FUNCTIONS ==================

// ----- Fish Command -----
// Attempts to fish. Prevents fishing if a trap is active or if in cooldown.
function fishCommand(baitInput) {
  // Prevent fishing if a trap is set
  if (playerData.trap.active) {
    logMessage(
      'You cannot fish while your trap is set. Please harvest or cancel your trap first.'
    );
    return;
  }

  const now = Date.now();
  if (playerData.readyTimestamp && now < playerData.readyTimestamp) {
    const remainingTime = playerData.readyTimestamp - now;
    logMessage(
      `Hold on! You can fish again in ${formatTimeDelta(remainingTime)}.`
    );
    return;
  }

  let rollMaximum = 20;
  let appendix = '';
  if (baitInput) {
    const baitData = baitTypes.find(
      b =>
        b.name.toLowerCase() === baitInput.toLowerCase() ||
        b.emoji === baitInput
    );
    if (playerData.coins < baitData.price) {
      logMessage(
        `You need ${baitData.price} coins for a ${baitInput} (you have ${playerData.coins}).`
      );
      return;
    }
    rollMaximum = baitData.roll;
    playerData.coins -= baitData.price;
    playerData.lifetime.baitUsed++;
    appendix = `, used ${baitInput} (coins left: ${playerData.coins})`;
  }

  playerData.lifetime.attempts++;

  const roll = randomInt(1, rollMaximum);
  if (roll !== 1) {
    // Unsuccessful catch: 1-3 minute cooldown (60,000 to 180,000 ms)
    playerData.catch.dryStreak++;
    playerData.catch.luckyStreak = 0;
    const fishingDelay = randomInt(60000, 180000);
    playerData.readyTimestamp = Date.now() + fishingDelay;
    const junkRoll = randomInt(1, 100);
    let message;
    if (junkRoll <= 25) {
      const item = getWeightedCatch('junk');
      addJunk(playerData, item.name);
      message = `No fish, but you got some junk: ${item.name}`;
    } else {
      const missDistance = randomInt(1, 100);
      message = `No luck... Your line landed ${missDistance} cm away.`;
    }
    saveState();
    updateUI();
    logMessage(
      `${message} (${formatTimeDelta(fishingDelay)} cooldown${appendix})`
    );
    return;
  }

  // Successful catch: 30 minute cooldown (1,800,000 ms)
  const caughtFishData = getWeightedCatch('fish');
  const fishType = caughtFishData.name;
  addFish(playerData, fishType);
  playerData.lifetime.fish++;
  playerData.catch.dryStreak = 0;
  playerData.catch.luckyStreak++;
  playerData.readyTimestamp = Date.now() + 1800000; // 30 minutes

  let sizeString = '';
  if (caughtFishData.size) {
    const size = randomInt(10, 100);
    sizeString = `It is ${size} cm long.`;
    if (size > playerData.lifetime.maxFishSize) {
      sizeString += ' New record!';
      playerData.lifetime.maxFishSize = size;
      playerData.lifetime.maxFishType = fishType;
    }
  }
  saveState();
  updateUI();
  logMessage(
    `Success! You caught a ${fishType}. ${sizeString} (30 min cooldown${appendix})`
  );
}

// ----- Stats Command -----
// Displays the player's statistics into the game log.
function statsCommand() {
  if (!playerData || !playerData.lifetime) {
    logMessage('No stats available.');
    return;
  }
  const attempts = playerData.lifetime.attempts || 0;
  const fishCaught = playerData.lifetime.fish || 0;
  const junkCaught = playerData.lifetime.junk || 0;
  const baitUsed = playerData.lifetime.baitUsed || 0;
  const maxFishSize = playerData.lifetime.maxFishSize || 0;
  const maxFishType = playerData.lifetime.maxFishType || '';
  const coins = playerData.coins || 0;

  const statsMessage = `
    Your Stats:<br>
    Attempts: ${attempts}<br>
    Fish caught: ${fishCaught}<br>
    Junk caught: ${junkCaught}<br>
    Bait Used: ${baitUsed}<br>
    Max Fish: ${maxFishSize} cm ${
    maxFishType ? '(' + maxFishType + ')' : ''
  }<br>
    Coins: ${coins}
  `;
  logMessage(statsMessage);
}

// ================== LEADERBOARD FUNCTIONS (Render API) ==================

// Calculate a score based on player's lifetime fish and max fish size.
function calculateScore() {
  const fishCount = playerData.lifetime.fish || 0;
  const maxSize = playerData.lifetime.maxFishSize || 0;
  // Example formula: each fish is 10 points; each cm of size is 2 points.
  return fishCount * 10 + maxSize * 2;
}

// Prompt the user for a name if not already stored.
function promptForName(callback) {
  if (!playerData.name) {
    const name = prompt('Please enter your name for the leaderboard:');
    if (name && name.trim().length > 0) {
      playerData.name = name.trim();
      saveState();
      callback(name.trim());
    } else {
      logMessage('Name is required to submit your score.');
    }
  } else {
    callback(playerData.name);
  }
}

// Submit the player's score (computed automatically) to the leaderboard API.
function submitAutoScore() {
  promptForName(name => {
    const score = calculateScore();
    logMessage(`Submitting score for ${name}: ${score}`);
    fetch(API_URL + '/submitScore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, score }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          logMessage('Score submitted successfully!');
        } else {
          logMessage('Error submitting score.');
        }
      })
      .catch(err => {
        logMessage('Error: ' + err);
      });
  });
}

// Load the global leaderboard from the API and display it.
function loadLeaderboard() {
  fetch(API_URL + '/leaderboard')
    .then(res => res.json())
    .then(data => {
      let leaderboardHTML = `<h2>Global Leaderboard</h2>`;
      data.forEach((entry, index) => {
        leaderboardHTML += `<div>${index + 1}. ${entry.name} - ${
          entry.score
        }</div>`;
      });
      const leaderboardDisplay = document.getElementById('leaderboard-display');
      if (leaderboardDisplay) {
        leaderboardDisplay.innerHTML = leaderboardHTML;
      } else {
        logMessage('Leaderboard display element not found.');
      }
    })
    .catch(err => {
      logMessage('Error loading leaderboard: ' + err);
    });
}

// ================== COLLECTION POPUP & SELL FUNCTIONS ==================

// Displays the collection popup where items can be viewed and sold.
function showCollectionPopup() {
  const popup = document.getElementById('collection-popup');
  const grid = document.getElementById('collection-grid');
  grid.innerHTML = ''; // Clear previous items

  // Iterate over the player's collection (playerData.catch.types)
  for (const [emoji, count] of Object.entries(playerData.catch.types)) {
    if (count > 0) {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'collection-item';
      itemDiv.setAttribute('data-emoji', emoji);
      // Set up inner content: emoji, count, and an input for sell amount.
      itemDiv.innerHTML = `
        <span class="emoji">${emoji}</span>
        <span class="count">(${count})</span>
        <div class="sell-input-container hidden">
          <input type="number" min="1" value="1" class="sell-amount-input" />
        </div>
      `;
      // Toggle selection when item is clicked, except if the input is clicked.
      itemDiv.addEventListener('click', function (e) {
        if (e.target.tagName.toLowerCase() === 'input') return;
        this.classList.toggle('selected');
        if (count > 1) {
          const inputContainer = this.querySelector('.sell-input-container');
          inputContainer.classList.toggle('hidden');
        }
      });
      // Prevent click events on input from bubbling up.
      const inputField = itemDiv.querySelector('.sell-amount-input');
      if (inputField) {
        inputField.addEventListener('click', e => e.stopPropagation());
      }
      grid.appendChild(itemDiv);
    }
  }

  // Add or update the "Sell Selected" button.
  let sellButton = document.getElementById('sell-selected-btn');
  if (!sellButton) {
    sellButton = document.createElement('button');
    sellButton.id = 'sell-selected-btn';
    sellButton.textContent = 'Sell Selected';
    sellButton.addEventListener('click', sellSelectedItems);
    document
      .querySelector('#collection-popup .popup-content')
      .appendChild(sellButton);
  }
  popup.classList.remove('hidden');
}

// Processes the sale of selected items from the collection popup.
function sellSelectedItems() {
  const grid = document.getElementById('collection-grid');
  const selectedItems = grid.querySelectorAll('.collection-item.selected');
  if (selectedItems.length === 0) {
    logMessage('No items selected to sell.');
    return;
  }

  let summaryItems = [];
  let totalGained = 0;

  selectedItems.forEach(itemDiv => {
    const emoji = itemDiv.getAttribute('data-emoji');
    let currentCount = playerData.catch.types[emoji];
    if (!currentCount) return;

    const itemData = itemTypes.find(it => it.name === emoji);
    if (!itemData || !itemData.sellable) return;

    // Determine the sell amount.
    let sellAmount = 1;
    if (currentCount > 1) {
      const inputField = itemDiv.querySelector('.sell-amount-input');
      if (inputField) {
        sellAmount = parseInt(inputField.value, 10) || 1;
      }
    }
    sellAmount = Math.min(currentCount, sellAmount);
    const coinsGained = sellAmount * itemData.price;
    totalGained += coinsGained;

    // Update playerData: decrease count and update overall totals.
    playerData.catch.types[emoji] -= sellAmount;
    if (itemData.type === 'fish') {
      playerData.catch.fish = (playerData.catch.fish || 0) - sellAmount;
    } else if (itemData.type === 'junk') {
      playerData.catch.junk = (playerData.catch.junk || 0) - sellAmount;
    }
    playerData.coins += coinsGained;
    playerData.lifetime.coins += coinsGained;

    summaryItems.push(`${sellAmount} ${emoji}`);
  });

  saveState();
  updateUI();
  const summaryText =
    'Sold: ' +
    summaryItems.join(', ') +
    ' | Total Gained: ' +
    totalGained +
    ' coins';
  logMessage(summaryText);
  showCollectionPopup(); // Refresh the popup to re-read collection counts.
}

// ================== EVENT LISTENERS & INITIALIZATION ==================

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed.');

  // Ensure required elements are present.
  if (!document.getElementById('stats-btn')) {
    console.error(
      "Stats button not found! Ensure your HTML includes an element with id='stats-btn'."
    );
  }
  if (!document.getElementById('log')) {
    console.error(
      "Log element (with id='log') not found! Please add one in your HTML."
    );
  }

  // Load or initialize game state.
  loadState();
  updateUI();

  // Hook up Stats button.
  const statsBtn = document.getElementById('stats-btn');
  if (statsBtn) {
    statsBtn.addEventListener('click', statsCommand);
    console.log('Stats button listener attached.');
  }

  // Hook up Fish buttons.
  const fishNoBaitBtn = document.getElementById('fish-no-bait-btn');
  if (fishNoBaitBtn) {
    fishNoBaitBtn.addEventListener('click', () => {
      try {
        fishCommand('');
      } catch (e) {
        logMessage('Error: ' + e.message);
      }
    });
  }
  const fishWormBtn = document.getElementById('fish-worm-btn');
  if (fishWormBtn) {
    fishWormBtn.addEventListener('click', () => {
      try {
        fishCommand('worm');
      } catch (e) {
        logMessage('Error: ' + e.message);
      }
    });
  }
  const fishFlyBtn = document.getElementById('fish-fly-btn');
  if (fishFlyBtn) {
    fishFlyBtn.addEventListener('click', () => {
      try {
        fishCommand('fly');
      } catch (e) {
        logMessage('Error: ' + e.message);
      }
    });
  }
  const fishCricketBtn = document.getElementById('fish-cricket-btn');
  if (fishCricketBtn) {
    fishCricketBtn.addEventListener('click', () => {
      try {
        fishCommand('cricket');
      } catch (e) {
        logMessage('Error: ' + e.message);
      }
    });
  }

  // Hook up Submit Score button.
  const submitScoreBtn = document.getElementById('submit-score-btn');
  if (submitScoreBtn) {
    submitScoreBtn.addEventListener('click', submitAutoScore);
  }

  // Hook up Leaderboard Load button.
  const loadLeaderboardBtn = document.getElementById('load-leaderboard-btn');
  if (loadLeaderboardBtn) {
    loadLeaderboardBtn.addEventListener('click', loadLeaderboard);
  }

  // Hook up Collection Popup Show button.
  const showCollectionBtn = document.getElementById('show-btn');
  if (showCollectionBtn) {
    showCollectionBtn.addEventListener('click', showCollectionPopup);
  }

  // Hook up popup close button.
  const closePopupBtn = document.getElementById('close-popup');
  if (closePopupBtn) {
    closePopupBtn.addEventListener('click', () => {
      document.getElementById('collection-popup').classList.add('hidden');
    });
  }
});

// ================== ITEM TYPES DEFINITION ==================

// Define your item types for fish and junk. Adjust as needed.
const itemTypes = [
  // Junk items
  {
    name: '🥫',
    sellable: true,
    size: false,
    type: 'junk',
    price: 8,
    weight: 25,
  },
  {
    name: '💀',
    sellable: true,
    size: false,
    type: 'junk',
    price: 5,
    weight: 10,
  },
  {
    name: '🥾',
    sellable: true,
    size: false,
    type: 'junk',
    price: 20,
    weight: 5,
  },
  {
    name: '🌿',
    sellable: true,
    size: false,
    type: 'junk',
    price: 2,
    weight: 200,
  },
  {
    name: '🍂',
    sellable: true,
    size: false,
    type: 'junk',
    price: 1,
    weight: 100,
  },
  {
    name: '🧦',
    sellable: true,
    size: false,
    type: 'junk',
    price: 5,
    weight: 50,
  },
  // Fish items
  {
    name: '🦂',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🦑',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🦐',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🦞',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🦀',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🐡',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🐠',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🐟',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🐬',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🐳',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🐋',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🦈',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🐊',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🐸',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🐢',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🐙',
    sellable: true,
    size: true,
    type: 'fish',
    price: 50,
    weight: 1,
  },
  {
    name: '🐚',
    sellable: true,
    size: false,
    type: 'fish',
    price: 50,
    weight: 1,
  },
];
