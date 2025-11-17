// ====== Firebase Setup ======
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInAnonymously } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// 🔑 Your Firebase config (neurotap-c9649 project)
const firebaseConfig = {
  apiKey: "AIzaSyA4krwLdtZ1axVU9ioM7WutZqtUbJEN6Gg",
  authDomain: "neurotap-c9649.firebaseapp.com",
  databaseURL: "https://neurotap-c9649-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "neurotap-c9649",
  storageBucket: "neurotap-c9649.firebasestorage.app",
  messagingSenderId: "505876683169",
  appId: "1:505876683169:web:3b3923533f5cbe7f6a93e0",
  measurementId: "G-K9ZDJT2HWN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
await signInAnonymously(auth);

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

  // Replace harsh words
  s = s.replace(/\bhate\b/gi, "really dislike")
       .replace(/\bangry\b/gi, "frustrated")
       .replace(/\bfurious\b/gi, "very upset")
       .replace(/\bfool(s)?\b/gi, "unwise person")
       .replace(/\bstupid\b/gi, "not very thoughtful")
       .replace(/\bidiot(s)?\b/gi, "uninformed person")
       .replace(/\bdumb\b/gi, "misguided")
       .replace(/\bloser\b/gi, "struggling person")
       .replace(/\blazy\b/gi, "unmotivated")
       .replace(/\bbad\b/gi, "not ideal")
       .replace(/\bworthless\b/gi, "not appreciated")
       .replace(/\bpathetic\b/gi, "in need of support")
       .replace(/\bweak\b/gi, "still developing");

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
groupAlertBtn.addEventListener("click", async () => {
  const alertMsg = `${getSafeUserName()} triggered a group alert!`;
  console.log("[Neurotap] Group alert triggered:", alertMsg);

  await addDoc(collection(db, "alerts"), {
    threadId: "demo-thread",
    user: getSafeUserName(),
    message: alertMsg,
    createdAt: serverTimestamp()
  });
});

// ====== Messaging with Firebase ======
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  const tone = classifyTone(text);

  await addDoc(collection(db, "messages"), {
    threadId: "demo-thread",
    senderId: getSafeUserName(),
    text,
    tone,
    createdAt: serverTimestamp()
  });

  stimulateZones(tone.zones);
  showNeuroTags(tone.neurotransmitters);
  saveHistory({ text, tone: tone.tone, color: tone.color, ts: Date.now() });
  renderHistory();

  toneDisplay.textContent = `Tone: ${tone.tone}`;
  toneDisplay.style.color = tone.color;

  inputEl.value = "";
  await refreshMessages();
}

async function refreshMessages() {
  const mq = query(collection(db, "messages"), where("threadId", "==", "demo-thread"), orderBy("createdAt", "desc"));
  const snap = await getDocs(mq);
  chatBox.innerHTML = "";
  snap.forEach(doc => {
    const m = doc.data();
    const div = document.createElement("div");
    div.style.borderBottom = "1px solid #ddd";
    div.style.padding = "6px";
    div.innerHTML = `<strong>${m.senderId}:</strong> ${m.text}<br/><em>Tone:</em> ${m.tone?.tone || "neutral"}`;
    chatBox.appendChild(div);
  });
}

sendBtn.addEventListener