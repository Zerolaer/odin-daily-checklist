'use strict';

const STORAGE_KEY = 'odin_tasks';
const MAX_CHARACTERS = 5;

function loadTasks() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function resetAllTasks() {
  const tasks = loadTasks();
  Object.keys(tasks).slice(0, MAX_CHARACTERS).forEach(name => {
    tasks[name].forEach(t => { t.done = false; });
  });
  saveTasks(tasks);
  render();
}

function openCharacterModal() {
  document.getElementById('characterModal').style.display = 'flex';
}

function closeCharacterModal() {
  document.getElementById('characterModal').style.display = 'none';
}

function addCharacterFromModal() {
  const nameInput = document.getElementById('characterName');
  const name = nameInput.value.trim();
  if (!name) return;
  const tasks = loadTasks();
  if (!tasks[name]) {
    tasks[name] = [];
    saveTasks(tasks);
    render();
  }
  nameInput.value = '';
  closeCharacterModal();
}

function openResetModal() {
  document.getElementById('resetModal').style.display = 'flex';
}

function closeResetModal() {
  document.getElementById('resetModal').style.display = 'none';
}

function resetConfirmed() {
  resetAllTasks();
  closeResetModal();
}

function deleteCharacter(name) {
  const tasks = loadTasks();
  delete tasks[name];
  saveTasks(tasks);
  render();
}

document.addEventListener('click', e => {
  document.querySelectorAll('.dropdown.open').forEach(drop => {
    if (!drop.contains(e.target)) drop.classList.remove('open');
  });
});

function render() {
  const tasks = loadTasks();
  const container = document.getElementById('tracker');
  container.innerHTML = '';

  const characterCount = Object.keys(tasks).length;
  const addButton = document.querySelector('button[onclick="openCharacterModal()"]');
  if (addButton) {
    const disabled = characterCount >= MAX_CHARACTERS;
    addButton.disabled = disabled;
    addButton.style.opacity = disabled ? '0.5' : '1';
    addButton.style.cursor = disabled ? 'not-allowed' : 'pointer';
  }

  for (const char in tasks) {
    const block = document.createElement('div');
    block.className = 'character';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'character-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'character-title';

    const countDone = tasks[char].filter(t => t.done).length;
    const countTotal = tasks[char].length;

    const bubble = document.createElement('span');
    bubble.className = 'task-counter';
    bubble.textContent = `${countDone}/${countTotal}`;
    if (countDone === countTotal && countTotal > 0) {
      bubble.style.backgroundColor = 'green';
      bubble.style.color = 'white';
    }

    const title = document.createElement('h2');
    const editable = document.createElement('input');
    editable.type = 'text';
    editable.value = char;
    editable.style.display = 'none';
    editable.onkeydown = e => {
      if (e.key === 'Enter') {
        const newName = editable.value.trim();
        if (newName && newName !== char) {
          const tasks = loadTasks();
          if (!tasks[newName]) {
            tasks[newName] = tasks[char];
            delete tasks[char];
            saveTasks(tasks);
            render();
          }
        }
      }
    };
    title.textContent = char;
    title.style.cursor = 'pointer';
    title.onclick = () => {
      title.style.display = 'none';
      editable.style.display = 'inline-block';
      editable.focus();
    };

    titleWrap.appendChild(bubble);
    titleWrap.appendChild(title);
    titleWrap.appendChild(editable);

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    const button = document.createElement('button');
    button.className = 'dropbtn';
    button.textContent = '⋮';
    button.onclick = e => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    };

    const menu = document.createElement('div');
    menu.className = 'dropdown-content';
    const del = document.createElement('button');
    del.textContent = 'Удалить';
    del.onclick = () => deleteCharacter(char);
    const copy = document.createElement('button');
    copy.textContent = 'Копировать';
    copy.onclick = () => {
      const tasks = loadTasks();
      if (Object.keys(tasks).length >= MAX_CHARACTERS) return;
      const newName = `${char} копия`;
      if (!tasks[newName]) {
        tasks[newName] = JSON.parse(JSON.stringify(tasks[char]));
        saveTasks(tasks);
        render();
      }
    };
    menu.appendChild(copy);
    menu.appendChild(del);

    dropdown.appendChild(button);
    dropdown.appendChild(menu);

    headerDiv.appendChild(titleWrap);
    headerDiv.appendChild(dropdown);
    block.appendChild(headerDiv);

    tasks[char].forEach((task, index) => {
      const row = document.createElement('div');
      row.className = 'task';
      row.draggable = true;
      row.dataset.index = index;
      row.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragover', e => {
        e.preventDefault();
        row.style.border = '1px dashed #666';
      });
      row.addEventListener('dragleave', () => {
        row.style.border = 'none';
      });
      row.addEventListener('drop', e => {
        e.preventDefault();
        row.style.border = 'none';
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const toIndex = index;
        if (fromIndex !== toIndex) {
          const movedItem = tasks[char].splice(fromIndex, 1)[0];
          tasks[char].splice(toIndex, 0, movedItem);
          saveTasks(tasks);
          render();
        }
      });
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${char}-task-${index}`;
      checkbox.checked = task.done;
      if (task.done) {
        checkbox.style.accentColor = 'green';
        checkbox.style.backgroundColor = 'green';
      }
      checkbox.onchange = () => {
        task.done = checkbox.checked;
        saveTasks(tasks);
        render();
      };
      const label = document.createElement('label');
      label.setAttribute('for', `${char}-task-${index}`);
      label.textContent = task.text;
      if (task.done) {
        label.style.opacity = '0.4';
        label.style.textDecoration = 'line-through';
      }
      const removeBtn = document.createElement('span');
      removeBtn.textContent = '×';
      removeBtn.style.marginLeft = '0.5rem';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.opacity = '0';
      removeBtn.style.transition = 'opacity 0.2s';
      removeBtn.onclick = () => {
        tasks[char].splice(index, 1);
        saveTasks(tasks);
        render();
      };
      row.onmouseenter = () => (removeBtn.style.opacity = '1');
      row.onmouseleave = () => (removeBtn.style.opacity = '0');
      row.appendChild(checkbox);
      row.appendChild(label);
      row.appendChild(removeBtn);
      block.appendChild(row);
    });

    const input = document.createElement('input');
    input.placeholder = 'Новая задача';
    input.onkeydown = e => {
      if (e.key === 'Enter') {
        const text = input.value.trim();
        if (!text) return;
        tasks[char].push({ text, done: false });
        saveTasks(tasks);
        render();
        setTimeout(() => {
          block.querySelector('.add-task-character input').focus();
        });
      }
    };

    const addTaskDiv = document.createElement('div');
    addTaskDiv.className = 'add-task-character';
    addTaskDiv.appendChild(input);

    block.appendChild(addTaskDiv);
    container.appendChild(block);
  }
}

document.addEventListener('DOMContentLoaded', render);
