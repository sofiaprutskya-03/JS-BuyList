const STORAGE_KEY = 'buy-list-items';

const defaultItems = [
  { id: 1, name: 'Помідори', count: 2, bought: true },
  { id: 2, name: 'Печиво',   count: 2, bought: false },
  { id: 3, name: 'Сир',      count: 1, bought: false },
];

const addForm      = document.querySelector('.add-form');
const addInput     = document.querySelector('#product-input');
const addButton    = document.querySelector('.add-button');
const shoppingList = document.querySelector('.shopping-list');

const summaryTags = document.querySelectorAll('.summary-section .tags');
const pendingTagsDiv = summaryTags[0];
const boughtTagsDiv  = summaryTags[1];

let items  = loadItems();
let nextId = getNextId();

function loadItems() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultItems.map(item => ({ ...item }));
  try {
    return JSON.parse(saved);
  } catch {
    return defaultItems.map(item => ({ ...item }));
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getNextId() {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function setMinusState(button, count) {
  const disabled = count <= 1;
  button.classList.toggle('disabled', disabled);
  button.disabled = disabled;
  button.dataset.tooltip = disabled ? 'Зменшення недоступне' : 'Зменшити кількість';
}

function createRow(item) {
  const li = document.createElement('li');
  li.className = 'shopping-row';
  li.dataset.id = item.id;

  if (item.bought) {
    const nameSpan = document.createElement('span');
    nameSpan.className = 'product-name crossed';
    nameSpan.textContent = item.name;

    const counter = document.createElement('div');
    counter.className = 'counter';
    const amountSpan = document.createElement('span');
    amountSpan.className = 'amount';
    amountSpan.textContent = item.count;
    counter.appendChild(amountSpan);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const statusBtn = document.createElement('button');
    statusBtn.className = 'status-button';
    statusBtn.type = 'button';
    statusBtn.dataset.action = 'toggle';
    statusBtn.dataset.tooltip = 'Повернути до списку';
    statusBtn.textContent = 'Не куплено';
    actions.appendChild(statusBtn);

    li.append(nameSpan, counter, actions);

  } else {
    const nameSpan = document.createElement('span');
    nameSpan.className = 'product-name';
    nameSpan.textContent = item.name;

    const counter = document.createElement('div');
    counter.className = 'counter';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'circle-button minus';
    minusBtn.type = 'button';
    minusBtn.dataset.action = 'minus';
    minusBtn.textContent = '−';
    setMinusState(minusBtn, item.count);

    const amountSpan = document.createElement('span');
    amountSpan.className = 'amount';
    amountSpan.textContent = item.count;

    const plusBtn = document.createElement('button');
    plusBtn.className = 'circle-button plus';
    plusBtn.type = 'button';
    plusBtn.dataset.action = 'plus';
    plusBtn.dataset.tooltip = 'Збільшити кількість';
    plusBtn.textContent = '+';

    counter.append(minusBtn, amountSpan, plusBtn);

    const actions = document.createElement('div');
    actions.className = 'actions';

    const statusBtn = document.createElement('button');
    statusBtn.className = 'status-button';
    statusBtn.type = 'button';
    statusBtn.dataset.action = 'toggle';
    statusBtn.dataset.tooltip = 'Позначити як куплене';
    statusBtn.textContent = 'Куплено';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.type = 'button';
    deleteBtn.dataset.action = 'remove';
    deleteBtn.dataset.tooltip = 'Видалити товар';
    deleteBtn.textContent = '×';

    actions.append(statusBtn, deleteBtn);
    li.append(nameSpan, counter, actions);
  }

  return li;
}

function drawList() {
  shoppingList.innerHTML = '';
  items.forEach(item => shoppingList.appendChild(createRow(item)));
}

function drawStats() {
  pendingTagsDiv.innerHTML = '';
  boughtTagsDiv.innerHTML  = '';

  items.forEach(item => {
    const tag = document.createElement('span');
    tag.className = item.bought ? 'tag crossed' : 'tag';

    tag.appendChild(document.createTextNode(item.name + ' '));

    const count = document.createElement('span');
    count.className = 'tag-count';
    count.textContent = item.count;
    tag.appendChild(count);

    if (item.bought) {
      boughtTagsDiv.appendChild(tag);
    } else {
      pendingTagsDiv.appendChild(tag);
    }
  });
}

function addItem() {
  const name = addInput.value.trim();
  if (!name) {
    addInput.focus();
    return;
  }

  const item = { id: nextId++, name, count: 1, bought: false };
  items.push(item);

  shoppingList.appendChild(createRow(item));
  drawStats();
  saveItems();

  addInput.value = '';
  addInput.focus();
}

function updateCount(row, item) {
  row.querySelector('.amount').textContent = item.count;
  setMinusState(row.querySelector('[data-action="minus"]'), item.count);
  drawStats();
  saveItems();
}

function startEditing(row, item) {
  const nameSpan = row.querySelector('.product-name');
  if (!nameSpan) return;

  const input = document.createElement('input');
  input.className = 'edit-input';
  input.type = 'text';
  input.value = item.name;
  input.setAttribute('aria-label', 'Редагувати назву товару');

  row.replaceChild(input, nameSpan);
  input.focus();
  input.select();
}

function finishEditing(input) {
  const row  = input.closest('.shopping-row');
  const item = items.find(i => i.id === Number(row.dataset.id));
  if (!item) return;

  const newName = input.value.trim();
  if (newName) item.name = newName;

  const nameSpan = document.createElement('span');
  nameSpan.className = 'product-name';
  nameSpan.textContent = item.name;
  row.replaceChild(nameSpan, input);

  drawStats();
  saveItems();
}


addForm.addEventListener('submit', e => {
  e.preventDefault();
  addItem();
});

addButton.addEventListener('click', addItem);

shoppingList.addEventListener('click', e => {
  const row = e.target.closest('.shopping-row');
  if (!row) return;

  const item = items.find(i => i.id === Number(row.dataset.id));
  if (!item) return;

  const btn = e.target.closest('[data-action]');
  if (btn) {
    const action = btn.dataset.action;

    if (action === 'plus' && !item.bought) {
      item.count += 1;
      updateCount(row, item);

    } else if (action === 'minus' && !item.bought && item.count > 1) {
      item.count -= 1;
      updateCount(row, item);

    } else if (action === 'toggle') {
      item.bought = !item.bought;
      row.replaceWith(createRow(item));
      drawStats();
      saveItems();

    } else if (action === 'remove' && !item.bought) {
      items = items.filter(i => i.id !== item.id);
      row.remove();
      drawStats();
      saveItems();
    }
    return;
  }

  if (e.target.classList.contains('product-name') && !item.bought) {
    startEditing(row, item);
  }
});

shoppingList.addEventListener('keydown', e => {
  if (e.target.classList.contains('edit-input') && e.key === 'Enter') {
    e.preventDefault();
    e.target.blur();
  }
});

shoppingList.addEventListener('focusout', e => {
  if (e.target.classList.contains('edit-input')) {
    finishEditing(e.target);
  }
});

drawList();
drawStats();
