
"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE_KEY = "quantumforge_demo_v1";

const defaultState = {
  name: "Student",
  language: "en",
  completed: [],
  xp: 0,
  minutes: 0,
  lastVisit: "",
  streak: 1,
  weekly: 0
};

let state = loadState();
let timerSeconds = 300;
let timerInterval = null;
let sessionStart = Date.now();
let quantumCompleted = false;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...defaultState, ...saved };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Progress could not be saved in this browser.", error);
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function setupVisit() {
  const today = todayKey();
  if (state.lastVisit !== today) {
    const previous = new Date();
    previous.setDate(previous.getDate() - 1);
    const yesterday = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}-${String(previous.getDate()).padStart(2, "0")}`;

    if (!state.lastVisit) state.streak = 1;
    else if (state.lastVisit === yesterday) state.streak = Math.max(1, state.streak + 1);
    else state.streak = 1;

    state.lastVisit = today;
    saveState();
  }
}

const courses = [
  { id: "quantum-intro", category: "Quantum", icon: "⟡", theme: "art-quantum", title: "Quantum Computing: First Steps", desc: "Understand qubits, superposition and quantum gates through friendly explanations.", duration: "15 min", lesson: "A qubit is a quantum system described by a state. Unlike a classical bit, which is either 0 or 1, a qubit can be in a superposition of the basis states |0⟩ and |1⟩. Measurement produces a classical result with probabilities determined by the state." },
  { id: "quantum-gates", category: "Quantum", icon: "◈", theme: "art-quantum", title: "Explore Quantum Gates", desc: "Learn how X, H and Z gates transform simple qubit states.", duration: "12 min", lesson: "Quantum gates are operations on quantum states. The X gate swaps |0⟩ and |1⟩. The Hadamard gate transforms a basis state into an equal superposition. The Z gate changes the phase of the |1⟩ component." },
  { id: "python-basics", category: "Programming", icon: "⌘", theme: "art-python", title: "Python Foundations", desc: "Explore variables, print statements, data types and beginner coding logic.", duration: "20 min", lesson: "Python is a general-purpose programming language. Start with print('Hello, world!'), then practise variables such as name = 'Maya' and numbers such as score = 10. Use small programs to understand how statements execute." },
  { id: "ml-intro", category: "AI", icon: "✳", theme: "art-ai", title: "Machine Learning Essentials", desc: "Discover training data, features, predictions and model evaluation.", duration: "18 min", lesson: "Machine learning uses data to fit a model that can make predictions. A typical workflow includes preparing data, splitting training and evaluation sets, fitting a model, measuring performance and checking for bias or overfitting." },
  { id: "study-skills", category: "Career", icon: "✧", theme: "art-career", title: "Focus and Study Habits", desc: "Build a realistic study routine with short sessions and reflection.", duration: "10 min", lesson: "Choose one small goal, remove distractions, work for a focused period, then take a short break. At the end, write down what you learned and what you will practise next. Adjust the routine to suit your schedule." },
  { id: "ai-responsible", category: "AI", icon: "◎", theme: "art-ai", title: "Responsible AI Basics", desc: "Learn about privacy, fairness, transparency and checking AI outputs.", duration: "14 min", lesson: "Responsible AI includes evaluating accuracy, protecting personal data, checking for unfair outcomes, explaining limitations and keeping people involved in important decisions. AI-generated information should be verified against reliable sources." }
];

function setPage(pageId) {
  const target = $("#" + pageId);
  if (!target) return;

  $$(".page").forEach(page => page.classList.toggle("active", page.id === pageId));
  $$(".nav-btn[data-page]").forEach(btn => btn.classList.toggle("active", btn.dataset.page === pageId));

  const titles = {
    dashboard: "Dashboard", learn: "My Learning", quantum: "Quantum Lab",
    skills: "Skill Studio", library: "Resource Library",
    assistant: "AI Companion", settings: "Settings"
  };
  $("#pageTitle").textContent = titles[pageId] || "QuantumForge";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function completeLesson(id) {
  if (state.completed.includes(id)) {
    alert("You've already completed this lesson. Keep practising!");
    return;
  }

  state.completed.push(id);
  state.xp += 20;
  state.weekly += 1;
  saveState();
  renderDashboard();
  renderCourses();
  updateMilestones();
  alert("Lesson completed! +20 XP. Your progress has been saved in this browser.");
}

function renderDashboard() {
  $("#profileName").textContent = state.name || "Student";
  $("#sideStreak").textContent = `${state.streak} day streak`;
  $("#streakStat").textContent = `${state.streak} day${state.streak === 1 ? "" : "s"}`;
  $("#completedStat").textContent = state.completed.length;
  $("#pointsStat").textContent = `${state.xp} XP`;
  $("#hoursStat").textContent = `${state.minutes} min`;
  $("#weeklyText").textContent = `${Math.min(state.weekly, 5)} / 5 lessons`;
  $("#weeklyProgress").style.width = `${Math.min(100, state.weekly * 20)}%`;

  const greeting = {
    en: `Welcome back, ${state.name || "Learner"}!`,
    ta: `மீண்டும் வரவேற்கிறோம், ${state.name || "மாணவரே"}!`,
    hi: `वापसी पर स्वागत है, ${state.name || "विद्यार्थी"}!`
  };
  $("#welcomeTitle").innerHTML = `${escapeHTML(greeting[state.language] || greeting.en)}<br><em>Keep growing.</em>`;

  const quantumDone = state.completed.includes("quantum-intro");
  const pythonDone = state.completed.includes("python-basics");
  $("#quantumProgress").style.width = quantumDone ? "100%" : "0%";
  $("#quantumProgressText").textContent = quantumDone ? "100% completed" : "0% completed";
  $("#pythonProgress").style.width = pythonDone ? "100%" : "0%";
  $("#pythonProgressText").textContent = pythonDone ? "100% completed" : "0% completed";
  $("#goalText").textContent = state.completed.length ? "Keep the learning momentum going" : "Complete one lesson today";
  $("#todayDate").textContent = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function renderCourses() {
  const query = ($("#courseSearch")?.value || "").trim().toLowerCase();
  const category = $("#categoryFilter")?.value || "all";
  const filtered = courses.filter(course =>
    (category === "all" || course.category === category) &&
    `${course.title} ${course.desc} ${course.category}`.toLowerCase().includes(query)
  );

  $("#courseGrid").innerHTML = filtered.length ? filtered.map(course => {
    const done = state.completed.includes(course.id);
    return `
      <article class="catalog-card">
        <div class="catalog-art ${course.theme}">${course.icon}</div>
        <span class="course-type">${escapeHTML(course.category.toUpperCase())} · ${escapeHTML(course.duration)}</span>
        <h3>${escapeHTML(course.title)}</h3>
        <p>${escapeHTML(course.desc)}</p>
        <button class="${done ? "outline-btn" : "primary-btn"}" data-course="${escapeHTML(course.id)}">
          ${done ? "Completed ✓" : "Start learning ↗"}
        </button>
      </article>`;
  }).join("") : `<div class="panel"><p>No courses found. Try a different search.</p></div>`;
}

function openCourse(id) {
  const course = courses.find(item => item.id === id);
  if (!course) return;

  const done = state.completed.includes(id);
  const lessonWindow = window.open("", "_blank");
  if (!lessonWindow) {
    alert("Your browser blocked the lesson window. Please allow pop-ups or try again.");
    return;
  }

  const safeTitle = escapeHTML(course.title);
  const safeLesson = escapeHTML(course.lesson);
  lessonWindow.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle} | QuantumForge</title><style>
    body{font-family:Arial,sans-serif;background:#f8f5ef;color:#332c30;margin:0;padding:35px;line-height:1.8}
    main{max-width:700px;margin:35px auto;background:#fffdf9;padding:30px;border:1px solid #eae2d9;border-radius:16px}
    .tag{color:#974d3a;letter-spacing:2px;font-size:11px;font-weight:bold}h1{font-family:Georgia,serif;line-height:1.3}
    p{color:#756b6a}button{background:#bd654c;color:white;border:0;padding:13px 18px;border-radius:8px;cursor:pointer;font-weight:bold}
    .note{background:#f3e5da;padding:15px;border-radius:9px}
  </style></head><body><main><span class="tag">${escapeHTML(course.category.toUpperCase())} · ${escapeHTML(course.duration)}</span><h1>${safeTitle}</h1><p>${safeLesson}</p><div class="note">Learning tip: write down one new concept and explain it in your own words.</div><p>Read the lesson, reflect on what you learned, then mark it complete.</p><button id="finish">${done ? "Already completed ✓" : "Mark lesson complete ✓"}</button></main><script>
    document.getElementById('finish').addEventListener('click',function(){
      if(window.opener && !window.opener.closed){window.opener.postMessage({type:'QF_COMPLETE',id:${JSON.stringify(id)}},window.location.origin);}
      this.textContent='Completion sent — return to QuantumForge';
      this.disabled=true;
    });
  <\/script></body></html>`);
  lessonWindow.document.close();
}

window.addEventListener("message", event => {
  if (event.data?.type === "QF_COMPLETE" && courses.some(course => course.id === event.data.id)) {
    completeLesson(event.data.id);
  }
});

function updateMilestones() {
  const count = state.completed.length;
  $("#milestoneOne").textContent = count >= 1 ? "✓" : "○";
  $("#milestoneThree").textContent = count >= 3 ? "✓" : "○";
  $("#milestoneFive").textContent = count >= 5 ? "✓" : "○";
}

function updateQuantum() {
  const gate = $("#gateSelect").value;
  $("#gateBox").textContent = gate;
  let zero = 100;
  let one = 0;
  let title = "Identity gate";
  let explanation = "The identity gate leaves the qubit state unchanged.";

  if (gate === "X") {
    zero = 0; one = 100;
    title = "Bit-flip gate applied";
    explanation = "The X gate maps |0⟩ to |1⟩, so an ideal measurement returns 1.";
  } else if (gate === "H") {
    zero = 50; one = 50;
    title = "Superposition created";
    explanation = "The Hadamard gate maps |0⟩ to an equal superposition of |0⟩ and |1⟩.";
  } else if (gate === "Z") {
    title = "Phase-flip gate applied";
    explanation = "The Z gate changes the phase of |1⟩. On the initial |0⟩ state, probabilities remain unchanged.";
  }

  $("#probZero").style.width = `${zero}%`;
  $("#probOne").style.width = `${one}%`;
  $("#probZeroText").textContent = `${zero}%`;
  $("#probOneText").textContent = `${one}%`;
  $("#quantumResult").innerHTML = `<span class="result-icon">◈</span><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(explanation)}</p></div>`;
}

function addChatMessage(text, role) {
  const msg = document.createElement("div");
  msg.className = `message ${role === "user" ? "user-message" : "bot-message"}`;
  const name = document.createElement("strong");
  name.textContent = role === "user" ? (state.name || "You") : "Forge Companion";
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  msg.append(name, paragraph);
  $("#chatMessages").appendChild(msg);
  $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
}

function assistantReply(question) {
  const q = question.toLowerCase();

  if (q.includes("study plan") || q.includes("schedule") || q.includes("7-day") || q.includes("7 day")) {
    return "Here's a beginner-friendly 7-day plan:\n\nDay 1: Choose one learning goal and learn the basics.\nDay 2: Review your notes and practise one example.\nDay 3: Learn a new concept and explain it in your own words.\nDay 4: Complete a small hands-on activity.\nDay 5: Revise the topics that felt difficult.\nDay 6: Build a mini-project or solve a practice question.\nDay 7: Review your progress and plan the next week.\n\nAdjust the time to fit your college schedule.";
  }
  if (q.includes("quantum") || q.includes("qubit") || q.includes("superposition")) {
    return "Quantum computing uses quantum systems to process information. A classical bit is 0 or 1, while a qubit can be in a superposition of |0⟩ and |1⟩. Quantum gates change the state, and measurement gives a classical result. Start with qubits, then learn X and Hadamard gates in the Quantum Lab!";
  }
  if (q.includes("python") || q.includes("coding") || q.includes("program")) {
    return "Let's practise Python! Try this:\n\nname = input('What is your name? ')\nprint('Hello,', name)\n\nThis uses input() to read text and print() to display a message. Next, try storing a number in a variable and using an if statement. Would you like a beginner exercise or an explanation of variables?";
  }
  if (q.includes("career") || q.includes("skill") || q.includes("job")) {
    return "Build your skills step by step: practise programming, create small projects, document what you learn, and share your work in a portfolio. Communication and teamwork matter too. Choose one skill for this week and create a small, finished project to demonstrate it.";
  }
  if (q.includes("machine learning") || q.includes(" ml ") || q.includes("artificial intelligence") || q.includes(" ai ")) {
    return "Machine learning is a way to fit a model to examples so it can make predictions. Learn the workflow: prepare data, split it into training and test sets, train a model, evaluate its results, and check for bias. Our demo doesn't train a real ML model yet, but the Resource Library links to a learning course.";
  }
  if (q.includes("motivat") || q.includes("focus") || q.includes("procrastinat")) {
    return "Try the smallest possible start: choose one task, set a 5-minute timer, and put distractions aside. You don't have to finish everything at once. After five minutes, decide whether to continue or take a short break. Consistency matters more than a perfect routine.";
  }
  return "Good question! I can help with quantum computing, Python basics, machine learning concepts, study planning and career skills. Try asking me to explain a topic in simple words or create a study plan. This demo assistant uses prepared responses rather than a live AI model.";
}

function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Voice recognition isn't supported by this browser. Try a recent version of Chrome or Edge.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = state.language === "ta" ? "ta-IN" : state.language === "hi" ? "hi-IN" : "en-IN";
  recognition.interimResults = false;
  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    setPage("assistant");
    $("#chatInput").value = transcript;
    $("#chatForm").requestSubmit();
  };
  recognition.onerror = () => alert("Voice input couldn't be completed. Check microphone permission and try again.");
  recognition.start();
}

function renderTimer() {
  const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, "0");
  const seconds = (timerSeconds % 60).toString().padStart(2, "0");
  $("#timerDisplay").textContent = `${minutes}:${seconds}`;
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  $("#timerStart").textContent = "Start";
}

function init() {
  setupVisit();
  renderDashboard();
  renderCourses();
  updateMilestones();
  renderTimer();
  updateQuantum();

  $$(".nav-btn[data-page]").forEach(btn => {
    btn.addEventListener("click", () => setPage(btn.dataset.page));
  });

  $$("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => setPage(btn.dataset.goto));
  });

  $("#headerStart").addEventListener("click", () => setPage("learn"));
  $("#courseSearch").addEventListener("input", renderCourses);
  $("#categoryFilter").addEventListener("change", renderCourses);

  $("#courseGrid").addEventListener("click", event => {
    const btn = event.target.closest("[data-course]");
    if (btn) openCourse(btn.dataset.course);
  });

  $("#gateSelect").addEventListener("change", updateQuantum);
  $("#runCircuit").addEventListener("click", updateQuantum);
  $("#resetCircuit").addEventListener("click", () => {
    $("#gateSelect").value = "I";
    updateQuantum();
  });
  $("#completeQuantum").addEventListener("click", () => completeLesson("quantum-intro"));

  $("#checkQuiz").addEventListener("click", () => {
    const answer = $('input[name="pythonQuiz"]:checked');
    const feedback = $("#quizFeedback");
    if (!answer) {
      feedback.textContent = "Choose an answer first.";
      return;
    }
    if (answer.value === "B") {
      feedback.textContent = "Correct! print() displays output in Python. +10 XP!";
      if (!state.completed.includes("python-quiz")) {
        state.completed.push("python-quiz");
        state.xp += 10;
        saveState();
        renderDashboard();
        updateMilestones();
      }
    } else {
      feedback.textContent = "Not quite. The correct command is print('Hello'). Try again!";
    }
  });

  $$("[data-minutes]").forEach(btn => btn.addEventListener("click", () => {
    stopTimer();
    timerSeconds = Number(btn.dataset.minutes) * 60;
    renderTimer();
  }));

  $("#timerStart").addEventListener("click", () => {
    if (timerInterval) {
      stopTimer();
      return;
    }
    $("#timerStart").textContent = "Pause";
    timerInterval = setInterval(() => {
      timerSeconds--;
      renderTimer();
      if (timerSeconds <= 0) {
        stopTimer();
        timerSeconds = 0;
        renderTimer();
        state.minutes += 5;
        saveState();
        renderDashboard();
        alert("Focus session complete! Take a short break.");
      }
    }, 1000);
  });

  $("#timerReset").addEventListener("click", () => {
    stopTimer();
    timerSeconds = 300;
    renderTimer();
  });

  $("#chatForm").addEventListener("submit", event => {
    event.preventDefault();
    const input = $("#chatInput");
    const question = input.value.trim();
    if (!question) return;
    addChatMessage(question, "user");
    input.value = "";
    addChatMessage(assistantReply(question), "bot");
  });

  $$(".suggestion-chips button").forEach(btn => btn.addEventListener("click", () => {
    $("#chatInput").value = btn.dataset.prompt;
    $("#chatForm").requestSubmit();
  }));

  $("#clearChat").addEventListener("click", () => {
    $("#chatMessages").replaceChildren();
    addChatMessage("Chat cleared! What would you like to learn next?", "bot");
  });

  $("#voiceBtn").addEventListener("click", startVoice);

  $("#saveSettings").addEventListener("click", () => {
    const newName = $("#nameInput").value.trim();
    state.name = newName || "Student";
    state.language = $("#languageSelect").value;
    saveState();
    renderDashboard();
    $("#settingsFeedback").textContent = "Preferences saved successfully in this browser.";
  });

  $("#resetData").addEventListener("click", () => {
    if (!confirm("Reset your saved learning progress and preferences? This cannot be undone.")) return;
    stopTimer();
    localStorage.removeItem(STORAGE_KEY);
    state = { ...defaultState };
    setupVisit();
    renderDashboard();
    renderCourses();
    updateMilestones();
    $("#nameInput").value = "";
    $("#languageSelect").value = "en";
    $("#settingsFeedback").textContent = "Demo progress has been reset.";
  });

  $("#nameInput").value = state.name === "Student" ? "" : state.name;
  $("#languageSelect").value = state.language;
}

init();
