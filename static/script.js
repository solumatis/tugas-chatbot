/* =========================================================
   EduBot — UI Logic v2
   ========================================================= */

const messagesEl   = document.getElementById("messages");
const textareaEl   = document.getElementById("input");
const chatForm     = document.getElementById("chatForm");
const sendBtn      = document.getElementById("sendBtn");
const resetBtn     = document.getElementById("resetBtn");
const newChatBtn   = document.getElementById("newChatBtn");
const themeToggle  = document.getElementById("themeToggle");
const themeIcon    = themeToggle.querySelector(".theme-icon");
const suggestions  = document.getElementById("suggestions");
const sidebar      = document.querySelector(".sidebar");
const menuBtn      = document.getElementById("menuBtn");
const overlay      = document.getElementById("overlay");
const navItems     = document.querySelectorAll(".nav-item");
const charCounter  = document.getElementById("charCounter");

const MAX_LEN = 2000;

/* =========================================================
   THEME
   ========================================================= */
const savedTheme = localStorage.getItem("edubot-theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);
themeIcon.textContent = savedTheme === "dark" ? "☀️" : "🌙";

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  themeIcon.textContent = next === "dark" ? "☀️" : "🌙";
  localStorage.setItem("edubot-theme", next);
});

/* =========================================================
   TEXTAREA AUTO-EXPAND
   ========================================================= */
function autoResize() {
  textareaEl.style.height = "auto";
  const maxH = 180;
  const newH = Math.min(textareaEl.scrollHeight, maxH);
  textareaEl.style.height = newH + "px";
  textareaEl.style.overflowY =
    textareaEl.scrollHeight > maxH ? "auto" : "hidden";
}

function updateCounter() {
  const len = textareaEl.value.length;
  charCounter.textContent = `${len} / ${MAX_LEN}`;
  charCounter.classList.remove("warn", "danger");
  if (len > MAX_LEN * 0.9) charCounter.classList.add("danger");
  else if (len > MAX_LEN * 0.75) charCounter.classList.add("warn");
}

textareaEl.addEventListener("input", () => {
  autoResize();
  updateCounter();
});

// Init
autoResize();
updateCounter();

/* =========================================================
   MARKDOWN-LITE RENDERER
   ========================================================= */
function renderMarkdown(text) {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h3>$1</h3>");

  html = html.replace(/^\s*[-•] (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  html = html.replace(/<\/ul>\s*<ul>/g, "");

  html = html.replace(/^\s*\d+\.\s+(.+)$/gm, "<li>$1</li>");

  html = html
    .split(/\n{2,}/)
    .map((block) =>
      /^\s*<(ul|ol|li|h3|p)/.test(block.trim())
        ? block
        : `<p>${block.replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  return html;
}

/* =========================================================
   ADD MESSAGE
   ========================================================= */
function tambahPesan(teks, kelas, isTyping = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `msg ${kelas}`;

  const avatarEmoji = kelas === "user" ? "🧑" : "🎓";
  wrapper.innerHTML = `
    <div class="msg-avatar">${avatarEmoji}</div>
    <div class="msg-content">
      <div class="bubble ${isTyping ? "typing-bubble" : ""}">
        ${isTyping ? "<span></span><span></span><span></span>" : renderMarkdown(teks)}
      </div>
    </div>
  `;

  messagesEl.appendChild(wrapper);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrapper;
}

/* =========================================================
   SEND MESSAGE
   ========================================================= */
async function kirimPesan(teksOverride = null) {
  const pesan = (teksOverride ?? textareaEl.value).trim();
  if (!pesan) return;

  if (suggestions) suggestions.style.display = "none";

  tambahPesan(pesan, "user");

  // Reset textarea
  textareaEl.value = "";
  autoResize();
  updateCounter();

  sendBtn.disabled = true;
  textareaEl.focus();

  const typing = tambahPesan("", "bot", true);

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: pesan }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    typing.querySelector(".bubble").classList.remove("typing-bubble");
    typing.querySelector(".bubble").innerHTML = renderMarkdown(data.reply);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (err) {
    typing.querySelector(".bubble").classList.remove("typing-bubble");
    typing.querySelector(".bubble").innerHTML =
      renderMarkdown("⚠️ **Koneksi gagal.** Coba lagi ya!");
  } finally {
    sendBtn.disabled = false;
    textareaEl.focus();
  }
}

/* =========================================================
   EVENTS
   ========================================================= */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  kirimPesan();
});

// Enter = kirim, Shift+Enter = baris baru
textareaEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    kirimPesan();
  }
});

// Suggestion chips
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    kirimPesan(chip.dataset.msg);
  });
});

// Sidebar topik → prefill prompt
navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navItems.forEach((n) => n.classList.remove("active"));
    item.classList.add("active");
    const topik = item.dataset.topik;
    textareaEl.value = `Jelaskan konsep dasar ${topik} untuk pemula`;
    autoResize();
    updateCounter();
    textareaEl.focus();
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
  });
});

// Reset chat
async function resetChat() {
  try {
    await fetch("/reset", { method: "POST" });
    messagesEl.innerHTML = "";
    tambahPesan(
      "Percakapan baru dimulai! 🚀\n\nMau belajar apa hari ini?",
      "bot"
    );
    if (suggestions) suggestions.style.display = "flex";
  } catch {
    /* silent */
  }
}

resetBtn.addEventListener("click", resetChat);
newChatBtn.addEventListener("click", resetChat);

/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */
menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("active");
});
overlay.addEventListener("click", () => {
  sidebar.classList.remove("open");
  overlay.classList.remove("active");
});

/* =========================================================
   SHORTCUTS
   ========================================================= */
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    textareaEl.focus();
  }
  if (e.key === "Escape") {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
  }
});

/* =========================================================
   RIPPLE EFFECT PADA TOMBOL KIRIM
   ========================================================= */
sendBtn.addEventListener("click", (e) => {
  const rect = sendBtn.getBoundingClientRect();
  const ripple = document.createElement("span");
  const size = Math.max(rect.width, rect.height);
  ripple.className = "ripple";
  ripple.style.width = ripple.style.height = size + "px";
  ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
  ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
  sendBtn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
});

/* =========================================================
   AUTO FOCUS
   ========================================================= */
window.addEventListener("load", () => {
  textareaEl.focus();
});
