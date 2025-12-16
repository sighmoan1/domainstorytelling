// Utility functions
function isDesktop() { return window.innerWidth >= 900; }
function showToast(msg) { document.querySelector('.toast')?.remove(); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2500); }
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function insertAtCursor(text) {
  if (!text || typeof text !== 'string') return;
  const ed = document.getElementById('storyInput');
  if (!ed) return;
  const pos = Math.max(0, Math.min(ed.selectionStart || 0, ed.value.length));
  const end = Math.max(0, Math.min(ed.selectionEnd || pos, ed.value.length));
  ed.value = ed.value.slice(0, pos) + text + ed.value.slice(end);
  ed.selectionStart = ed.selectionEnd = pos + text.length;
  ed.focus();
  saveHistory();
  update();
}

function switchTab(id) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab[data-panel="${id}"]`)?.classList.add('active');
  const panel = document.getElementById(`${id}-panel`);
  if (panel) {
    panel.classList.add('active');
    if (id === 'diagram') setTimeout(fitToScreen, 80);
  }
}

// History management
function saveHistory() {
  const text = document.getElementById('storyInput').value;
  if (state.history[state.historyIndex] === text) return;
  state.history = state.history.slice(0, state.historyIndex + 1);
  state.history.push(text);
  if (state.history.length > 50) state.history.shift();
  state.historyIndex = state.history.length - 1;
}

function undo() {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    document.getElementById('storyInput').value = state.history[state.historyIndex];
    update();
  }
}

function redo() {
  if (state.historyIndex < state.history.length - 1) {
    state.historyIndex++;
    document.getElementById('storyInput').value = state.history[state.historyIndex];
    update();
  }
}

// Icon management
async function loadIcons() {
  try {
    const resp = await fetch('https://raw.githubusercontent.com/google/material-design-icons/master/font/MaterialIcons-Regular.codepoints');
    allIcons = (await resp.text()).split('\n').filter(Boolean).map(l => l.split(' ')[0]).sort();
  } catch (e) { allIcons = [...new Set(Object.values(ICON_CATEGORIES).flat())].sort(); }
  renderIconGrid('suggested');
}

function renderIconGrid(category = 'suggested', filter = '') {
  const grid = document.getElementById('iconGrid');
  let icons = category === 'all' ? allIcons : (ICON_CATEGORIES[category] || ICON_CATEGORIES.suggested);
  if (filter) icons = allIcons.filter(i => i.includes(filter.toLowerCase()));
  grid.innerHTML = icons.slice(0, 80).map(icon => `<div class="icon-item" data-icon="${icon}"><span class="material-icons">${icon}</span><span>${icon.replace(/_/g, ' ')}</span></div>`).join('');
  grid.querySelectorAll('.icon-item').forEach(item => item.addEventListener('click', () => {
    insertAtCursor(`(${item.dataset.icon})`);
    showToast(`Added: ${item.dataset.icon}`);
    document.getElementById('iconPickerOverlay').classList.remove('active');
  }));
}

// Template management
function openTemplates() {
  document.getElementById('templatesModal').classList.add('active');
  document.getElementById('templateGrid').innerHTML = TEMPLATES.map(t => `<div class="template-card" data-id="${t.id}"><h4><span class="material-icons">${t.icon}</span> ${t.title}</h4><p>${t.desc}</p></div>`).join('');
  document.querySelectorAll('.template-card').forEach(card => card.onclick = () => {
    const tmpl = TEMPLATES.find(t => t.id === card.dataset.id);
    document.getElementById('storyInput').value = tmpl.content;
    saveHistory(); update();
    document.getElementById('templatesModal').classList.remove('active');
    showToast('Template loaded!');
  });
}

// Autocomplete
function handleEditorKeys(e) {
  const ac = document.getElementById('autocomplete');
  if (!ac.classList.contains('visible')) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    return;
  }
  const items = ac.querySelectorAll('.autocomplete-item');
  if (e.key === 'ArrowDown') { e.preventDefault(); autocompleteIndex = Math.min(autocompleteIndex + 1, items.length - 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); autocompleteIndex = Math.max(autocompleteIndex - 1, 0); }
  else if (e.key === 'Enter' && autocompleteIndex >= 0) { e.preventDefault(); items[autocompleteIndex]?.click(); }
  else if (e.key === 'Escape') hideAutocomplete();
  items.forEach((it, i) => it.classList.toggle('selected', i === autocompleteIndex));
}

function showAutocomplete(items, x, y) {
  const ac = document.getElementById('autocomplete');
  if (!items.length) { ac.classList.remove('visible'); return; }
  ac.innerHTML = items.map((item, i) => `<div class="autocomplete-item ${i === autocompleteIndex ? 'selected' : ''}" data-value="${item.value}"><span class="material-icons">${item.icon}</span><span class="autocomplete-item-name">${item.name}</span></div>`).join('');
  ac.style.left = `${Math.min(x, window.innerWidth - 180)}px`; ac.style.top = `${Math.min(y + 20, window.innerHeight - 220)}px`; ac.classList.add('visible');
  ac.querySelectorAll('.autocomplete-item').forEach(item => item.addEventListener('click', () => insertAutocomplete(item.dataset.value)));
}

function hideAutocomplete() { document.getElementById('autocomplete').classList.remove('visible'); autocompleteIndex = -1; }

function insertAutocomplete(value) {
  const ed = document.getElementById('storyInput'), pos = ed.selectionStart, text = ed.value;
  let start = pos;
  while (start > 0 && !/[\n\s(,]/.test(text[start - 1])) start--;
  ed.value = text.slice(0, start) + value + text.slice(pos);
  ed.selectionStart = ed.selectionEnd = start + value.length;
  ed.focus(); hideAutocomplete(); update();
}

function checkAutocomplete() {
  const ed = document.getElementById('storyInput'), pos = ed.selectionStart, text = ed.value, lineStart = text.lastIndexOf('\n', pos - 1) + 1, line = text.slice(lineStart, pos);
  const iconM = line.match(/\((\w*)$/);
  if (iconM) {
    const s = iconM[1].toLowerCase(), icons = (s ? ICON_CATEGORIES.suggested.filter(i => i.includes(s)) : ICON_CATEGORIES.suggested).slice(0, 6);
    if (icons.length) { const rect = ed.getBoundingClientRect(); showAutocomplete(icons.map(i => ({ icon: i, name: i, value: i + ')' })), rect.left + 10, rect.top + 50); return; }
  }
  hideAutocomplete();
}

// Initialization
function init() {
  loadIcons();
  const ed = document.getElementById('storyInput');
  let debounce;
  ed.addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(() => { saveHistory(); update(); }, 150); checkAutocomplete(); });
  ed.addEventListener('keydown', handleEditorKeys);
  ed.addEventListener('blur', () => setTimeout(hideAutocomplete, 150));

  document.getElementById('helpBtn').onclick = () => document.getElementById('helpModal').classList.add('active');
  document.getElementById('closeHelpBtn').onclick = () => document.getElementById('helpModal').classList.remove('active');
  document.getElementById('templatesBtn').onclick = openTemplates;
  document.getElementById('closeTemplatesBtn').onclick = () => document.getElementById('templatesModal').classList.remove('active');
  document.getElementById('iconPickerBtn').onclick = () => { document.getElementById('iconPickerOverlay').classList.add('active'); renderIconGrid('suggested'); };
  document.getElementById('exportBtn').onclick = exportPNG;
  document.getElementById('undoBtn').onclick = undo;
  document.getElementById('redoBtn').onclick = redo;
  document.getElementById('clearBtn').onclick = () => { if(confirm('Clear all?')) { ed.value = ''; saveHistory(); update(); } };
  document.getElementById('zoomInBtn').onclick = () => setZoom(state.zoom + 0.2);
  document.getElementById('zoomOutBtn').onclick = () => setZoom(state.zoom - 0.2);
  document.getElementById('fitBtn').onclick = fitToScreen;
  document.getElementById('startEditingBtn').onclick = () => switchTab('editor');
  document.getElementById('layoutBtn').onclick = () => document.getElementById('layoutMenu').classList.toggle('visible');

  document.querySelectorAll('.layout-menu-item').forEach(item => {
    item.onclick = () => { applyLayout(item.dataset.layout); document.getElementById('layoutMenu').classList.remove('visible'); };
  });

  document.querySelectorAll('.quick-chip').forEach(chip => chip.onclick = () => {
    const a = chip.dataset.action;
    if (a === 'domain') insertAtCursor('\n# New Domain Story\n> [note] Notes here\n\n');
    else if (a === 'actor') insertAtCursor('\n@NewActor (person)\n');
    else if (a === 'flow') insertAtCursor('\n## New Flow\n');
    else if (a === 'step') insertAtCursor('\nActor1 action Actor2\n');
    else if (a === 'userstory') insertAtCursor('\n> [user-story] As a [role] I want [goal]\n');
    else if (a === 'requirement') insertAtCursor('\n> [requirement] System must...\n');
  });

  document.getElementById('iconSearch').oninput = e => renderIconGrid('all', e.target.value);
  document.getElementById('iconCategories').onclick = e => {
    if (e.target.classList.contains('icon-category')) {
      document.querySelectorAll('.icon-category').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      renderIconGrid(e.target.dataset.category, document.getElementById('iconSearch').value);
    }
  };

  document.querySelectorAll('.tab').forEach(t => t.onclick = () => switchTab(t.dataset.panel));
  ['helpModal', 'templatesModal', 'iconPickerOverlay'].forEach(id => {
    document.getElementById(id).onclick = e => { if (e.target.id === id) document.getElementById(id).classList.remove('active'); };
  });

  document.getElementById('stepsToggle').onclick = function() {
    this.classList.toggle('collapsed');
    document.getElementById('desktopStepsContainer').style.display = this.classList.contains('collapsed') ? 'none' : 'block';
  };

  document.addEventListener('click', e => { if (!e.target.closest('.layout-dropdown')) document.getElementById('layoutMenu').classList.remove('visible'); });
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' && state.domains.length > 1 && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault(); state.currentDomain = state.currentDomain <= 0 ? state.domains.length - 1 : state.currentDomain - 1; updateVisibleDomain(); renderStorySelector();
    }
    if (e.key === 'ArrowRight' && state.domains.length > 1 && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault(); state.currentDomain = state.currentDomain >= state.domains.length - 1 ? -1 : state.currentDomain + 1; updateVisibleDomain(); renderStorySelector();
    }
    if (e.key === 'Escape') { document.querySelectorAll('.modal-overlay, .icon-picker-overlay').forEach(m => m.classList.remove('active')); }
  });

  setupPinchZoom();
  window.addEventListener('resize', () => { renderSteps(); if (isDesktop()) setTimeout(fitToScreen, 100); });

  saveHistory();
  update();
  if (isDesktop()) setTimeout(fitToScreen, 100);
}

document.addEventListener('DOMContentLoaded', init);
