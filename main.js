const SUPABASE_URL = "https://yzhspdhbbanfluzvwjac.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aHNwZGhiYmFuZmx1enZ3amFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5OTM0ODIsImV4cCI6MjA1NTU2OTQ4Mn0.-Pfg4CMHeW7T3mN_aXjviA1tPXebcrY7g-oJhD2se6E";               // Your Supabase anon key
const { createClient } = supabase; 
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================== GLOBAL VARIABLES & STATE MANAGEMENT ==================
let playerData = null;

function getInitialStats() {
  return {
    name: null,
    catch: {
      luckyStreak: 0,
      dryStreak: 0,
      fish: 0,
      junk: 0,
      types: {}
    },
    trap: {
      active: false,
      start: 0,
      end: 0,
      duration: 3600000  // 1 hour duration
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
      maxFishType: "",
      trap: {
         times: 0,
         cancelled: 0
      }
    }
  };
}

function loadState() {
  const stored = localStorage.getItem("fishData");
  if (stored) {
    try {
      playerData = JSON.parse(stored);
      if (!playerData.lifetime.trap) {
        playerData.lifetime.trap = { times: 0, cancelled: 0 };
      }
    } catch (e) {
      console.error("Error parsing saved state. Initializing new state.");
      playerData = getInitialStats();
      saveState();
    }
  } else {
    playerData = getInitialStats();
    saveState();
  }
}

function saveState() {
  localStorage.setItem("fishData", JSON.stringify(playerData));
}

// ================== UI UPDATE FUNCTIONS ==================
function updateUI() {
  const statsDiv = document.getElementById('stats');
  statsDiv.innerHTML = `
    <div><span>Coins:</span><span>¢${playerData.coins}</span></div>
    <div><span>Fish in collection:</span><span>${playerData.catch.fish}</span></div>
    <div><span>Junk in collection:</span><span>${playerData.catch.junk}</span></div>
    <div><span>Fishing attempts:</span><span>${playerData.lifetime.attempts}</span></div>
    <div><span>Fish size record:</span><span>${playerData.lifetime.maxFishSize}cm</span></div>
    <div><span>Trap active:</span><span>${playerData.trap.active ? 'Yes' : 'No'}</span></div>
    <div><span>Fish caught:</span><span>${playerData.lifetime.fish}</span></div>
    <div><span>Junk caught:</span><span>${playerData.lifetime.junk}</span></div>
    <div><span>Bait used:</span><span>${playerData.lifetime.baitUsed}</span></div>
  `;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTimeDelta(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes} min ${seconds} sec`;
  }
  return `${seconds} sec`;
}

// ================== GAME LOG FUNCTIONS (with Caching) ==================
function getTimestamp() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
}

function addGameMessage(message) {
  const log = document.getElementById("log");
  const entry = document.createElement("div");
  entry.className = "message";
  entry.innerHTML = `
    <span class="timestamp">[${getTimestamp()}]</span>
    <br>
    <span class="text">${message}</span>
  `;
  
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

// ================== FISHING FUNCTIONS ==================
function fishCommand(baitInput) {
  if (playerData.trap.active) {
    addGameMessage('You cannot fish while your trap is set. Please harvest or cancel your trap first.');
    return;
  }

  const now = Date.now();
  if (playerData.readyTimestamp && now < playerData.readyTimestamp) {
    const remainingTime = playerData.readyTimestamp - now;
    addGameMessage(`Not so fast! You can fish again in ${formatTimeDelta(remainingTime)}.`);
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
    if (playerData.coins < baitData.price) {addGameMessage(`You need ${baitData.price} coins for a ${baitInput} (you have ${playerData.coins}).`);
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
    showCollection();
    addGameMessage(`${message} (${formatTimeDelta(fishingDelay)} cooldown${appendix})<br>${playerData.catch.dryStreak} casts since last fish caught`);
    return;
  }

  const caughtFishData = getWeightedCatch('fish');
  const fishType = caughtFishData.name;
  addFish(playerData, fishType);
  playerData.lifetime.fish++;
  playerData.catch.dryStreak = 0;
  playerData.catch.luckyStreak++;
  playerData.readyTimestamp = Date.now() + 1800000;

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
  showCollection();
  addGameMessage(
    `Success! You caught a ${fishType}. ${sizeString} (30 min cooldown${appendix})`
  );
}

function getWeightedCatch(type) {
  const applicableItems = itemTypes.filter(item => item.type === type);
  const totalWeight = applicableItems.reduce((sum, item) => sum + item.weight, 0);
  let roll = randomInt(1, totalWeight);
  for (const item of applicableItems) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  throw new Error("Weighted catch error");
}

function addFish(state, emoji) {
  state.catch.fish = (state.catch.fish || 0) + 1;
  state.lifetime.fish = (state.lifetime.fish || 0) + 1;
  state.catch.types[emoji] = (state.catch.types[emoji] || 0) + 1;
}

function addJunk(state, emoji) {
  state.catch.junk = (state.catch.junk || 0) + 1;
  state.lifetime.junk = (state.lifetime.junk || 0) + 1;
  state.catch.types[emoji] = (state.catch.types[emoji] || 0) + 1;
}

// ================== TRAP FUNCTIONS ==================
function checkTrapExpiration() {
  if (playerData.trap.active) {
    if (Date.now() >= playerData.trap.end) {
    }
  }
}

function updateTrapUI() {
  const trapBtn = document.getElementById("trap-btn");
  const pullBtn = document.getElementById("pull-traps-btn");
  if (playerData.trap.active) {
    trapBtn.textContent = "Harvest Trap";
    if (pullBtn) {
      pullBtn.style.display = "inline-block";
    }
  } else {
    trapBtn.textContent = "Set Trap";
    if (pullBtn) {
      pullBtn.style.display = "none";
    }
  }
}

function trapCommand() {
  if (playerData.coins < 20) {
    addGameMessage("You need 20 coins to set a trap.");
    return;
  }


  
  playerData.coins -= 20;

  const now = Date.now();
  if (!playerData.trap.active) {
    playerData.trap.active = true;
    playerData.trap.start = now;
    playerData.trap.duration = 3600000; // 1 hour
    playerData.trap.end = now + playerData.trap.duration;
    saveState();
    updateUI();
    addGameMessage(`You have set your trap. It will be ready in ${formatTimeDelta(playerData.trap.duration)}.`);
  } else {
    addGameMessage("Your trap is active. Use the Harvest or Pull in Traps options.");
  }
  updateTrapUI();
}

function harvestTrap() {
  const now = Date.now();
  if (playerData.trap.active) {
    if (now >= playerData.trap.end) {
      const fishCount = randomInt(0, 2);
      const junkCount = randomInt(4, 8);
      let harvestMsg = "";
      let fishCaughtNames = [];
      let junkCaughtNames = [];

      for (let i = 0; i < fishCount; i++) {
        const fish = getWeightedCatch("fish");
        fishCaughtNames.push(fish.name);
        addFish(playerData, fish.name);
      }
      for (let i = 0; i < junkCount; i++) {
        const junk = getWeightedCatch("junk");
        junkCaughtNames.push(junk.name);
        addJunk(playerData, junk.name);
      }

      playerData.lifetime.trap.times = (playerData.lifetime.trap.times || 0) + 1;

      playerData.trap.active = false;
      playerData.trap.start = 0;
      playerData.trap.end = 0;
      
      if (fishCount === 0) {
        harvestMsg = `You harvested your trap and collected ${fishCount} fish and ${junkCount} pieces of junk (${junkCaughtNames.join(", ")}).`;
      } else {
        harvestMsg = `You harvested your trap and collected ${fishCount} fish (${fishCaughtNames.join(", ")}) and ${junkCount} pieces of junk (${junkCaughtNames.join(", ")}).`;
      }
      
      saveState();
      updateUI();
      showCollection();
      addGameMessage(harvestMsg);
    } else {
      const remaining = playerData.trap.end - now;
      const msg = `Your trap is not yet ready to harvest. Time remaining: ${formatTimeDelta(remaining)}.`;
      addGameMessage(msg);
    }
  } else {
    addGameMessage("No trap is set.");
  }
  updateTrapUI();
}

function pullInTraps() {
  if (playerData.trap.active) {
    playerData.trap.active = false;
    playerData.trap.start = 0;
    playerData.trap.end = 0;
    playerData.lifetime.trap.cancelled++;
    playerData.coins += 20;
    saveState();
    updateUI();
    showCollection();
    addGameMessage("You pulled in your traps early, you have received no catch and your coins have been refunded.");
    
  } else {
    addGameMessage("No trap is set.");
  }
  updateTrapUI();
}

// ================== LEADERBOARD FUNCTIONS ==================
function calculateScore() {
  return playerData.catch.fish || 0;
}

async function submitAutoScore(silent = false) {
  if (!playerData.name) {
    if (!silent) addGameMessage("Username missing. Please enter a username at the prompt.");
    return;
  }
  const score = calculateScore();
  if (!silent) addGameMessage("Submitting score for " + playerData.name + ": " + score);

  const { data, error } = await supabaseClient
    .from("leaderboard")
    .upsert({
      name: playerData.name,
      score: score,
      player_data: playerData, // stores the complete playerData object
      submission_origin: "submit-my-score"
    }, { onConflict: 'name' });
    
  if (error) {
    if (!silent) addGameMessage("Error updating score: " + error.message);
  } else {
    if (!silent) addGameMessage("Score updated successfully!");
  }
}

async function loadLeaderboard() {
  const { data, error } = await supabaseClient
    .from("leaderboard")
    .select("name, score")
    .order("score", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    addGameMessage("Error loading leaderboard: " + error.message);
    return;
  }

  const lbDisplay = document.getElementById("leaderboard-display");
  lbDisplay.innerHTML = ''; // Clear existing entries

  data.forEach((entry, index) => {
    const entryEl = document.createElement('div');
    entryEl.innerHTML = `
      ${index + 1}. ${entry.name} - <span class="leaderboard-score">${entry.score.toLocaleString()}</span>
    `;
    lbDisplay.appendChild(entryEl);
  });
}

// ================== COLLECTION POPUP & SELL FUNCTIONS ==================
function showUsernamePopup() {
  const popup = document.getElementById("username-popup");
  const overlay = document.getElementById("modal-overlay");
  popup.style.display = "block";
  overlay.style.display = "block";
}

async function validateUsername(username) {
  const { data, error } = await supabaseClient
    .from("leaderboard")
    .select("name")
    .eq("name", username)
    .single();
  
  if (data) {
    return { valid: false, message: "Username is already taken." };
  }
  return { valid: true };
}

function setupUsernamePopup() {
  const submitBtn = document.getElementById("username-submit-btn");
  submitBtn.addEventListener("click", async () => {
    const usernameInput = document.getElementById("username-input");
    const errorEl = document.getElementById("username-error");
    const username = usernameInput.value.trim();
    if (!username) {
      errorEl.style.display = "block";
      errorEl.textContent = "Username cannot be empty.";
      return;
    }
    const result = await validateUsername(username);
    if (!result.valid) {
      errorEl.style.display = "block";
      errorEl.textContent = result.message;
      return;
    }
    errorEl.style.display = "none";
    playerData.name = username;
    saveState();
    document.getElementById("username-popup").style.setProperty("display", "none", "important");
    document.getElementById("modal-overlay").style.display = "none";
  });
}

// ================== COLLECTION DISPLAY ==================
function createCollectionItem(emoji, count) {
  const itemDiv = document.createElement("div");
  itemDiv.className = "collection-item";
  itemDiv.dataset.itemId = emoji;
  
  itemDiv.innerHTML = `
    <div class="item-image">${emoji}</div>
    <div class="item-count">x${count}</div>
    <div class="sell-controls">
      <input type="number" min="1" max="${count}" value="1">
      <button class="pixel-button max-button">MAX</button>
    </div>
  `;

  // Add max button handler
  const maxButton = itemDiv.querySelector('.max-button');
  maxButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const input = itemDiv.querySelector('input');
    input.value = input.max; // Set to maximum available
  });

  // Add click handler to show sell controls
  itemDiv.addEventListener('click', (e) => {
    // Don't trigger if clicking sell controls
    if (e.target.closest('.sell-controls')) return;
    
    // Toggle selected state and sell controls
    const sellControls = itemDiv.querySelector('.sell-controls');
    itemDiv.classList.toggle('selected');
    sellControls.style.display = itemDiv.classList.contains('selected') ? 'block' : 'none';
    
    // Update sell button text based on selections
    updateSellButtons();
  });

  return itemDiv;
}

function updateSellButtons() {
  const sections = document.querySelectorAll('.collection-section');
  
  sections.forEach(section => {
    const heading = section.querySelector('h3');
    if (!heading) return;
    
    const type = heading.textContent;
    const sellBtn = section.querySelector('.sell-all-button');
    if (!sellBtn) return;
    
    const selectedItems = section.querySelectorAll('.collection-item.selected').length;
    sellBtn.textContent = selectedItems > 0 ? `Sell Selected ${type}` : `Sell All ${type}`;
  });
}

function sellAllOfType(type) {
  const sections = document.querySelectorAll('.collection-section');
  let section;
  
  for (const s of sections) {
    const heading = s.querySelector('h3');
    if (heading && heading.textContent.toLowerCase() === type) {
      section = s;
      break;
    }
  }
  
  if (!section) return;

  const selectedItems = section.querySelectorAll('.collection-item.selected');
  let totalCoins = 0;
  let totalItems = 0;

  // If there are selected items, only sell those
  if (selectedItems.length > 0) {
    selectedItems.forEach(item => {
      const emoji = item.dataset.itemId;
      const input = item.querySelector('input');
      const sellAmount = parseInt(input.value);
      const itemData = itemTypes.find(i => i.name === emoji);
      const currentCount = playerData.catch.types[emoji];

      if (sellAmount <= currentCount && sellAmount > 0) {
        totalCoins += itemData.price * sellAmount;
        totalItems += sellAmount;
        playerData.catch.types[emoji] -= sellAmount;
        
        if (type === 'fish') {
          playerData.catch.fish -= sellAmount;
        } else {
          playerData.catch.junk -= sellAmount;
        }
      }
    });
  } else {
    // Sell all if nothing is selected
    for (const [emoji, count] of Object.entries(playerData.catch.types)) {
      const itemData = itemTypes.find(item => item.name === emoji);
      if (itemData && itemData.type === type && count > 0) {
        totalCoins += itemData.price * count;
        totalItems += count;
        playerData.catch.types[emoji] = 0;
      }
    }
    
    if (type === 'fish') {
      playerData.catch.fish = 0;
    } else {
      playerData.catch.junk = 0;
    }
  }

  playerData.coins += totalCoins;
  playerData.lifetime.sold += totalItems;

  saveState();
  updateUI();
  showCollection();
  
  const sellType = selectedItems.length > 0 ? 'selected' : 'all';
  addGameMessage(`Sold ${sellType} ${type} (${totalItems} items) for ${totalCoins} coins.`);
}

function showCollection() {
  const grid = document.getElementById('collection-grid');
  grid.innerHTML = '';

  // Create Fish section
  const fishSection = document.createElement("div");
  fishSection.className = "collection-section";
  fishSection.innerHTML = '<h3>Fish</h3>';
  const fishContainer = document.createElement("div");

  // Create Junk section
  const junkSection = document.createElement("div");
  junkSection.className = "collection-section";
  junkSection.innerHTML = '<h3>Junk</h3>';
  const junkContainer = document.createElement("div");

  // Populate items
  for (const [emoji, count] of Object.entries(playerData.catch.types)) {
    if (count > 0) {
      const itemData = itemTypes.find(item => item.name === emoji);
      if (!itemData) continue;

      const itemDiv = createCollectionItem(emoji, count);
      
      if (itemData.type === "fish") {
        fishContainer.appendChild(itemDiv);
      } else {
        junkContainer.appendChild(itemDiv);
      }
    }
  }

  // Add sell all buttons and append sections
  if (fishContainer.children.length > 0) {
    const sellAllFishBtn = document.createElement('button');
    sellAllFishBtn.className = 'pixel-button sell-all-button';
    sellAllFishBtn.textContent = 'Sell All Fish';
    sellAllFishBtn.addEventListener('click', () => sellAllOfType('fish'));
    
    fishSection.appendChild(fishContainer);
    fishSection.appendChild(sellAllFishBtn);
    grid.appendChild(fishSection);
  }

  if (junkContainer.children.length > 0) {
    const sellAllJunkBtn = document.createElement('button');
    sellAllJunkBtn.className = 'pixel-button sell-all-button';
    sellAllJunkBtn.textContent = 'Sell All Junk';
    sellAllJunkBtn.addEventListener('click', () => sellAllOfType('junk'));
    
    junkSection.appendChild(junkContainer);
    junkSection.appendChild(sellAllJunkBtn);
    grid.appendChild(junkSection);
  }

  updateSellButtons();
}

// ================== EVENT LISTENERS & INITIALIZATION ==================

document.addEventListener('DOMContentLoaded', () => {
  loadState();

  if (playerData.name && playerData.name.trim().length > 0) {
    document.getElementById("username-popup").style.setProperty("display", "none", "important");
  } else {
    showUsernamePopup();
    setupUsernamePopup();
  }
  

  checkTrapExpiration();
  updateUI();
  showCollection();
  updateTrapUI();
  loadLeaderboard();

  setInterval(() => {
    loadLeaderboard();
    submitAutoScore(true);
  }, 5000);

  const fishNoBaitBtn = document.getElementById('fish-no-bait-btn');
  if (fishNoBaitBtn) {
    fishNoBaitBtn.addEventListener('click', () => {
      try {
        fishCommand('');
      } catch (e) {
        addGameMessage('Error: ' + e.message);
      }
    });
  }
  const fishWormBtn = document.getElementById('fish-worm-btn');
  if (fishWormBtn) {
    fishWormBtn.addEventListener('click', () => {
      try {
        fishCommand('worm');
      } catch (e) {
        addGameMessage('Error: ' + e.message);
      }
    });
  }
  const fishFlyBtn = document.getElementById('fish-fly-btn');
  if (fishFlyBtn) {
    fishFlyBtn.addEventListener('click', () => {
      try {
        fishCommand('fly');
      } catch (e) {
        addGameMessage('Error: ' + e.message);
      }
    });
  }
  const fishCricketBtn = document.getElementById('fish-cricket-btn');
  if (fishCricketBtn) {
    fishCricketBtn.addEventListener('click', () => {
      try {
        fishCommand('cricket');
      } catch (e) {
        addGameMessage('Error: ' + e.message);
      }
    });
  }

  const submitScoreBtn = document.getElementById('submit-score-btn');
  if (submitScoreBtn) {
    submitScoreBtn.addEventListener('click', submitAutoScore);
  }

  const loadLeaderboardBtn = document.getElementById('load-leaderboard-btn');
  if (loadLeaderboardBtn) {
    loadLeaderboardBtn.addEventListener('click', loadLeaderboard);
  }

  const showCollectionBtn = document.getElementById('show-btn');
  if (showCollectionBtn) {
    showCollectionBtn.addEventListener('click', showCollection);
  }

  const closePopupBtn = document.getElementById('close-popup');
  if (closePopupBtn) {
    closePopupBtn.addEventListener('click', () => {
      document.getElementById('collection-popup').classList.add('hidden');
    });
  }

  const trapBtn = document.getElementById("trap-btn");
  if (trapBtn) {
    trapBtn.addEventListener("click", () => {
      if (playerData.trap.active) {
        harvestTrap();
      } else {
        trapCommand();
      }
    });
  }
  
  const pullBtn = document.getElementById("pull-traps-btn");
  if (pullBtn) {
    pullBtn.addEventListener("click", pullInTraps);
  }
});

// ================== ITEM TYPES DEFINITION ==================
const baitTypes = [
  { emoji: "🪱", name: "worm", price: 2, roll: 16 },
  { emoji: "🪰", name: "fly", price: 5, roll: 14 },
  { emoji: "🦗", name: "cricket", price: 8, roll: 12 }
];

const itemTypes = [
  // Junk items
  { name: "🥫", sellable: true, size: false, type: "junk", price: 8, weight: 25 },
  { name: "💀", sellable: true, size: false, type: "junk", price: 5, weight: 10 },
  { name: "🥾", sellable: true, size: false, type: "junk", price: 20, weight: 5 },
  { name: "🌿", sellable: true, size: false, type: "junk", price: 2, weight: 150 },
  { name: "🍂", sellable: true, size: false, type: "junk", price: 1, weight: 100 },
  { name: "🧦", sellable: true, size: false, type: "junk", price: 5, weight: 50 },
  { name: "👓", sellable: true, size: false, type: "junk", price: 10, weight: 10 },
  { name: "🔧", sellable: true, size: false, type: "junk", price: 15, weight: 5 },
  { name: "🔩", sellable: true, size: false, type: "junk", price: 10, weight: 5 },
  { name: "🧺", sellable: true, size: false, type: "junk", price: 10, weight: 5 },
  { name: "🪸", sellable: true, size: false, type: "junk", price: 30, weight: 1 },
  { name: "🧴", sellable: true, size: false, type: "junk", price: 10, weight: 5 },
  { name: "🪠", sellable: true, size: false, type: "junk", price: 10, weight: 3 },
  { name: "🪶", sellable: true, size: false, type: "junk", price: 10, weight: 3 },
  { name: "🩴", sellable: true, size: false, type: "junk", price: 10, weight: 4 },
  { name: "🎈", sellable: true, size: false, type: "junk", price: 6, weight: 3 },
  { name: "🪵", sellable: true, size: false, type: "junk", price: 15, weight: 2 },
  { name: "🥄", sellable: true, size: false, type: "junk", price: 10, weight: 3 },
  
  // Fish items
  { name: "🦂", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🦑", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🦐", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🦞", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🦀", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🐡", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🐠", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🐟", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🐬", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🐳", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🐋", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🦈", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🐊", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🐸", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🐢", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🐙", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
  { name: "🐚", sellable: true, size: false, type: "fish", price: 50, weight: 1 },
  { name: "🦪", sellable: true, size: true, type: "fish", price: 50, weight: 1 },
];
