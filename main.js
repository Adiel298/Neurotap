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

// ====== Send Message (local tone + history) ======
function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  lastMessage = text;
  const tone = classifyTone(text);

  stimulateZones(tone.zones);
  showNeuroTags(tone.neurotransmitters);

  saveHistory({ text, tone: tone.tone, color: tone.color, ts: Date.now() });
  renderHistory();

  inputEl.value = "";

  console.log("[Neurotap] Message processed locally:", { text, tone: tone.tone });
}
sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

// ====== Translation ======
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
      body: JSON.stringify({
        q: lastMessage,
        source: "auto",
        target,
        format: "text"
      }),
    });

    if (!res.ok) throw new Error(`Translation API error: ${res.status}`);

    const data = await res.json();
    translationOutput.textContent = data.translatedText || "(no result)";
  } catch (err) {
    console.error("Translation failed:", err);
    translationOutput.textContent = "Translation failed. Please try again.";
  }
}
translateBtn.addEventListener("click", translateLastMessage);

// ====== Rephraser ======
function rephrase(text) {
  if (!text) return "";
  let s = text.trim();
  s = s.replace(/\bhate\b/gi, "really dislike");
  s = s.replace(/\bangry\b/gi, "frustrated");
  s = s.replace(/\bfurious\b/gi, "very upset");
  if (/\b(you|your)\b/i.test(s) && /\bwrong|lazy|bad\b/i.test(s)) {
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

// ====== TalkJS Integration ======
Talk.ready.then(() => {
  const APP_ID = "taYrlEsd"; // your real TalkJS App ID

  const me = new Talk.User({
    id: getSafeUserName(),
    name: getSafeUserName(),
    email: `${getSafeUserName().toLowerCase()}@example.com`,
    photoUrl: "https://demo.talkjs.com/img/avatar-1.jpg",
    role: "default"
  });

  const other = new Talk.User({
    id: "guest",
    name: "Guest",
    email: "guest@example.com",
    photoUrl: "https://demo.talkjs.com/img/avatar-2.jpg",
    role: "default"
  });

  const session = new Talk.Session({ appId: APP_ID, me });

  const conversation = session.getOrCreateConversation("neurotap-convo");
  conversation.setParticipant(me);
  conversation.setParticipant(other);

  const inbox = session.createInbox({ selected: conversation });
  inbox.mount(chatBox);
});
