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
    const d = document.createElement("div");
    d.className = "date-divider";
    d.textContent = date;
    logArea.appendChild(d);

    entries.forEach((e, idx) => {
      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.dataset.date = date;
      cb.dataset.index = idx;

      cb.onchange = () =>
        bubble.classList.toggle("selected", cb.checked);

      bubble.onclick = (ev) => {
        if (ev.target.tagName === "INPUT") return;
        cb.checked = !cb.checked;
        bubble.classList.toggle("selected", cb.checked);
      };

      bubble.innerHTML += `<div class="chat-user">${e.user}</div>`;
      bubble.innerHTML += `<pre>${Object.entries(e.results)
        .map(([k, v]) => `${k} x${v}`)
        .join("\n")}</pre>`;

      bubble.prepend(cb);
      logArea.appendChild(bubble);
    });
  });
}

/* ---------- 로그 삭제 ---------- */
function deleteSelectedLogs() {
  document
    .querySelectorAll("#logArea input:checked")
    .forEach((cb) => {
      logs[cb.dataset.date][cb.dataset.index] = null;
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
  statsArea.innerHTML = {};
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
