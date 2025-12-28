const itemsKey = "gachaItems";

function loadItems() {
  return JSON.parse(localStorage.getItem(itemsKey)) || [];
}

function saveItems(items) {
  localStorage.setItem(itemsKey, JSON.stringify(items));
}

function addItem() {
  const name = document.getElementById("itemName").value;
  const prob = parseFloat(document.getElementById("itemProb").value);

  if (!name || isNaN(prob)) return;

  const items = loadItems();
  items.push({ name, prob });
  saveItems(items);
  renderItems();
}

function renderItems() {
  const list = document.getElementById("itemList");
  list.innerHTML = "";
  loadItems().forEach((item, i) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.prob}%)`;
    list.appendChild(li);
  });
}

function rollGacha() {
  const count = parseInt(document.getElementById("rollCount").value);
  const items = loadItems();

  if (items.length === 0) return;

  const pool = [];
  items.forEach(item => {
    for (let i = 0; i < item.prob; i++) {
      pool.push(item.name);
    }
  });

  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  document.getElementById("result").textContent = results.join(", ");
}

renderItems();
