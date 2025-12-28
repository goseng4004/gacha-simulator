const itemsKey = "gachaItems";
let selectedIndex = null;

// ---------- 저장 / 불러오기 ----------
function loadItems() {
  return JSON.parse(localStorage.getItem(itemsKey)) || [];
}

function saveItems(items) {
  localStorage.setItem(itemsKey, JSON.stringify(items));
}

// ---------- 상품 추가 ----------
function addItem() {
  const name = document.getElementById("itemName").value;
  const prob = parseFloat(document.getElementById("itemProb").value);

  if (!name || isNaN(prob)) {
    alert("상품명과 확률을 입력하세요");
    return;
  }

  const items = loadItems();
  items.push({ name, prob });
  saveItems(items);
  clearInputs();
  renderItems();
}

// ---------- 상품 선택 ----------
function selectItem(index) {
  const item = loadItems()[index];
  selectedIndex = index;

  document.getElementById("itemName").value = item.name;
  document.getElementById("itemProb").value = item.prob;
}

// ---------- 상품 수정 ----------
function updateItem() {
  if (selectedIndex === null) {
    alert("수정할 상품을 선택하세요");
    return;
  }

  const items = loadItems();
  items[selectedIndex].name =
    document.getElementById("itemName").value;
  items[selectedIndex].prob =
    parseFloat(document.getElementById("itemProb").value);

  saveItems(items);
  clearInputs();
  renderItems();
}

// ---------- 상품 삭제 ----------
function deleteItem() {
  if (selectedIndex === null) {
    alert("삭제할 상품을 선택하세요");
    return;
  }

  const items = loadItems();
  items.splice(selectedIndex, 1);
  saveItems(items);
  clearInputs();
  renderItems();
}

// ---------- 리스트 출력 ----------
function renderItems() {
  const list = document.getElementById("itemList");
  list.innerHTML = "";

  loadItems().forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.prob}%)`;
    li.onclick = () => selectItem(index);

    // 선택 강조
    if (index === selectedIndex) {
      li.style.fontWeight = "bold";
      li.style.color = "blue";
    }

    list.appendChild(li);
  });
}

// ---------- 유틸 ----------
function clearInputs() {
  document.getElementById("itemName").value = "";
  document.getElementById("itemProb").value = "";
  selectedIndex = null;
}

// ---------- 초기 실행 ----------
renderItems();
