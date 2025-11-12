// ====== UI Elements ======
const chatBox = document.getElementById("chat-box");
const inputEl = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
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
const usernameInput = document.getElementById("username");
const toneDisplay = document.getElementById("tone-display");

const zones = {
  amygdala: document.getElementById("amygdala"),
  pfc: document.getElementById("pfc"),
  hippocampus: document.getElementById("hippocampus"),
  acc: document.getElementById("acc"),
};

let lastMessage = "";

// ====== Tone Model ======
const toneLexicon = [
  { tone: "empathy", keywords: ["sorry","thank you","appreciate","forgive"], zones: ["acc","hippocampus"], neurotransmitters: ["oxytocin","serotonin"], color: "#6cc" },
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

// ====== Brain Zones ======
function clearZones() {
  Object.values(zones).forEach(z => z.classList.remove("active"));
}
function stimulateZones(zoneIds) {
  clearZones();
  zoneIds.forEach(id => zones[id]?.classList.add("active"));
}

// ====== Neurotransmitters ======
function showNeuroTags(tags) {
  tagsEl.textContent = tags.join(", ");
}

// ====== History Dashboard ======
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
  loadHistory().slice().reverse().forEach(item => {
    const li = document.createElement("li");
    li.setAttribute("data-tone", item.tone);
    li.innerHTML = `
      <strong>${item.tone}</strong> — ${item.text}
      <span class="meta">(${new Date(item.ts).toLocaleString()})</span>
    `;
    historyList.appendChild(li);
  });
}
clearHistoryBtn?.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

// ====== Safe Username Helper ======
function getSafeUserName() {
  const name = usernameInput.value?.trim();
  return name && name.length > 0 ? name : "New User";
}

// ====== Rephraser ======
function rephrase(text) {
  if (!text) return "";
  let s = text.trim();

  // Anger / Harsh emotions
  s = s.replace(/\bhate\b/gi, "really dislike");
  s = s.replace(/\bangry\b/gi, "frustrated");
  s = s.replace(/\bfurious\b/gi, "very upset");

  // Insults
  s = s.replace(/\bfool(s)?\b/gi, "unwise person");
  s = s.replace(/\bstupid\b/gi, "not very thoughtful");
  s = s.replace(/\bidiot(s)?\b/gi, "uninformed person");
  s = s.replace(/\bdumb\b/gi, "misguided");
  s = s.replace(/\bloser\b/gi, "struggling person");

  // Dismissive / Harsh negatives
  s = s.replace(/\blazy\b/gi, "unmotivated");
  s = s.replace(/\bbad\b/gi, "not ideal");
  s = s.replace(/\bworthless\b/gi, "not appreciated");
  s = s.replace(/\bpathetic\b/gi, "in need of support");
  s = s.replace(/\bweak\b/gi, "still developing");

  // Pattern check for direct attacks
  if (/\b(you|your)\b/i.test(s) && /\bwrong|lazy|bad|stupid|idiot|fool|pathetic|worthless\b/i.test(s)) {
    s = "Consider rephrasing more constructively.";
  }

  return s;
}
rephraseBtn.addEventListener("click", () => {
  const text = rephraseInput.value.trim();
  rephraseOutput.textContent = rephrase(text) || "(no result)";
});

// ====== Group Alert ======
groupAlertBtn.addEventListener("click", () => {
  const alertMsg = `${getSafeUserName()} triggered a group alert!`;
  console.log("[Neurotap] Group alert triggered:", alertMsg);
});

// ====== Stream Chat Integration ======
import { StreamChat } from "stream-chat";

// ⚠️ Replace with your real API key from Stream dashboard
const client = StreamChat.getInstance("bmj58rf72vts");

async function initStream() {
  // Connect user with devToken (works in development mode)
  await client.connectUser(
    { id: getSafeUserName(), name: getSafeUserName() },
    client.devToken(getSafeUserName())
  );

  // Create or join channel
  const channel = client.channel("messaging", "neurotap-channel", {
    name: "Neurotap Conversation",
    members: [getSafeUserName()]
  });
  await channel.watch();

  // Listen for new messages
  channel.on("message.new", event => {
    const text = event.message.text;
    const tone = classifyTone(text);

    stimulateZones(tone.zones);
    showNeuroTags(tone.neurotransmitters);
    saveHistory({ text, tone: tone.tone, color: tone.color, ts: Date.now() });
    renderHistory();

    if (toneDisplay) {
      toneDisplay.textContent = `Tone: ${tone.tone}`;
      toneDisplay.style.color = tone.color;
    }

    console.log("[Neurotap] Tone detected from Stream message:", tone.tone);
  });

  // Send button handler with rude-word filter
  sendBtn.addEventListener("click", async () => {
    const text = inputEl.value.trim();
    if (!text) return;

    const rudeWords = ["hate","fools","stupid","idiot","dumb","loser","lazy","bad","worthless","pathetic","weak"];
    if (rudeWords.some(w => text.toLowerCase().includes(w))) {
      alert("⚠️ Please rephrase using the Rephraser.");
      rephraseOutput.textContent = rephrase(text);
      return;
    }

    await channel.sendMessage({ text });
    inputEl.value = "";
  });
}

initStream();
