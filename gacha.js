/* ---------- DOM 연결 ---------- */
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

  Object.entries(logs).forEach(([date, entries]) => {
    /* 날짜 헤더 */
    const header = document.createElement("div");
    header.className = "date-divider collapsible";
    header.textContent = `▼ ${date}`;

    /* 날짜별 로그 묶음 */
    const group = document.createElement("div");
    group.className = "log-group";

    /* 접기 / 펼치기 */
    header.onclick = () => {
      const closed = group.style.display === "none";
      group.style.display = closed ? "block" : "none";
      header.textContent = `${closed ? "▼" : "▶"} ${date}`;
    };

    entries.forEach((e) => {
      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";

      bubble.innerHTML = `
        <div class="chat-user">${e.user}</div>
        <pre>${Object.entries(e.results)
          .map(([k, v]) => `${k} x${v}`)
          .join("\n")}</pre>
      `;

      /* 클릭 선택 */
      bubble.onclick = () => {
        bubble.classList.toggle("selected");
      };

      group.appendChild(bubble);
    });

    logArea.append(header, group);
  });
}


/* ---------- 로그 삭제 ---------- */
function deleteSelectedLogs() {
  const selected = document.querySelectorAll(".chat-bubble.selected");

  selected.forEach((bubble) => {
    const date = bubble.previousSibling?.textContent;
    const index = [...logArea.querySelectorAll(".chat-bubble")]
      .filter(b => b.previousSibling?.textContent === date)
      .indexOf(bubble);

    if (logs[date]) logs[date][index] = null;
  });

  Object.keys(logs).forEach(
    (d) => (logs[d] = logs[d].filter(Boolean))
  );

  saveLogs();
  renderLogs();
  renderStats();
}

/* ---------- 통계 ---------- */
function renderStats() {
  statsArea.innerHTML = ""; // ⭐ 핵심 수정

  const stats = {};

  Object.entries(logs).forEach(([date, entries]) => {
    entries.forEach((e) => {
      stats[e.user] ||= { total: 0, dates: {} };
      stats[e.user].dates[date] ||= {};

      Object.entries(e.results).forEach(([k, v]) => {
        stats[e.user].total += v;
        stats[e.user].dates[date][k] =
          (stats[e.user].dates[date][k] || 0) + v;
      });
    });
  });

  Object.entries(stats).forEach(([user, data]) => {
    const box = document.createElement("div");
    const header = document.createElement("div");
    const detail = document.createElement("div");

    header.className = "stats-header";
    header.textContent = `${user} (총 ${data.total}회) ▶`;

    detail.className = "stats-detail";

    Object.entries(data.dates).forEach(([d, items]) => {
      detail.innerHTML += `<b>${d}</b><br>${Object.entries(items)
        .map(([k, v]) => `${k} x${v}`)
        .join("<br>")}<br><br>`;
    });

    header.onclick = () => {
      const open = detail.style.display === "block";
      detail.style.display = open ? "none" : "block";
      header.textContent = `${user} (총 ${data.total}회) ${
        open ? "▶" : "▼"
      }`;
    };

    box.append(header, detail);
    statsArea.appendChild(box);
  });
}

/* ---------- 초기화 ---------- */
renderItems();
renderLogs();
renderStats();
