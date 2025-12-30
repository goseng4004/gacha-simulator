/* ---------- DOM ---------- */
const itemName = document.getElementById("itemName");
const itemRate = document.getElementById("itemRate");
const userName = document.getElementById("userName");
const drawCount = document.getElementById("drawCount");
const itemList = document.getElementById("itemList");
const logArea = document.getElementById("logArea");
const statsArea = document.getElementById("statsArea");

/* ---------- 데이터 ---------- */
let items = JSON.parse(localStorage.getItem("gachaItems")) || [];
let logs = JSON.parse(localStorage.getItem("gachaLogs")) || {};
let selectedIndex = null;

/* ---------- 저장 ---------- */
const saveItems = () =>
  localStorage.setItem("gachaItems", JSON.stringify(items));
const saveLogs = () =>
  localStorage.setItem("gachaLogs", JSON.stringify(logs));

/* ---------- 상품 ---------- */
function renderItems() {
  itemList.innerHTML = "";
  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.rate}%)`;
    li.onclick = () => {
      selectedIndex = i;
      itemName.value = item.name;
      itemRate.value = item.rate;
      renderItems();
    };
    itemList.appendChild(li);
  });
}

function addItem() {
  if (!itemName.value || itemRate.value <= 0) return;
  items.push({ name: itemName.value, rate: Number(itemRate.value) });
  saveItems();
  renderItems();
}

/* ---------- 갓챠 ---------- */
function pickItem() {
  const total = items.reduce((s, i) => s + i.rate, 0);
  let r = Math.random() * total;
  for (const i of items) {
    if (r < i.rate) return i.name;
    r -= i.rate;
  }
}

function runGacha() {
  if (!userName.value || drawCount.value <= 0) return;
  const date = new Date().toISOString().split("T")[0];
  logs[date] ||= [];

  const results = {};
  for (let i = 0; i < drawCount.value; i++) {
    const r = pickItem();
    results[r] = (results[r] || 0) + 1;
  }

  logs[date].push({ user: userName.value, results });
  saveLogs();
  renderLogs();
  renderStats();
}

/* ---------- 로그 ---------- */
function renderLogs() {
  logArea.innerHTML = "";
  Object.entries(logs)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .forEach(([date, entries]) => {
      const header = document.createElement("div");
      header.className = "date-divider";
      header.textContent = date;
      logArea.appendChild(header);

      entries.forEach(e => {
        const div = document.createElement("div");
        div.textContent = `${e.user}: ${JSON.stringify(e.results)}`;
        logArea.appendChild(div);
      });
    });
}

/* ---------- 초성 검색 ---------- */
const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

function getChosung(str) {
  return [...str].map(ch => {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return ch;
    return CHO[Math.floor(code / 588)];
  }).join("");
}

function nameMatches(name, key) {
  if (!key) return true;
  return (
    name.includes(key) ||
    getChosung(name).includes(key)
  );
}

/* ---------- 통계 ---------- */
function renderStats() {
  statsArea.innerHTML = "";
  const keyword = document.getElementById("statsSearch").value.trim();

  const dateStats = {};

  Object.entries(logs).forEach(([date, entries]) => {
    dateStats[date] ||= {};
    entries.forEach(e => {
      dateStats[date][e.user] ||= {};
      Object.entries(e.results).forEach(([item, count]) => {
        dateStats[date][e.user][item] =
          (dateStats[date][e.user][item] || 0) + count;
      });
    });
  });

  Object.entries(dateStats)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
    .forEach(([date, users]) => {
      const dateHeader = document.createElement("div");
      dateHeader.className = "date-divider";
      dateHeader.textContent = date;
      statsArea.appendChild(dateHeader);

      Object.entries(users).forEach(([user, data]) => {
        if (!nameMatches(user, keyword)) return;

        const h = document.createElement("div");
        h.className = "stat-header";
        h.textContent = user;

        const b = document.createElement("div");
        b.className = "stat-body";

        Object.entries(data).forEach(([item, count]) => {
          const p = document.createElement("p");
          p.textContent = `${item} x${count}`;
          b.appendChild(p);
        });

        h.onclick = () => {
          b.style.display =
            b.style.display === "none" ? "block" : "none";
        };

        statsArea.appendChild(h);
        statsArea.appendChild(b);
      });
    });
}

/* ---------- 탭 ---------- */
function openTab(type) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));
  if (type === "log") {
    document.getElementById("logView").classList.add("active");
  } else {
    document.getElementById("statsView").classList.add("active");
  }
}

/* ---------- 초기 ---------- */
renderItems();
renderLogs();
renderStats();
