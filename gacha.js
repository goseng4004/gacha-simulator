/* =========================
   DOM 연결
========================= */
const itemName = document.getElementById("itemName");
const itemRate = document.getElementById("itemRate");
const userName = document.getElementById("userName");
const drawCount = document.getElementById("drawCount");
const itemList = document.getElementById("itemList");
const logArea = document.getElementById("logArea");
const statsArea = document.getElementById("statsArea");

/* =========================
   데이터
========================= */
let items = JSON.parse(localStorage.getItem("gachaItems")) || [];
let logs = JSON.parse(localStorage.getItem("gachaLogs")) || {};
let selectedIndex = null;

/* =========================
   저장
========================= */
const saveItems = () =>
  localStorage.setItem("gachaItems", JSON.stringify(items));

const saveLogs = () =>
  localStorage.setItem("gachaLogs", JSON.stringify(logs));

/* =========================
   아이템 관리
========================= */
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
  items.push({ name: itemName.value, rate: Number(itemRate.value) });
  saveItems();
  renderItems();
}

function updateItem() {
  if (selectedIndex === null) return;
  items[selectedIndex] = {
    name: itemName.value,
    rate: Number(itemRate.value),
  };
  saveItems();
  renderItems();
}

function deleteItem() {
  if (selectedIndex === null) return;
  items.splice(selectedIndex, 1);
  selectedIndex = null;
  saveItems();
  renderItems();
}

/* =========================
   갓챠
========================= */
function pickItem() {
  const total = items.reduce((s, i) => s + i.rate, 0);
  let r = Math.random() * total;
  for (const i of items) {
    if (r < i.rate) return i.name;
    r -= i.rate;
  }
}

function runGacha() {
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

/* =========================
   로그
========================= */
function renderLogs() {
  logArea.innerHTML = "";
  Object.entries(logs).forEach(([date, entries]) => {
    entries.forEach((e) => {
      const div = document.createElement("div");
      div.className = "chat-bubble";
      div.innerHTML = `<b>${e.user}</b><pre>${Object.entries(e.results)
        .map(([k, v]) => `${k} x${v}`)
        .join("\n")}</pre>`;
      div.onclick = () => div.classList.toggle("selected");
      logArea.appendChild(div);
    });
  });
}

/* =========================
   이름 검색 유틸 (초성)
========================= */
const CHO = [
  "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ",
  "ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"
];

function getChosung(str) {
  return [...str].map(ch => {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return ch;
    return CHO[Math.floor(code / 588)];
  }).join("");
}

function nameMatches(name, key) {
  if (!key) return true;
  if (name.includes(key)) return true;
  if (getChosung(name).includes(key)) return true;
  return false;
}

/* =========================
   통계 (logs 기반 재계산)
========================= */
function renderStats() {
  const keyword = document.getElementById("statsSearch").value.trim();
  statsArea.innerHTML = "";

  const userStats = {};

  Object.values(logs).flat().forEach(({ user, results }) => {
    userStats[user] ||= {};
    Object.entries(results).forEach(([item, count]) => {
      userStats[user][item] =
        (userStats[user][item] || 0) + count;
    });
  });

  Object.entries(userStats).forEach(([user, data]) => {
    if (!nameMatches(user, keyword)) return;

    const wrap = document.createElement("div");
    wrap.className = "stat-wrapper";

    const header = document.createElement("div");
    header.className = "stat-header";
    header.textContent = user;

    const body = document.createElement("div");
    body.className = "stat-body";

    Object.entries(data).forEach(([item, count]) => {
      const p = document.createElement("p");
      p.textContent = `${item} x${count}`;
      body.appendChild(p);
    });

    wrap.appendChild(header);
    wrap.appendChild(body);
    statsArea.appendChild(wrap);
  });
}

/* =========================
   탭
========================= */
function openTab(type) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));

  if (type === "log") {
    document.querySelector(".tab:nth-child(1)").classList.add("active");
    document.getElementById("logView").classList.add("active");
  } else {
    document.querySelector(".tab:nth-child(2)").classList.add("active");
    document.getElementById("statsView").classList.add("active");
  }
}

/* =========================
   초기화
========================= */
renderItems();
renderLogs();
renderStats();
