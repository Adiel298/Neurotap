// ====== Neurotap Main.js ======

// ====== UI Elements ======
const ui = {
  chatBox: document.getElementById("chat-box"),
  input: document.getElementById("message-input"),
  sendBtn: document.getElementById("send-btn"),
  tags: document.getElementById("tags-list"),
  history: document.getElementById("history-list"),
  clearHistoryBtn: document.getElementById("clear-history-btn"),
  rephraseInput: document.getElementById("rephrase-input"),
  rephraseBtn: document.getElementById("rephrase-btn"),
  rephraseOutput: document.getElementById("rephrase-output"),
  usernameInput: document.getElementById("username"),
  toneDisplay: document.getElementById("tone-display"),
  zones: {
    amygdala: document.getElementById("amygdala"),
    pfc: document.getElementById("pfc"),
    hippocampus: document.getElementById("hippocampus"),
    acc: document.getElementById("acc"),
  }
};

// ====== Tone Lexicon ======
const toneLexicon = [
  { tone: "empathy", keywords: ["sorry","thank you","appreciate","forgive"], zones: ["acc","hippocampus"], neurotransmitters: ["oxytocin","serotonin"], color: "#6cc" },
  { tone: "anger", keywords: ["angry","hate","annoyed","furious"], zones: ["amygdala"], neurotransmitters: ["adrenaline","cortisol"], color: "#e66" },
  { tone: "focus", keywords: ["study","focus","discipline","practice"], zones: ["pfc"], neurotransmitters: ["dopamine"], color: "#6c6" },
  { tone: "joy", keywords: ["happy","excited","great","love"], zones: ["pfc","hippocampus"], neurotransmitters: ["dopamine","serotonin"], color: "#fc6" },
  { tone: "neutral", keywords: [], zones: ["pfc"], neurotransmitters: ["baseline"], color: "#bbb" },
];

function classifyTone(text) {
  const lower = text.toLowerCase();
  for (const item of toneLexicon) {
    if (item.keywords.some(k => lower.includes(k))) return item;
  }
  return toneLexicon.find(x => x.tone === "neutral");
}

// ====== Brain Zones ======
function clearZones() {
  Object.values(ui.zones).forEach(z => z.classList.remove("active"));
}
function stimulateZones(zoneIds) {
  clearZones();
  zoneIds.forEach(id => ui.zones[id]?.classList.add("active"));
}

// ====== Neurotransmitters ======
function showNeuroTags(tags) {
  ui.tags.textContent = tags.join(", ");
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
  ui.history.innerHTML = "";
  loadHistory().slice().reverse().forEach(item => {
    const li = document.createElement("li");
    li.setAttribute("data-tone", item.tone);
    li.innerHTML = `<strong>${item.tone}</strong> — ${item.text}
      <span class="meta">(${new Date(item.ts).toLocaleString()})</span>`;
    ui.history.appendChild(li);
  });
}
ui.clearHistoryBtn?.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

// ====== Safe Username Helper ======
function getSafeUserName() {
  const name = ui.usernameInput.value?.trim();
  return name && name.length > 0 ? name : "New User";
}

// ====== Rephraser ======
function rephrase(text) {
  if (!text) return "";
  let s = text.trim();
  const replacements = {
    hate: "really dislike", angry: "frustrated", furious: "very upset",
    fools: "unwise person", stupid: "not very thoughtful", idiot: "uninformed person",
    dumb: "misguided", loser: "struggling person", lazy: "unmotivated",
    bad: "not ideal", worthless: "not appreciated", pathetic: "in need of support",
    weak: "still developing"
  };
  for (const [key, val] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    s = s.replace(regex, val);
  }
  if (/\b(you|your)\b/i.test(s) && /\bwrong|lazy|bad|stupid|idiot|fool|pathetic|worthless\b/i.test(s)) {
    return "Consider rephrasing more constructively.";
  }
  return s;
}
ui.rephraseBtn.addEventListener("click", () => {
  ui.rephraseOutput.textContent = rephrase(ui.rephraseInput.value);
});

// ====== Stream Chat Integration ======
const { StreamChat } = window.StreamChat; // CDN version
const client = StreamChat.getInstance("bmj58rf72vts"); // your API key

async function initStream() {
  await client.connectUser(
    { id: getSafeUserName(), name: getSafeUserName() },
    client.devToken(getSafeUserName()) // devToken is fine for testing
  );

  const channel = client.channel("messaging", "neurotap-channel", {
    name: "Neurotap Conversation",
    members: [getSafeUserName()]
  });
  await channel.watch();

  channel.on("message.new", event => {
    const text = event.message.text;
    const tone = classifyTone(text);
    stimulateZones(tone.zones);
    showNeuroTags(tone.neurotransmitters);
    saveHistory({ text, tone: tone.tone, color: tone.color, ts: Date.now() });
    renderHistory();
    if (ui.toneDisplay) {
      ui.toneDisplay.textContent = `Tone: ${tone.tone}`;
      ui.toneDisplay.style.color = tone.color;
    }
    console.log("[Neurotap] Tone detected:", tone.tone);
  });

  ui.sendBtn.addEventListener("click", async () => {
    const text = ui.input.value.trim();
    if (!text) return;
    const rudeWords = ["hate","fools","stupid","idiot","dumb","loser","lazy","bad","worthless","pathetic","weak"];
    if (rudeWords.some(w => text.toLowerCase().includes(w))) {
      alert("⚠️ Please rephrase using the Rephraser.");
      ui.rephraseOutput.textContent = rephrase(text);
      return;
    }
    await channel.sendMessage({ text });
    ui.input.value = "";
  });
}
initStream();
