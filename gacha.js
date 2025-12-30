/* ---------- DOM 연결 ---------- */
const userStats = {};
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
//  날짜 접힘 상태 저장용
const logFoldState = JSON.parse(
  localStorage.getItem("logFoldState") || "{}"
);

//  최신 로그 자동 스크롤 옵션
const AUTO_SCROLL_TO_LATEST = true;

const saveItems = () =>
  localStorage.setItem("gachaItems", JSON.stringify(items));
const saveLogs = () =>
  localStorage.setItem("gachaLogs", JSON.stringify(logs));

/* ---------- 상품 관리 ---------- */
function renderItems() {
  itemList.innerHTML = "";
  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.rate}%)`;
    li.className = i === selectedIndex ? "selected" : "";
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

  const sortedDates = Object.keys(logs).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  sortedDates.forEach((date) => {
    const entries = logs[date];
    const wrapper = document.createElement("div");

    const header = document.createElement("div");
    header.className = "date-divider collapsible";

    const isFolded = logFoldState[date] === true;
    header.textContent = `${isFolded ? "▶" : "▼"} ${date}`;

    const group = document.createElement("div");
    group.className = "log-group";
    group.style.display = isFolded ? "none" : "flex";

    header.onclick = () => {
      const folded = group.style.display === "none";
      group.style.display = folded ? "flex" : "none";
      header.textContent = `${folded ? "▼" : "▶"} ${date}`;

      logFoldState[date] = !folded;
      localStorage.setItem(
        "logFoldState",
        JSON.stringify(logFoldState)
      );
    };

    [...entries].reverse().forEach((e, idx) => {
      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";

      bubble.dataset.date = date;
      bubble.dataset.index = entries.length - 1 - idx;

      bubble.innerHTML = `
        <div class="chat-user">${e.user}</div>
        <pre>${Object.entries(e.results)
          .map(([k, v]) => `${k} x${v}`)
          .join("\n")}</pre>
      `;

      bubble.onclick = () => {
        bubble.classList.toggle("selected");
      };

      group.appendChild(bubble);
    });

    wrapper.appendChild(header);
    wrapper.appendChild(group);
    logArea.appendChild(wrapper);
  });

  if (AUTO_SCROLL_TO_LATEST) {
    const firstLog = logArea.querySelector(".chat-bubble");
    if (firstLog) {
      firstLog.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }
}

/* ---------- 로그 삭제 ---------- */
function deleteSelectedLogs() {
  const selected = document.querySelectorAll(
    "#logArea .chat-bubble.selected"
  );

  if (selected.length === 0) return;

  selected.forEach((bubble) => {
    const date = bubble.dataset.date;
    const index = Number(bubble.dataset.index);

    if (logs[date] && logs[date][index]) {
      logs[date][index] = null;
    }
  });

  Object.keys(logs).forEach((date) => {
    logs[date] = logs[date].filter(Boolean);
    if (logs[date].length === 0) delete logs[date];
  });

  saveLogs();
  renderLogs();
  renderStats();
}

/* ---------- 이름 검색 유틸 ---------- */
const CHO = [
  "ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ",
  "ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"
];

function getChosung(str) {
  return [...str].map(ch => {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return ch;
    return CHO[Math.floor(code / 588)];
  }).join("");
}

function nameMatches(userName, keyword) {
  if (!keyword) return true;

  const name = userName.replace(/\s+/g, "");
  const key = keyword.replace(/\s+/g, "");

  if (name.includes(key)) return true;
  if ([...key].some(ch => name.includes(ch))) return true;

  const nameCho = getChosung(name);
  if (nameCho.includes(key)) return true;

  return false;
}

/* ---------- 통계 ---------- */
function renderStats() {
  const statsArea = document.getElementById("statsArea");
  const keyword = document
    .getElementById("statsSearch")
    .value
    .trim();

  statsArea.innerHTML = "";

  Object.entries(userStats).forEach(([user, data]) => {
    if (!nameMatches(user, keyword)) return;

    const wrapper = document.createElement("div");
    wrapper.className = "stat-wrapper";

    const isClosed = localStorage.getItem(`stat-${user}`) === "closed";

    const header = document.createElement("div");
    header.className = "stat-header";
    header.textContent = `${isClosed ? "▶" : "▼"} ${user}`;

    const body = document.createElement("div");
    body.className = "stat-body";
    body.style.display = isClosed ? "none" : "block";

    Object.entries(data).forEach(([item, count]) => {
      const p = document.createElement("p");
      p.textContent = `${item} x${count}`;
      body.appendChild(p);
    });

    header.onclick = () => {
      const closed = body.style.display === "none";
      body.style.display = closed ? "block" : "none";
      header.textContent = `${closed ? "▼" : "▶"} ${user}`;
      localStorage.setItem(
        `stat-${user}`,
        closed ? "open" : "closed"
      );
    };

    wrapper.appendChild(header);
    wrapper.appendChild(body);
    statsArea.appendChild(wrapper);
  });
}

/* ---------- 초기화 ---------- */
renderItems();
renderLogs();
renderStats();

/*-----*/
function openTab(type) {
  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-view").forEach(v => v.classList.remove("active"));

  if (type === "log") {
    document.querySelector(".tab-bar .tab:nth-child(1)").classList.add("active");
    document.getElementById("logView").classList.add("active");
  } else {
    document.querySelector(".tab-bar .tab:nth-child(2)").classList.add("active");
    document.getElementById("statsView").classList.add("active");
  }
}
