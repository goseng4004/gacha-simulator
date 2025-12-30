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

  //  날짜 최신순 정렬
  const sortedDates = Object.keys(logs).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  sortedDates.forEach((date) => {
    const entries = logs[date];
    const wrapper = document.createElement("div");

    // 날짜 헤더
    const header = document.createElement("div");
    header.className = "date-divider collapsible";

    const isFolded = logFoldState[date] === true;
    header.textContent = `${isFolded ? "▶" : "▼"} ${date}`;

    // 로그 그룹
    const group = document.createElement("div");
    group.className = "log-group";
    group.style.display = isFolded ? "none" : "flex";

    // 날짜 접기/펼치기
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

    //  같은 날짜 안에서도 최신 로그가 위로
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

  //  최신 로그 자동 스크롤
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

  // null 정리
  Object.keys(logs).forEach((date) => {
    logs[date] = logs[date].filter(Boolean);
    if (logs[date].length === 0) delete logs[date];
  });

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

