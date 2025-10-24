class Todo {
  constructor(rootEl) {
    this.root = rootEl;
    this.tasks = [];
    this.term = '';
    this.storageKey = 'labb_todo_v1';
    this.load();
    this.draw();
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tasks));
    } catch (e) {
      console.error('LocalStorage save failed', e);
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) this.tasks = JSON.parse(raw);
      else this.tasks = this._getSample();
    } catch (e) {
      console.error('LocalStorage load failed', e);
      this.tasks = [];
    }
  }

  _getSample() {
    return [
      { id: this._uid(), text: 'Przykładowe zadanie — kliknij aby edytować', due: null, createdAt: new Date().toISOString() },
      { id: this._uid(), text: 'Kup mleko', due: null, createdAt: new Date().toISOString() }
    ];
  }

  _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  addTask(text, due) {
    const t = text.trim();
    if (!this._validateText(t)) throw new Error('Tekst nie spełnia warunków (3–255 zn.)');
    if (!this._validateDue(due)) throw new Error('Data musi być pusta lub w przyszłości');
    const task = { id: this._uid(), text: t, due: due || null, createdAt: new Date().toISOString() };
    this.tasks.unshift(task);
    this.save();
    this.draw();
    return task;
  }

  removeTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save();
    this.draw();
  }

  editTask(id, newText, newDue) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;
    if (!this._validateText(newText)) throw new Error('Tekst nie spełnia warunków (3–255 zn.)');
    if (!this._validateDue(newDue)) throw new Error('Data musi być pusta lub w przyszłości');
    task.text = newText.trim();
    task.due = newDue || null;
    this.save();
    this.draw();
  }

  _validateText(text) {
    if (typeof text !== 'string') return false;
    const len = text.trim().length;
    return len >= 3 && len <= 255;
  }

  _validateDue(due) {
    if (!due) return true;
    const d = new Date(due);
    const now = new Date();
    return d > now;
  }

  setSearchTerm(term) {
    this.term = term.trim();
    this.draw();
  }

  get filteredTasks() {
    if (!this.term || this.term.length < 2) return this.tasks;
    const q = this.term.toLowerCase();
    return this.tasks.filter(t => t.text.toLowerCase().includes(q));
  }

  draw() {
    const container = this.root;
    container.innerHTML = '';
    const tasks = this.filteredTasks;
    if (!tasks.length) {
      const el = document.createElement('div');
      el.className = 'empty';
      el.textContent = this.term && this.term.length >= 2 ? 'Brak wyników.' : 'Brak zadań — dodaj pierwsze.';
      container.appendChild(el);
      return;
    }
    const q = this.term && this.term.length >= 2 ? this.term : null;
    for (const task of tasks) {
      const item = document.createElement('div');
      item.className = 'task';
      item.dataset.id = task.id;
      const left = document.createElement('div');
      left.className = 'left';
      const content = document.createElement('div');
      content.className = 'content';
      content.tabIndex = 0;
      content.title = 'Kliknij, aby edytować';
      content.innerHTML = q ? this._highlight(task.text, q) : this._escape(task.text);
      const meta = document.createElement('div');
      meta.className = 'meta';
      if (task.due) {
        const dt = new Date(task.due);
        meta.textContent = `Termin: ${dt.toLocaleString()}`;
      } else {
        meta.textContent = '';
      }
      left.appendChild(content);
      left.appendChild(meta);
      const del = document.createElement('button');
      del.className = 'btn-delete';
      del.type = 'button';
      del.setAttribute('aria-label', 'Usuń zadanie');
      del.innerHTML = '🗑';
      del.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (confirm('Usunąć zadanie?')) this.removeTask(task.id);
      });
      content.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this._enterEditMode(task, item, content, meta);
      });
      content.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          this._enterEditMode(task, item, content, meta);
        }
      });
      item.appendChild(left);
      item.appendChild(del);
      container.appendChild(item);
    }
  }

  _enterEditMode(task, itemEl, contentEl, metaEl) {
    if (itemEl.classList.contains('editing')) return;
    itemEl.classList.add('editing');
    const inputText = document.createElement('input');
    inputText.type = 'text';
    inputText.value = task.text;
    inputText.maxLength = 255;
    inputText.style.width = '60%';
    inputText.className = 'edit-text';
    const inputDue = document.createElement('input');
    inputDue.type = 'datetime-local';
    inputDue.value = task.due ? this._toDatetimeLocal(task.due) : '';
    const left = contentEl.parentElement;
    left.replaceChild(inputText, contentEl);
    left.replaceChild(inputDue, metaEl);
    inputText.focus();
    const saveAndExit = (save) => {
      try {
        if (save) {
          this.editTask(task.id, inputText.value, inputDue.value || null);
        } else {
          this.draw();
        }
      } catch (err) {
        alert(err.message || 'Błąd walidacji');
        inputText.focus();
        return;
      } finally {
        itemEl.classList.remove('editing');
        document.removeEventListener('click', onDocClick, true);
        inputText.removeEventListener('keydown', onKeyDown);
      }
    };
    const onDocClick = (ev) => {
      if (!itemEl.contains(ev.target)) {
        saveAndExit(true);
      }
    };
    const onKeyDown = (ev) => {
      if (ev.key === 'Escape') { ev.preventDefault(); saveAndExit(false); }
      if (ev.key === 'Enter') { ev.preventDefault(); saveAndExit(true); }
    };
    document.addEventListener('click', onDocClick, true);
    inputText.addEventListener('keydown', onKeyDown);
    inputDue.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); saveAndExit(true); }
    });
  }

  _toDatetimeLocal(iso) {
    const d = new Date(iso);
    const pad = (n) => n.toString().padStart(2, '0');
    const YYYY = d.getFullYear();
    const MM = pad(d.getMonth()+1);
    const DD = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${YYYY}-${MM}-${DD}T${hh}:${mm}`;
  }

  _escape(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  _highlight(text, q) {
    const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(esc, 'ig');
    let i = 0;
    const parts = [];
    let match;
    while ((match = re.exec(text)) !== null) {
      parts.push(this._escape(text.slice(i, match.index)));
      parts.push(`<mark>${this._escape(match[0])}</mark>`);
      i = match.index + match[0].length;
      if (re.lastIndex === match.index) re.lastIndex++;
    }
    parts.push(this._escape(text.slice(i)));
    return parts.join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('todo-list');
  const todo = new Todo(listEl);
  const addForm = document.getElementById('add-form');
  const inputText = document.getElementById('new-text');
  const inputDue = document.getElementById('new-due');
  addForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    try {
      todo.addTask(inputText.value, inputDue.value || null);
      inputText.value = '';
      inputDue.value = '';
      inputText.focus();
    } catch (err) {
      alert(err.message || 'Błąd dodawania zadania');
    }
  });
  const search = document.getElementById('search');
  let debounce;
  search.addEventListener('input', (ev) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      todo.setSearchTerm(search.value);
    }, 150);
  });
});
