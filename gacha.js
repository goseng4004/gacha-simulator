/* ---------- DOM 연결 ---------- */
const itemName = document.getElementById("itemName");
const itemRate = document.getElementById("itemRate");
const userName = document.getElementById("userName");
const drawCount = document.getElementById("drawCount");
const itemList = document.getElementById("itemList");
const logArea = document.getElementById("logArea");

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
  let r = Math.random() * total;

  for (let item of items) {
    if (r < item.rate) return item.name;
    r -= item.rate;
  }
}

function runGacha() {
  const user = userName.value.trim();
  const count = Number(drawCount.value);

  if (!user || count <= 0 || items.length === 0) {
    alert("이름 / 횟수 / 상품을 확인해줘!");
    return;
  }

  const date = new Date().toISOString().split("T")[0];
  if (!logs[date]) logs[date] = {};
  if (!logs[date][user]) logs[date][user] = [];

  for (let i = 0; i < count; i++) {
    const result = pickItem();
    logs[date][user].push(result);
  }

  saveLogs();
  renderLogs();
}

/* ---------- 로그 ---------- */
function renderLogs() {
  logArea.innerHTML = "";

  Object.keys(logs).forEach(date => {
    const d = document.createElement("div");
    d.className = "date-divider";
    d.textContent = date;
    logArea.appendChild(d);

    Object.keys(logs[date]).forEach(user => {
      const bubble = document.createElement("div");
      bubble.className = "chat-bubble";

      const u = document.createElement("div");
      u.className = "chat-user";
      u.textContent = user;

      const p = document.createElement("pre");
      const counts = {};

      logs[date][user].forEach(r => {
        counts[r] = (counts[r] || 0) + 1;
      });

      p.textContent = Object.entries(counts)
        .map(([k, v]) => (v > 1 ? `${k} x${v}` : k))
        .join("\n");

      bubble.appendChild(u);
      bubble.appendChild(p);
      logArea.appendChild(bubble);
    });
  });
}

/* ---------- 초기화 ---------- */
renderItems();
renderLogs();
