const API_URL = "https://leaderboard-backend-9a9q.onrender.com";

function submitScore(name, score) {
    fetch(API_URL + "/submitScore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, score })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          logMessage("Score submitted successfully!");
        } else {
          logMessage("Error submitting score.");
        }
      })
      .catch((err) => {
        logMessage("Error: " + err);
      });
  }

  function loadLeaderboard() {
    fetch(API_URL + "/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        // For demonstration, log the leaderboard data
        let leaderboardHTML = `<h2>Global Leaderboard</h2>`;
        data.forEach((entry, index) => {
          leaderboardHTML += `<div>${index + 1}. ${entry.name} - ${entry.score}</div>`;
        });
        // You might show this on a dedicated page or popup
        document.getElementById("leaderboard-display").innerHTML = leaderboardHTML;
      })
      .catch((err) => {
        logMessage("Error loading leaderboard: " + err);
      });
  }

/************************************************************
 * Utility functions and game data (adapted from your code)  *
 ************************************************************/

// Random integer (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // Format time delta (in ms) as seconds (for demo purposes)
  function formatTimeDelta(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) {
      return `${minutes} min ${seconds} sec`;
    }
    return `${seconds} sec`;
  }
  
  // Group digits (using locale format)
  function groupDigits(n) {
    return n.toLocaleString();
  }
  
  // Returns a random element from an array.
  function randArray(arr) {
    return arr[randomInt(0, arr.length - 1)];
  }
  
  // Default fishing data (initial state)
  function getInitialStats() {
    return {
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
        duration: 0
      },
      readyTimestamp: 0,
      coins: 0, // start with a few coins
      lifetime: {
        fish: 0,
        coins: 0,
        sold: 0,
        baitUsed: 0,
        attempts: 0,
        dryStreak: 0,
        luckyStreak: 0,
        maxFishSize: 0,
        maxFishType: null,
        trap: {
          times: 0,
          timeSpent: 0,
          bestFishCatch: 0,
          cancelled: 0
        }
      }
    };
  }
  
  // Bait types
  const baitTypes = [
    { emoji: "🪱", name: "worm", price: 2, roll: 16 },
    { emoji: "🪰", name: "fly", price: 5, roll: 14 },
    { emoji: "🦗", name: "cricket", price: 8, roll: 12 }
  ];
  
  // Item types (both fish and junk)
  const itemTypes = [
    { name: "🥫", sellable: true, size: false, type: "junk", price: 8, weight: 25 },
    { name: "💀", sellable: true, size: false, type: "junk", price: 5, weight: 10 },
    { name: "🥾", sellable: true, size: false, type: "junk", price: 20, weight: 5 },
    { name: "🌿", sellable: true, size: false, type: "junk", price: 2, weight: 200 },
    { name: "🍂", sellable: true, size: false, type: "junk", price: 1, weight: 100 },
    { name: "🧦", sellable: true, size: false, type: "junk", price: 5, weight: 50 },
    { name: "🗑️", sellable: true, size: false, type: "junk", price: 3, weight: 30 },
    { name: "🥤", sellable: true, size: false, type: "junk", price: 4, weight: 20 },
    { name: "🪨", sellable: true, size: false, type: "junk", price: 2, weight: 40 },
    { name: "🛢️", sellable: true, size: false, type: "junk", price: 10, weight: 5 },
    { name: "🍁", sellable: true, size: false, type: "junk", price: 1, weight: 50 },
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
    { name: "🦭", sellable: true, size: true, type: "fish", price: 75, weight: 1 }

  ];
  
  // Returns a weighted random catch of a given type ("fish" or "junk")
  function getWeightedCatch(type) {
    const applicableItems = itemTypes.filter((i) => i.type === type);
    const totalWeight = applicableItems.reduce((sum, i) => sum + i.weight, 0);
    let roll = randomInt(1, totalWeight);
    for (const item of applicableItems) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    throw new Error("Invalid weighted roll result");
  }
  
  // Simulate a catch roll (returns an object with catch item or null)
  function rollCatch(bait = null) {
    let odds = 20;
    if (bait) {
      const baitData = baitTypes.find(
        (i) => i.emoji === bait || i.name.toLowerCase() === bait.toLowerCase()
      );
      if (!baitData) {
        throw new Error("Invalid bait type provided");
      }
      odds = baitData.roll;
    }
    const roll = randomInt(1, odds);
    if (roll === 1) {
      return { catch: getWeightedCatch("fish"), type: "fish" };
    } else {
      const r = randomInt(1, 4);
      if (r === 1) {
        return { catch: getWeightedCatch("junk"), type: "junk" };
      } else {
        return { catch: null, type: "nothing" };
      }
    }
  }
  
  // Update the player's collection with a new fish
  function addFish(state, emoji) {
    state.catch.fish = (state.catch.fish || 0) + 1;
    state.lifetime.fish = (state.lifetime.fish || 0) + 1;
    state.catch.types[emoji] = (state.catch.types[emoji] || 0) + 1;
  }
  
  // Update the player's collection with junk
  function addJunk(state, emoji) {
    state.catch.junk = (state.catch.junk || 0) + 1;
    state.lifetime.junk = (state.lifetime.junk || 0) + 1;
    state.catch.types[emoji] = (state.catch.types[emoji] || 0) + 1;
  }
  
  /****************************************************
   * Game state and persistence                        *
   ****************************************************/
  
  let playerData = null;
  
  function loadState() {
    const stored = localStorage.getItem("fishData");
    if (stored) {
      try {
        playerData = JSON.parse(stored);
      } catch (e) {
        playerData = getInitialStats();
      }
    } else {
      playerData = getInitialStats();
    }
  }
  
  function saveState() {
    localStorage.setItem("fishData", JSON.stringify(playerData));
  }
  
  /****************************************************
   * UI Updater and Logger                           *
   ****************************************************/
  
  function updateUI() {
    const statsDiv = document.getElementById("stats");
    statsDiv.innerHTML = `
      <p>Coins: ${playerData.coins}</p>
      <p>Fish in collection: ${playerData.catch.fish || 0}</p>
      <p>Junk in collection: ${playerData.catch.junk || 0}</p>
      <p>Fishing attempts: ${playerData.lifetime.attempts}</p>
      <p>Max fish size: ${playerData.lifetime.maxFishSize} cm ${
      playerData.lifetime.maxFishType ? "(" + playerData.lifetime.maxFishType + ")" : ""
    }</p>
      <p>Trap active: ${playerData.trap.active ? "Yes" : "No"}</p>
    `;
  }
  
  function logMessage(message) {
    const logDiv = document.getElementById("log");
    const time = new Date().toLocaleTimeString();
    const msgEl = document.createElement("div");
    msgEl.className = "message";
    msgEl.innerHTML = `<div class="timestamp">[${time}]</div>
                       <div class="text">${message}</div>`;
    logDiv.appendChild(msgEl);
    // Keep only the last 3 messages:
    while (logDiv.getElementsByClassName("message").length > 3) {
      logDiv.removeChild(logDiv.firstChild);
    }
    logDiv.scrollTop = logDiv.scrollHeight;
  }
  
  
  /****************************************************
   * Commands (simulating your Discord commands)      *
   ****************************************************/
  
  // Fish command – adapt the logic from fish.js
  function fishCommand(baitInput) {
    // Prevent fishing if a trap is set
    if (playerData.trap.active) {
      logMessage(
        "You cannot fish while your trap is set. Please harvest or cancel your trap first."
      );
      return;
    }
  
    const now = Date.now();
  if (playerData.readyTimestamp && now < playerData.readyTimestamp) {
    const remainingTime = playerData.readyTimestamp - now;
    logMessage(`Hold on! You can fish again in ${formatTimeDelta(remainingTime)}.`);
    return;
  }
  
    let rollMaximum = 20;
    let appendix = "";
    if (baitInput) {
      const baitData = baitTypes.find(
        (b) =>
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
        const item = getWeightedCatch("junk");
        addJunk(playerData, item.name);
        message = `No fish, but you got some junk: ${item.name}`;
      } else {
        const missDistance = randomInt(1, 100);
        message = `No luck... Your line landed ${missDistance} cm away.`;
      }
      saveState();
      updateUI();
      logMessage(`${message} (${formatTimeDelta(fishingDelay)} cooldown${appendix})`);
      return;
    }
  
    // Successful catch: 30 minute cooldown (1,800,000 ms)
    const caughtFishData = getWeightedCatch("fish");
    const fishType = caughtFishData.name;
    addFish(playerData, fishType);
    playerData.lifetime.fish++;
    playerData.catch.dryStreak = 0;
    playerData.catch.luckyStreak++;
    playerData.readyTimestamp = Date.now() + 1800000; // 30 minutes
  
    let sizeString = "";
    if (caughtFishData.size) {
      const size = randomInt(10, 100);
      sizeString = `It is ${size} cm long.`;
      if (size > playerData.lifetime.maxFishSize) {
        sizeString += " New record!";
        playerData.lifetime.maxFishSize = size;
        playerData.lifetime.maxFishType = fishType;
      }
    }
    saveState();
    updateUI();
    logMessage(`Success! You caught a ${fishType}. ${sizeString} (30 min cooldown${appendix})`);
  }
  
  
  // Sell command – adapted from sell.js
  function sellCommand(itemInput, amountInput) {
    if (!itemInput) {
      logMessage("Please specify an item (for example: 🐟 or 💀).");
      return;
    }
  
    const itemData = itemTypes.find((i) => i.name === itemInput);
    if (!itemData) {
      logMessage(`Unknown item ${itemInput}.`);
      return;
    }
    const owned = playerData.catch.types[itemData.name] || 0;
    if (owned <= 0) {
      logMessage(`You have no ${itemInput} to sell.`);
      return;
    }
    let sellAmount = amountInput ? parseInt(amountInput) : 1;
    if (isNaN(sellAmount) || sellAmount < 1) {
      logMessage("Invalid sell amount provided.");
      return;
    }
    const actualSell = Math.min(owned, sellAmount);
    playerData.catch.types[itemData.name] -= actualSell;
    playerData.catch[itemData.type] -= actualSell;
    const coinsGained = actualSell * itemData.price;
    playerData.coins += coinsGained;
    playerData.lifetime.coins += coinsGained;
    saveState();
    updateUI();
    logMessage(
      `Sold ${actualSell} ${itemInput} for ${coinsGained} coins. (Coins now: ${playerData.coins})`
    );
  }

  function showCollectionPopup() {
    const popup = document.getElementById("collection-popup");
    const grid = document.getElementById("collection-grid");
    grid.innerHTML = ""; // Clear previous content
    
    // Iterate over the player's collection (fish and junk)
    for (const [emoji, count] of Object.entries(playerData.catch.types)) {
      if (count > 0) {
        const itemDiv = document.createElement("div");
        itemDiv.className = "collection-item";
        itemDiv.setAttribute("data-emoji", emoji);
        
        // Set up inner HTML (sell input is initially hidden)
        itemDiv.innerHTML = `
          <span class="emoji">${emoji}</span>
          <span class="count">(${count})</span>
          <div class="sell-input-container hidden">
            <input type="number" min="1" value="1" class="sell-amount-input" />
          </div>
        `;
        
        // When clicking on the item, only toggle selection if the click is not on the input.
        itemDiv.addEventListener("click", function(e) {
          if (e.target.tagName.toLowerCase() === "input") return;
          this.classList.toggle("selected");
          // Show the input field if more than one is available.
          if (count > 1) {
            const inputContainer = this.querySelector(".sell-input-container");
            inputContainer.classList.toggle("hidden");
          }
        });
        
        // Prevent clicks on the input from propagating to the parent.
        const inputField = itemDiv.querySelector(".sell-amount-input");
        if (inputField) {
          inputField.addEventListener("click", (e) => {
            e.stopPropagation();
          });
        }
        
        grid.appendChild(itemDiv);
      }
    }
    
    // Add or update the "Sell Selected" button at the bottom of the popup.
    let sellButton = document.getElementById("sell-selected-btn");
    if (!sellButton) {
      sellButton = document.createElement("button");
      sellButton.id = "sell-selected-btn";
      sellButton.textContent = "Sell Selected";
      sellButton.addEventListener("click", sellSelectedItems);
      document.querySelector("#collection-popup .popup-content").appendChild(sellButton);
    }
    
    popup.classList.remove("hidden");
  }

  function sellSelectedItems() {
    const grid = document.getElementById("collection-grid");
    const selectedItems = grid.querySelectorAll(".collection-item.selected");
    if (selectedItems.length === 0) {
      logMessage("No items selected to sell.");
      return;
    }
    
    let summaryItems = [];
    let totalGained = 0;
    
    selectedItems.forEach((itemDiv) => {
      const emoji = itemDiv.getAttribute("data-emoji");
      let currentCount = playerData.catch.types[emoji];
      if (!currentCount) return;
      
      const itemData = itemTypes.find((it) => it.name === emoji);
      if (!itemData || !itemData.sellable) return;
      
      // Determine sell amount:
      let sellAmount = 1;
      if (currentCount > 1) {
        const inputField = itemDiv.querySelector(".sell-amount-input");
        if (inputField) {
          sellAmount = parseInt(inputField.value, 10) || 1;
        }
      }
      sellAmount = Math.min(currentCount, sellAmount);
      const coinsGained = sellAmount * itemData.price;
      totalGained += coinsGained;
      
      // Update player's collection and coin totals.
      playerData.catch.types[emoji] -= sellAmount;
      if (itemData.type === "fish") {
        playerData.catch.fish = (playerData.catch.fish || 0) - sellAmount;
      } else if (itemData.type === "junk") {
        playerData.catch.junk = (playerData.catch.junk || 0) - sellAmount;
      }
      playerData.coins += coinsGained;
      playerData.lifetime.coins += coinsGained;
      
      summaryItems.push(`${sellAmount} ${emoji}`);
    });
    
    saveState();
    updateUI();
    const summaryText = "Sold: " + summaryItems.join(", ") + " | Total Gained: " + totalGained + " coins";
    logMessage(summaryText);
    showCollectionPopup(); // Refresh the popup view.
  }
  

  document.getElementById("show-btn").addEventListener("click", showCollectionPopup);
  document.getElementById("close-popup").addEventListener("click", () => {
    document.getElementById("collection-popup").classList.add("hidden");
  });
  
  // Show command – adapted from show.js
  function showCommand(typeInput) {
    let targetType = "fish"; // default
    if (typeInput) {
      const lowered = typeInput.toLowerCase();
      if (lowered === "fish" || lowered === "junk") {
        targetType = lowered;
      } else {
        logMessage("Invalid type! Use 'fish' or 'junk'.");
        return;
      }
    }
    if (!playerData.catch[targetType] || playerData.catch[targetType] <= 0) {
      logMessage(`You have no ${targetType} in your collection.`);
      return;
    }
    let result = [];
    for (const [item, count] of Object.entries(playerData.catch.types)) {
      const it = itemTypes.find((i) => i.name === item);
      if (it && it.type === targetType && count > 0) {
        result.push(count < 5 ? item.repeat(count) : `${count}x ${item}`);
      }
    }
    logMessage(`Your ${targetType}: ${result.join(" ")}`);
  }
  
  // Stats command – adapted from stats.js
  function statsCommand() {
    // Ensure playerData and its lifetime property exist
    if (!playerData || !playerData.lifetime) {
      logMessage("No stats available. Please try again later.");
      return;
    }
  
    const attempts    = playerData.lifetime.attempts  || 0;
    const fishCaught  = playerData.lifetime.fish      || 0;
    const junkCaught  = playerData.lifetime.junk      || 0;
    const baitUsed    = playerData.lifetime.baitUsed  || 0;
    const maxFishSize = playerData.lifetime.maxFishSize || 0;
    const maxFishType = playerData.lifetime.maxFishType || "";
    const coins       = playerData.coins            || 0;
  
    // Build stats message with line breaks using <br> tags
    const statsMessage = `
      Your Stats:<br>
      Attempts: ${attempts}<br>
      Fish caught: ${fishCaught}<br>
      Junk caught: ${junkCaught}<br>
      Bait Used: ${baitUsed}<br>
      Max Fish: ${maxFishSize} cm ${maxFishType ? "(" + maxFishType + ")" : ""}<br>
      Coins: ${coins}
    `;
    logMessage(statsMessage);
  }
  
  // Trap command – adapted from trap.js
  function trapCommand(operation) {
    const now = Date.now();
    if (operation === "cancel" || operation === "harvest") {
      if (playerData.trap.active) {
        if (now < playerData.trap.end) {
          // Cancelling before trap is ready: no catch, increment cancelled count.
          playerData.trap.active = false;
          playerData.trap.start = 0;
          playerData.trap.end = 0;
          playerData.lifetime.trap.cancelled++;
          saveState();
          updateUI();
          logMessage("You cancelled your traps early and get no catch.");
        } else {
          let rolls = Math.floor(playerData.trap.duration / 1000);
          let results = [];
          for (let i = 0; i < rolls; i++) {
            const item = rollCatch();
            if (!item.catch) continue;
            if (item.type === "fish") {
              addFish(playerData, item.catch.name);
              results.push(item.catch.name);
            } else if (item.type === "junk") {
              addJunk(playerData, item.catch.name);
              results.push(item.catch.name);
            }
          }
          playerData.lifetime.trap.times++;
          playerData.lifetime.trap.timeSpent += playerData.trap.duration;
          playerData.trap.active = false;
          playerData.trap.start = 0;
          playerData.trap.end = 0;
          playerData.trap.duration = 0;
          saveState();
          updateUI();
          logMessage(
            results.length === 0
              ? "You harvest your traps, but there's nothing in them."
              : "You harvest your traps and get: " + results.join(" ")
          );
        }
      } else {
        logMessage("You have no traps set.");
      }
      return;
    }
  
    if (!playerData.trap.active) {
      playerData.trap.active = true;
      playerData.trap.start = now;
      // 1 hour trap cooldown (3,600,000 ms)
      playerData.trap.duration = 3600000;
      playerData.trap.end = now + playerData.trap.duration;
      saveState();
      updateUI();
      logMessage(`You have set your traps. They will be ready in ${formatTimeDelta(playerData.trap.duration)}.`);
    } else {
      let remaining = playerData.trap.end - now;
      logMessage(`Your traps are still set. They will be ready in ${formatTimeDelta(remaining)}.`);
    }
  }
  
  
  // Buy command – trivial as in buy.js
  function buyCommand() {
    logMessage("There isn't anything to buy at the gear shop... yet.");
  }
  
  // Config command – not applicable in browser version
  function configCommand() {
    logMessage("Config command not needed in the browser version.");
  }
  
  // Leaderboard command – dummy single-user leaderboard
  function leaderboardCommand() {
    logMessage(`Top Anglers:
  Rank 1: You (${groupDigits(playerData.lifetime.fish)} fish caught)`);
  }

  function giveTestItems() {
    const emoji = prompt("Enter the emoji of the item to add (e.g. 🐟 or 🥫):");
    const amountStr = prompt("Enter the amount to add:");
    const amount = parseInt(amountStr, 10);
  
    if (!emoji || isNaN(amount) || amount <= 0) {
      alert("Invalid input.");
      return;
    }
  
    const item = itemTypes.find(it => it.name === emoji);
    if (!item) {
      alert("Unknown emoji. Please check your input.");
      return;
    }
  
    // Increase the count for this item.
    playerData.catch.types[emoji] = (playerData.catch.types[emoji] || 0) + amount;
  
    // Update overall fish or junk count (depending on the type).
    if (item.type === "fish") {
      playerData.catch.fish = (playerData.catch.fish || 0) + amount;
    } else if (item.type === "junk") {
      playerData.catch.junk = (playerData.catch.junk || 0) + amount;
    }
  
    saveState();
    updateUI();
    logMessage(`Test: Added ${amount} of ${emoji} to your collection.`);
  }
  
  
  /****************************************************
   * Set up event listeners on DOMContentLoaded       *
   ****************************************************/
  
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded and parsed.");
  
    // Ensure the log container exists
    const logDiv = document.getElementById("log");
    if (!logDiv) {
      console.error("Log element with id 'log' not found. Please add it to your HTML.");
      return;
    }
  
    // Stats Button
    const statsBtn = document.getElementById("stats-btn");
    if (!statsBtn) {
      console.error("Stats button with id 'stats-btn' not found.");
    } else {
      statsBtn.addEventListener("click", () => {
        statsCommand();
      });
      console.log("Stats button listener attached.");
    }
  
    // Example Fish Buttons (if you have them)
    const fishNoBaitBtn = document.getElementById("fish-no-bait-btn");
    if (fishNoBaitBtn) {
      fishNoBaitBtn.addEventListener("click", () => {
        try {
          fishCommand(""); // No bait
        } catch (e) {
          logMessage("Error: " + e.message);
        }
      });
    }
  
    const fishWormBtn = document.getElementById("fish-worm-btn");
    if (fishWormBtn) {
      fishWormBtn.addEventListener("click", () => {
        try {
          fishCommand("worm");
        } catch (e) {
          logMessage("Error: " + e.message);
        }
      });
    }
  
    const fishFlyBtn = document.getElementById("fish-fly-btn");
    if (fishFlyBtn) {
      fishFlyBtn.addEventListener("click", () => {
        try {
          fishCommand("fly");
        } catch (e) {
          logMessage("Error: " + e.message);
        }
      });
    }
  
    const fishCricketBtn = document.getElementById("fish-cricket-btn");
    if (fishCricketBtn) {
      fishCricketBtn.addEventListener("click", () => {
        try {
          fishCommand("cricket");
        } catch (e) {
          logMessage("Error: " + e.message);
        }
      });
    }

    const submitScoreBtn = document.getElementById("submit-score-btn");
    if (submitScoreBtn) {
        submitScoreBtn.addEventListener("click", () => {
        // Use a prompt for demo purposes:
        const name = prompt("Enter your name:");
        const score = parseInt(prompt("Enter your score:"), 10);
        if (name && !isNaN(score)) {
            submitScore(name, score);
        } else {
            logMessage("Invalid name or score.");
        }
        });
    }
    
    // Load leaderboard button
    const loadLeaderboardBtn = document.getElementById("load-leaderboard-btn");
    if (loadLeaderboardBtn) {
        loadLeaderboardBtn.addEventListener("click", () => {
        loadLeaderboard();
        });
    }
  
    // Other initialization code if needed:
    // For example, load game state if applicable:
    if (typeof loadState === "function") {
      loadState();
    }
    if (typeof updateUI === "function") {
      updateUI();
    }
  });
  