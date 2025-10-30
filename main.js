// ====== Utility ======
const chatBox = document.getElementById("chat-box");
const inputEl = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const usernameEl = document.getElementById("username");
const tagsEl = document.getElementById("tags-list");
const historyList = document.getElementById("history-list");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const translateBtn = document.getElementById("translate-btn");
const langSelect = document.getElementById("lang-select");
const translationOutput = document.getElementById("translation-output");
const rephraseInput = document.getElementById("rephrase-input");
const rephraseBtn = document.getElementById("rephrase-btn");
const rephraseOutput = document.getElementById("rephrase-output");
const groupAlertBtn = document.getElementById("group-alert-btn");

const zones = {
  amygdala: document.getElementById("amygdala"),
  pfc: document.getElementById("pfc"),
  hippocampus: document.getElementById("hippocampus"),
  acc: document.getElementById("acc"),
};

// Keep last message in memory for translation.
let lastMessage = "";

// ====== Tone model (simple starter) ======
const toneLexicon = [
  { tone: "empathy", keywords: ["sorry", "thank you", "appreciate", "forgive"], zones: ["acc","hippocampus"], neurotransmitters: ["oxytocin","serotonin"], color: "#6cc" },
  { tone: "anger", keywords: ["angry","hate","annoyed","furious"], zones: ["amygdala"], neurotransmitters: ["adrenaline","cortisol"], color: "#e66" },
  { tone: "focus", keywords: ["study","focus","discipline","practice"], zones: ["pfc"], neurotransmitters: ["dopamine"], color: "#6c6" },
  { tone: "joy", keywords: ["happy","excited","great","love"], zones: ["pfc","hippocampus"], neurotransmitters: ["dopamine","serotonin"], color: "#fc6" },
  { tone: "neutral", keywords: [], zones: ["pfc"], neurotransmitters: ["baseline"], color: "#bbb" },
];

function classifyTone(text) {
  const t = text.toLowerCase();
  for (const item of toneLexicon) {
    if (item.keywords.some(k => t.includes(k))) return item;
  }
  return toneLexicon.find(x => x.tone === "neutral");
}

// ====== Brain zone stimulation ======
function clearZones() {
  Object.values(zones).forEach(z => z.classList.remove("active"));
}
function stimulateZones(zoneIds) {
  clearZones();
  zoneIds.forEach(id => zones[id]?.classList.add("active"));
}

// ====== Neurotransmitter tags ======
function showNeuroTags(tags) {
  tagsEl.textContent = tags.join(", ");
}

// ====== Tone history dashboard (localStorage) ======
const HISTORY_KEY = "neurotap_history";

function loadHistory() {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveHistory(entry) {
  const hist = loadHistory();
  hist.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
}
function renderHistory() {
  historyList.innerHTML = "";
  const hist = loadHistory();
  hist.slice().reverse().forEach(item => {
    const li = document.createElement("li");
    li.style.borderLeftColor = item.color || "#bbb";
    li.innerHTML = `<strong>${item.tone}</strong> — ${item.text} <span class="meta">(${new Date(item.ts).toLocaleString()})</span>`;
    historyList.appendChild(li);
  });
}
clearHistoryBtn?.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

// ====== Chat send ======
function sendMessage() {
  const user = (usernameEl.value || "You").trim();
  const text = inputEl.value.trim();
  if (!text) return;
  lastMessage = text;

  // Classify tone
  const tone = classifyTone(text);

  // Brain zones + neurotransmitters
  stimulateZones(tone.zones);
  showNeuroTags(tone.neurotransmitters);

  // Render chat message
  const msgEl = document.createElement("div");
  msgEl.className = "message";
  msgEl.style.borderLeftColor = tone.color;
  msgEl.innerHTML = `<div><strong>${user}:</strong> ${text}</div><div class="meta">tone: ${tone.tone}</div>`;
  chatBox.appendChild(msgEl);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Save to history
  saveHistory({ text, tone: tone.tone, color: tone.color, ts: Date.now() });
  renderHistory();

  // Clear input
  inputEl.value = "";
}
sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

// ====== Global translation mode (demo using LibreTranslate public API) ======
// Note: for production, host your own instance or use a paid API. Public endpoints can be rate-limited.
async function translateLastMessage() {
  if (!lastMessage) {
    translationOutput.textContent = "No message to translate.";
    return;
  }
  const target = langSelect.value || "es";
  translationOutput.textContent = "Translating…";
  try {
    const res = await fetch("https://translate.astian.org/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: lastMessage, source: "auto", target, format: "text" }),
    });
    const data = await res.json();
    translationOutput.textContent = data.translatedText || "(no result)";
  } catch (err) {
    translationOutput.textContent = "Translation failed. Try again or configure a stable API.";
  }
}
translateBtn.addEventListener("click", translateLastMessage);

// ====== Rephraser (rule-based starter) ======
function rephrase(text) {
  if (!text) return "";
  let s = text.trim();

  // soften harsh words
  s = s.replace(/\bhate\b/gi, "really dislike");
  s = s.replace(/\bangry\b/gi, "frustrated");
  s = s.replace(/\bfurious\b/gi, "very upset");

  // add empathy scaffolding if confrontational
  if (/\b(you|your)\b/i.test(s) && /\bwrong|lazy|bad\b/i.test(s)) {
    s = "I might be missing context, but " + s.replace(/\b(you|your)\b/gi, "this").replace(/\bwrong|lazy|bad\b/gi, "not ideal");
  }

  // clarity improvements
  s = s.replace(/\bi think\b/gi, "I believe");
  s = s.replace(/\bvery\b/gi, "quite");

  // add positive close
  if (!/[.!?]$/.test(s)) s += ".";
  s += " Thanks for understanding.";
  return s;
}

rephraseBtn.addEventListener("click", () => {
  const txt = rephraseInput.value.trim();
  if (!txt) { rephraseOutput.textContent = "Enter a sentence to rephrase."; return; }
  rephraseOutput.textContent = rephrase(txt);
});

// ====== Group chat alert (demo) ======
// In production: use Firebase Auth + Firestore to store messages and emit alerts to all connected users.
groupAlertBtn.addEventListener("click", () => {
  const user = (usernameEl.value || "Someone").trim();
  const alertMsg = `${user} sent a group alert — reset, breathe, and refocus (30s).`;
  const msgEl = document.createElement("div");
  msgEl.className = "message";
  msgEl.style.borderLeftColor = "#6aa0ff";
  msgEl.innerHTML = `<div><strong>ALERT:</strong> ${alertMsg}</div><div class="meta">ritual: reset</div>`;
  chatBox.appendChild(msgEl);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Log alert in history
  saveHistory({ text: alertMsg, tone: "alert", color: "#6aa0ff", ts: Date.now() });
  renderHistory();

  // Optional: visual brain cue for collective regulation
  stimulateZones(["acc","pfc"]);
  showNeuroTags(["serotonin","dopamine"]);
});

// ====== Initialize ======
renderHistory();
