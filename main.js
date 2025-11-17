// ===== Firebase Setup =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, signInAnonymously } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// 🔑 Firebase config (replace with your project values)
const firebaseConfig = {
  apiKey: "AIzaSyCBu3DKRG_EJm_oAL-QRR90_GtbCcgzx18",
  authDomain: "neurotap-45959.firebaseapp.com",
  projectId: "neurotap-45959",
  storageBucket: "neurotap-45959.appspot.com",   // ✅ fixed
  messagingSenderId: "196532187132",
  appId: "1:196532187132:web:5358da6ade0ddfa8becc79",
  measurementId: "G-90C3HCK534"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign in anonymously
(async () => {
  try {
    await signInAnonymously(auth);
    console.log("Signed in anonymously");
  } catch (err) {
    console.error("Auth failed:", err);
  }
})();

// ===== UI Elements =====
const chatBox = document.getElementById("chat-box");
const inputEl = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const usernameInput = document.getElementById("username");
const toneDisplay = document.getElementById("tone-display");
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

// ===== Tone Lexicon =====
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

// ===== Safe Username =====
function getSafeUserName() {
  const name = usernameInput.value?.trim();
  return name && name.length > 0 ? name : "New User";
}

// ===== Messaging =====
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  const tone = classifyTone(text);

  try {
    await addDoc(collection(db, "messages"), {
      threadId: "demo-thread",
      senderId: getSafeUserName(),
      text,
      tone: tone.tone,
      createdAt: serverTimestamp()
    });
    console.log("Message saved:", text);
  } catch (err) {
    console.error("Message save failed:", err);
  }

  tagsEl.textContent = tone.neurotransmitters.join(", ");
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
    div.innerHTML = `<strong>${m.senderId}:</strong> ${m.text}<br/><em>Tone:</em> ${m.tone || "neutral"}`;
    chatBox.appendChild(div);
  });
}

// ===== Event Listeners =====
sendBtn.addEventListener("click", sendMessage);
groupAlertBtn.addEventListener("click", async () => {
  const alertMsg = `${getSafeUserName()} triggered a group alert!`;
  await addDoc(collection(db, "alerts"), {
    threadId: "demo-thread",
    user: getSafeUserName(),
    message: alertMsg,
    createdAt: serverTimestamp()
  });
});
clearHistoryBtn.addEventListener