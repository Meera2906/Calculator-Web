// Element references
const screen = document.getElementById("screen");
const buttonsContainer = document.getElementById("buttons");
const historyPanel = document.getElementById("history");

// State variables
let current = "";
let justEvaluated = false;
let caretPos = 0;
const history = [];

// Button layout
const buttonLayout = [
  '📝', '()', 'CE', 'C',
  '7', '8', '9', '÷',
  '4', '5', '6', '×',
  '1', '2', '3', '-',
  '0', '.', '=', '+'
];

// Create calculator buttons
buttonLayout.forEach(label => {
  const btn = document.createElement("button");
  btn.innerText = label;
  if (label === '📝') {
    btn.onclick = () => toggleHistory(); // Toggle history panel
  } else {
    btn.onclick = () => handleInput(label); // Handle calculator input
  }
  buttonsContainer.appendChild(btn);
});

// Sound effect setup
const clickSound = new Audio('/assets/click.mp3');

function playSound() {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {}); // Prevent error if sound can't play
}


// Update the calculator screen with caret position
function updateScreen() {
  const before = escapeHtml(current.slice(0, caretPos));
  const after = escapeHtml(current.slice(caretPos));
  screen.innerHTML = before + '<span class="caret"></span>' + after;
}

// Escape HTML special characters for safety
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
}

// Handle input from buttons and keyboard
function handleInput(label) {
  playSound();

  if (label === '()') {
    const open = (current.match(/\(/g) || []).length;
    const close = (current.match(/\)/g) || []).length;
    const toInsert = open > close ? ')' : '(';
    insertAtCursor(toInsert);
  } else if (label === '=') {
    try {
      const cleaned = cleanExpression(current);
      const result = eval(cleaned.replace(/×/g, '*').replace(/÷/g, '/'));
      history.unshift(`${current} = ${result}`); // Store the calculation in history
      if (history.length > 10) history.pop(); // Limit to 10 calculations
      current = result.toString();
      caretPos = current.length;
      justEvaluated = true;
    } catch {
      screen.textContent = "Error";
      current = "";
      caretPos = 0;
      justEvaluated = false;
      return;
    }
  } else if (label === 'CE') {
    current = "";
    caretPos = 0;
  } else if (label === 'C') {
    if (caretPos > 0) {
      current = current.slice(0, caretPos - 1) + current.slice(caretPos);
      caretPos -= 1;
    }
  } else {
    insertAtCursor(label);
  }
  updateScreen();
}


// Insert character at caret position and handle context logic
function insertAtCursor(char) {
  if (justEvaluated) {
    if (/[0-9.]/.test(char)) {
      current = char;
      caretPos = 1;
    } else if (/[+\-×÷*/]/.test(char)) {
      current += char;
      caretPos = current.length;
    } else {
      current = char;
      caretPos = 1;
    }
    justEvaluated = false;
  } else {
    // Autocorrect: Insert '*' between a number and an opening parenthesis
    if (char === '(' && current.length > 0 && /[0-9.]/.test(current[caretPos - 1])) {
      current = current.slice(0, caretPos) + '×' + char + current.slice(caretPos);
      caretPos += 2;
    } else {
    const operators = ['+', '-', '×', '÷', '*', '/'];
    const prevChar = current[caretPos - 1];

    if (operators.includes(char) && operators.includes(prevChar)) {
      // Replace the previous operator with the new one
      current = current.slice(0, caretPos - 1) + char + current.slice(caretPos);
      } else {
        current = current.slice(0, caretPos) + char + current.slice(caretPos);
        caretPos += char.length;
      }
    }
  }
}

const operators = ['+', '-', '×', '÷', '*', '/'];
const prevChar = current[caretPos - 1];

if (operators.includes(char) && operators.includes(prevChar)) {
current = current.slice(0, caretPos - 1) + char + current.slice(caretPos);
} else {
current = current.slice(0, caretPos) + char + current.slice(caretPos);
caretPos += char.length;
}

// Ensure valid expression by balancing parentheses
function cleanExpression(expr) {
  let result = '';
  let balance = 0;

  for (let char of expr) {
    if (char === '(') {
      balance++;
      result += char;
    } else if (char === ')') {
      if (balance > 0) {
        balance--;
        result += char;
      }
    } else {
      result += char;
    }
  }

  return result + ')'.repeat(balance); // Append missing closing parentheses
}


// Toggle history panel visibility and content
function toggleHistory() {
  const isHidden = historyPanel.classList.toggle('hidden'); // Toggle class
  buttonsContainer.style.display = isHidden ? 'grid' : 'none';// Toggle button visibility

  if (!isHidden) {
    historyPanel.innerHTML = '';  // Clear previous history content
    const historyList = document.createElement('ul');

    history.forEach((entry) => {
      const listItem = document.createElement('li');
      listItem.innerText = entry;
      historyList.appendChild(listItem);
    });

    historyPanel.appendChild(historyList);
  }
}

// Close history panel if clicked outside of it
document.addEventListener('click', (e) => {
  if (!historyPanel.contains(e.target) && !buttonsContainer.contains(e.target)) {
    // Close the history panel if it's open
    if (!historyPanel.classList.contains('hidden')) {
      historyPanel.classList.add('hidden');
      buttonsContainer.style.display = 'grid'; // Show buttons again
    }
  }
});


// Set caret position based on click location on screen
screen.addEventListener("click", (e) => {
  const rect = screen.getBoundingClientRect();
  const x = e.clientX - rect.left;

  const testDiv = document.createElement("div");
  testDiv.style.visibility = "hidden";
  testDiv.style.position = "absolute";
  testDiv.style.whiteSpace = "pre";
  testDiv.style.font = window.getComputedStyle(screen).font;
  document.body.appendChild(testDiv);

  let found = false;
  caretPos = current.length;

  for (let i = 0; i <= current.length; i++) {
    testDiv.textContent = current.slice(0, i);
    const width = testDiv.getBoundingClientRect().width;
    if (width >= x) {
      caretPos = i;
      found = true;
      break;
    }
  }

  if (!found) caretPos = current.length;

  document.body.removeChild(testDiv);
  updateScreen();
});


// Keyboard input handling
document.addEventListener("keydown", (e) => {
  if (e.key === "Delete"){
    e.preventDefault();
    handleInput('CE');
  } else if (e.key === "Backspace") {
    e.preventDefault();
    if (caretPos > 0) {
      current = current.slice(0, caretPos - 1) + current.slice(caretPos);
      caretPos--;
    }
  } else if (e.key === "ArrowLeft") {
    if (caretPos > 0) caretPos--;
  } else if (e.key === "ArrowRight") {
    if (caretPos < current.length) caretPos++;
  } else if (e.key === "Enter") {
    e.preventDefault();
    handleInput('=');
  } else if (e.key === "Escape") {
    e.preventDefault();
    handleInput('CE');
  } else if (/[\d.+\-*/()]/.test(e.key)) {
    insertAtCursor(e.key);
  } else {
    return;
  }
  
  updateScreen();
});

// Initial screen update
updateScreen();
