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
function saveItems() {
  localStorage.setItem("gachaItems", JSON.stringify(items));
}

function saveLogs() {
  localStorage.setItem("gachaLogs", JSON.stringify(logs));
}

/* ---------- 상품 관리 ---------- */
function renderItems() {
  itemList.innerHTML = "";
  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.rate}%)`;
    li.onclick = () => selectItem(index);
    if (index === selectedIndex) li.classList.add("selected");
    itemList.appendChild(li);
  });
}

function selectItem(index) {
  selectedIndex = index;
  itemName.value = items[index].name;
  itemRate.value = items[index].rate;
  renderItems();
}

function addItem() {
  const name = itemName.value.trim();
  const rate = Number(itemRate.value);
  if (!name || rate <= 0) return;

  items.push({ name, rate });
  saveItems();
  renderItems();
}

function updateItem() {
  if (selectedIndex === null) return;

  items[selectedIndex].name = itemName.value.trim();
  items[selectedIndex].rate = Number(itemRate.value);

  saveItems();

  selectedIndex = null;
  itemName.value = "";
  itemRate.value = "";

  renderItems();
}

function deleteItem() {
  if (selectedIndex === null) return;

  items.splice(selectedIndex, 1);
  saveItems();

  selectedIndex = null;
  itemName.value = "";
  itemRate.value = "";

  renderItems();
}

/* ---------- 갓챠 ---------- */
function pickItem() {
  const total = items.reduce((sum, i) => sum + i.rate, 0);
  if (total <= 0) return null;

  let r = Math.random() * total;

  for (let item of items) {
    if (r < item.rate) return item.name;
    r -= item.rate;
  }

  return null;
}

function runGacha() {
  alert("runGacha 실행됨"); 
  console.log("runGacha 실행됨");
  const user = userName.value.trim();
  const count = Number(drawCount.value);

  if (!user || count <= 0 || items.length === 0) return;

  const date = new Date().toISOString().split("T")[0];
  if (!logs[date]) logs[date] = [];

  const results = {};
  for (let i = 0; i < count; i++) {
    const r = pickItem();
    if (!r) continue;   // ★ 이 줄 중요
    results[r] = (results[r] || 0) + 1;
  }


  logs[date].push({ user, results });

  saveLogs();
  renderLogs();
  renderStats();

}

/* ---------- 로그 ---------- */
function renderLogs() {
  logArea.innerHTML = "";

  Object.keys(logs).forEach(date => {
    if (!Array.isArray(logs[date])) return;

    const d = document.createElement("div");
    d.className = "date-divider";
    d.textContent = date;
    logArea.appendChild(d);

    logs[date].forEach((entry, index) => {
      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";

      // 체크박스
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.date = date;
      checkbox.dataset.index = index;

      const u = document.createElement("div");
      u.className = "chat-user";
      u.textContent = entry.user;

      const p = document.createElement("pre");
      p.textContent = Object.entries(entry.results)
        .map(([k, v]) => v > 1 ? `${k} x${v}` : k)
        .join("\n");

      bubble.appendChild(checkbox);
      bubble.appendChild(u);
      bubble.appendChild(p);
      logArea.appendChild(bubble);
    });
  });
}
/* ---------- 로그 삭제 ---------- */
function deleteSelectedLogs() {
  const checked = document.querySelectorAll(
    '#logArea input[type="checkbox"]:checked'
  );

  if (checked.length === 0) return;

  checked.forEach(cb => {
    const date = cb.dataset.date;
    const index = Number(cb.dataset.index);

    if (Array.isArray(logs[date])) {
      logs[date][index] = null; // 표시용 삭제
    }
  });

  // null 제거
  Object.keys(logs).forEach(date => {
    logs[date] = logs[date].filter(e => e !== null);
    if (logs[date].length === 0) delete logs[date];
  });

  saveLogs();
  renderLogs();
  renderStats();
}

/* ---------- 통계 ---------- */
function renderStats() {
  statsArea.innerHTML = "";

  const userStats = {};

  // 1. 데이터 재구성
  Object.entries(logs).forEach(([date, entries]) => {
    entries.forEach(entry => {
      if (!userStats[entry.user]) {
        userStats[entry.user] = {
          total: 0,
          dates: {}
        };
      }

      if (!userStats[entry.user].dates[date]) {
        userStats[entry.user].dates[date] = {};
      }

      Object.entries(entry.results).forEach(([item, count]) => {
        userStats[entry.user].total += count;

        userStats[entry.user].dates[date][item] =
          (userStats[entry.user].dates[date][item] || 0) + count;
      });
    });
  });

  // 2. 렌더링
  Object.keys(userStats).forEach(user => {
    const box = document.createElement("div");
    box.className = "stats-user";

    const header = document.createElement("div");
    header.className = "stats-header";
    header.textContent = `${user} (총 ${userStats[user].total}회) ▶`;

    const detail = document.createElement("div");
    detail.className = "stats-detail";

    // 날짜별 출력
    Object.entries(userStats[user].dates).forEach(([date, items]) => {
      const dateBlock = document.createElement("div");
      dateBlock.style.marginBottom = "8px";

      const dateTitle = document.createElement("div");
      dateTitle.style.fontWeight = "bold";
      dateTitle.style.fontSize = "13px";
      dateTitle.textContent = date;

      const itemList = document.createElement("div");
      itemList.style.fontSize = "13px";
      itemList.style.marginLeft = "10px";
      itemList.innerHTML = Object.entries(items)
        .map(([k, v]) => `${k} x${v}`)
        .join("<br>");

      dateBlock.appendChild(dateTitle);
      dateBlock.appendChild(itemList);
      detail.appendChild(dateBlock);
    });

    // 접기 / 펼치기
    header.onclick = () => {
      const open = detail.style.display === "block";
      detail.style.display = open ? "none" : "block";
      header.textContent =
        `${user} (총 ${userStats[user].total}회) ${open ? "▶" : "▼"}`;
    };

    box.appendChild(header);
    box.appendChild(detail);
    statsArea.appendChild(box);
  });
}

/* ---------- 초기화 ---------- */
renderItems();
renderLogs();
renderStats();
