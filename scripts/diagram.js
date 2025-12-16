// Diagram rendering and manipulation
function getActorType(icon) {
  if (ICON_CATEGORIES.people.includes(icon)) return 'person';
  if (ICON_CATEGORIES.tech.includes(icon)) return 'system';
  return 'work';
}

function positionNewParticipants() {
  const unplaced = Object.values(state.participants).filter(p => p.x === null);
  if (!unplaced.length) return;
  const cx = state.canvasSize.width / 2, cy = state.canvasSize.height / 2, r = Math.min(cx, cy) * 0.6;
  unplaced.forEach((p, i) => {
    const angle = (i / unplaced.length) * 2 * Math.PI - Math.PI / 2;
    p.x = cx + Math.cos(angle) * r;
    p.y = cy + Math.sin(angle) * r;
  });
}

function renderParticipants() {
  const canvas = document.getElementById('diagramCanvas');
  canvas.querySelectorAll('.participant').forEach(el => {
    if (!state.participants[el.dataset.key]) {
      const key = el.dataset.key;
      const oldParticipants = Object.values(state.participants);
      const participant = oldParticipants.find(p => p.element === el);
      if (participant?.cleanup) participant.cleanup();
      el.remove();
    }
  });

  // First pass: create elements and set content
  Object.entries(state.participants).forEach(([key, p]) => {
    if (!p.element) {
      const div = document.createElement('div');
      div.className = 'participant'; div.dataset.key = key;
      canvas.appendChild(div); p.element = div;
      makeDraggable(div, p);
    }
    p.element.dataset.type = getActorType(p.icon);
    p.element.innerHTML = `<span class="material-icons">${p.icon}</span><div class="participant-name">${escapeHtml(p.displayName)}</div>${p.annotation ? `<div class="participant-annotation">${escapeHtml(p.annotation)}</div>` : ''}`;
  });

  // Second pass: measure and position (after browser has laid out elements)
  Object.entries(state.participants).forEach(([key, p]) => {
    // Measure dimensions (fixed size - no scaling)
    const measuredW = p.element.offsetWidth;
    const measuredH = p.element.offsetHeight;

    // Cache valid measurements
    if (measuredW > 0) p.cachedWidth = measuredW;
    if (measuredH > 0) p.cachedHeight = measuredH;

    // Use cached dimensions
    const w = p.cachedWidth || 90;
    const h = p.cachedHeight || 70;

    // Position: center element at logical position, transformed to screen coords
    // NO CSS scaling - elements stay fixed size, only positions change with zoom
    p.element.style.left = `${p.x * state.zoom + state.pan.x - w/2}px`;
    p.element.style.top = `${p.y * state.zoom + state.pan.y - h/2}px`;
  });
}

function makeDraggable(el, p) {
  if (p.cleanup) p.cleanup();
  // Always resolve the participant from state by key so dragging
  // keeps working even when state.participants is rebuilt (e.g. when
  // switching domain/story tabs in the layout view).
  const key = el.dataset.key;
  let startX, startY, startPx, startPy, dragging = false;
  // Offset between the cursor and the participant's logical center,
  // so the element stays under the grab point while dragging.
  let cursorOffsetX = 0, cursorOffsetY = 0;
  function onStart(e) {
    const participant = state.participants[key];
    if (!participant) return;
    e.preventDefault();
    dragging = true;
    el.classList.add('dragging');
    const t = e.touches ? e.touches[0] : e;
    startX = t.clientX;
    startY = t.clientY;
    // Use the current logical position as the start point so there is no visual jump
    // when beginning a drag.
    startPx = participant.x;
    startPy = participant.y;
    // Remember where inside the element the cursor grabbed it (in logical coords)
    const cursorLogicalX = (t.clientX - state.pan.x) / state.zoom;
    const cursorLogicalY = (t.clientY - state.pan.y) / state.zoom;
    cursorOffsetX = participant.x - cursorLogicalX;
    cursorOffsetY = participant.y - cursorLogicalY;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }
  function onMove(e) {
    if (!dragging) return;
    const participant = state.participants[key];
    if (!participant) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    // Convert cursor position to logical coords and keep the original grab offset
    const cursorLogicalX = (t.clientX - state.pan.x) / state.zoom;
    const cursorLogicalY = (t.clientY - state.pan.y) / state.zoom;
    participant.x = cursorLogicalX + cursorOffsetX;
    participant.y = cursorLogicalY + cursorOffsetY;
    // Position element (fixed size, no CSS scaling)
    const w = participant.cachedWidth || 90;
    const h = participant.cachedHeight || 70;
    el.style.left = `${participant.x * state.zoom + state.pan.x - w/2}px`;
    el.style.top = `${participant.y * state.zoom + state.pan.y - h/2}px`;
    renderFlows();
  }
  function onEnd() {
    dragging = false;
    el.classList.remove('dragging');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
    renderParticipants();
    renderFlows();
  }
  el.addEventListener('mousedown', onStart);
  el.addEventListener('touchstart', onStart, { passive: false });
  p.cleanup = () => {
    el.removeEventListener('mousedown', onStart);
    el.removeEventListener('touchstart', onStart);
    if (dragging) onEnd();
  };
}

// Convert logical coordinates to screen coordinates
function toScreen(x, y) {
  return {
    x: x * state.zoom + state.pan.x,
    y: y * state.zoom + state.pan.y
  };
}

function renderFlows() {
  const svg = document.getElementById('diagramSvg');
  svg.innerHTML = '';
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  FLOW_COLORS.forEach((c, i) => {
    const m = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    m.setAttribute('id', `arrow-${i}`); m.setAttribute('markerWidth', '8'); m.setAttribute('markerHeight', '8');
    m.setAttribute('refX', '7'); m.setAttribute('refY', '3'); m.setAttribute('orient', 'auto');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0,0 L0,6 L8,3 Z'); path.setAttribute('fill', c);
    m.appendChild(path); defs.appendChild(m);
  });
  svg.appendChild(defs);
  const actorKeys = Object.keys(state.participants);

  state.flows.forEach((flow, fi) => {
    const color = FLOW_COLORS[fi % FLOW_COLORS.length];
    flow.steps.forEach((step, si) => {
      const fromKey = actorKeys.find(k => {
        const p = state.participants[k];
        // In "All" view we ignore domainIndex so shared actors are reused
        if (state.currentDomain === -1) {
          return p.displayName === step.from;
        }
        // In per-domain view, keep the domainIndex filter
        return p.displayName === step.from &&
          (typeof flow.domainIndex !== 'number' || p.domainIndex === flow.domainIndex);
      });
      const toKey = actorKeys.find(k => {
        const p = state.participants[k];
        if (state.currentDomain === -1) {
          return p.displayName === step.to;
        }
        return p.displayName === step.to &&
          (typeof flow.domainIndex !== 'number' || p.domainIndex === flow.domainIndex);
      });
      const fromP = state.participants[fromKey], toP = state.participants[toKey];
      if (!fromP || !toP) return;

      if (step.controlX === null) {
        const mx = (fromP.x + toP.x) / 2, my = (fromP.y + toP.y) / 2;
        const dx = toP.x - fromP.x, dy = toP.y - fromP.y, len = Math.sqrt(dx*dx + dy*dy) || 1;
        const offset = (si - (flow.steps.length - 1) / 2) * 50;
        step.controlX = mx + (-dy / len) * offset;
        step.controlY = my + (dx / len) * offset;
      }

      const fromE = getBoxEdge(fromP, step.controlX, step.controlY);
      const toE = getBoxEdge(toP, step.controlX, step.controlY);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      // No transform on g - we compute screen coordinates directly to match HTML elements

      // Convert logical coordinates to screen coordinates
      const fromScreen = toScreen(fromE.x, fromE.y);
      const toScreen_ = toScreen(toE.x, toE.y);
      const ctrlScreen = toScreen(step.controlX, step.controlY);

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', `M ${fromScreen.x},${fromScreen.y} Q ${ctrlScreen.x},${ctrlScreen.y} ${toScreen_.x},${toScreen_.y}`);
      pathEl.setAttribute('stroke', color); pathEl.classList.add('flow-path');
      pathEl.setAttribute('stroke-width', 2); // Fixed size
      pathEl.setAttribute('marker-end', `url(#arrow-${fi % FLOW_COLORS.length})`);
      g.appendChild(pathEl);

      const badgePos = bezierPoint(0.15, fromE, { x: step.controlX, y: step.controlY }, toE);
      const badgeScreen = toScreen(badgePos.x, badgePos.y);
      const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      badge.setAttribute('cx', badgeScreen.x); badge.setAttribute('cy', badgeScreen.y - 12);
      badge.setAttribute('r', 9); badge.setAttribute('fill', color); g.appendChild(badge);
      const bt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      bt.setAttribute('x', badgeScreen.x); bt.setAttribute('y', badgeScreen.y - 8);
      bt.setAttribute('text-anchor', 'middle'); bt.classList.add('step-badge');
      bt.setAttribute('font-size', 9);
      bt.textContent = `${flow.number}.${si + 1}`; g.appendChild(bt);

      if (step.action) {
        const labelPos = bezierPoint(0.5, fromE, { x: step.controlX, y: step.controlY }, toE);
        const labelScreen = toScreen(labelPos.x, labelPos.y);
        const tm = measureText(step.action, 10);
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', labelScreen.x - tm.width/2 - 5);
        bg.setAttribute('y', labelScreen.y - 20);
        bg.setAttribute('width', tm.width + 10);
        bg.setAttribute('height', 16);
        bg.setAttribute('rx', 3); bg.classList.add('flow-label-bg'); g.appendChild(bg);
        const tx = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tx.setAttribute('x', labelScreen.x); tx.setAttribute('y', labelScreen.y - 9);
        tx.setAttribute('text-anchor', 'middle'); tx.classList.add('flow-label');
        tx.setAttribute('font-size', 10);
        tx.textContent = step.action; g.appendChild(tx);
      }

      if (step.workObject) {
        const woPos = bezierPoint(0.8, fromE, { x: step.controlX, y: step.controlY }, toE);
        const woScreen = toScreen(woPos.x, woPos.y);
        const tm = measureText(step.workObject, 9);
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', woScreen.x - tm.width/2 - 6);
        r.setAttribute('y', woScreen.y + 8);
        r.setAttribute('width', tm.width + 12);
        r.setAttribute('height', 14);
        r.setAttribute('rx', 3); r.classList.add('work-object-box'); g.appendChild(r);
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', woScreen.x); t.setAttribute('y', woScreen.y + 18);
        t.setAttribute('text-anchor', 'middle'); t.classList.add('work-object-text');
        t.setAttribute('font-size', 9);
        t.textContent = step.workObject; g.appendChild(t);
      }

      if (step.annotation) {
        const annPos = bezierPoint(step.workObject ? 0.65 : 0.75, fromE, { x: step.controlX, y: step.controlY }, toE);
        const annScreen = toScreen(annPos.x, annPos.y);
        const tm = measureText(step.annotation, 9);
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', annScreen.x - tm.width/2 - 6);
        r.setAttribute('y', annScreen.y - 20);
        r.setAttribute('width', tm.width + 12);
        r.setAttribute('height', 14);
        r.setAttribute('rx', 3); r.classList.add('annotation-box'); g.appendChild(r);
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', annScreen.x); t.setAttribute('y', annScreen.y - 10);
        t.setAttribute('text-anchor', 'middle'); t.classList.add('annotation-text');
        t.setAttribute('font-size', 9);
        t.textContent = step.annotation; g.appendChild(t);
      }

      const handle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      handle.setAttribute('cx', ctrlScreen.x); handle.setAttribute('cy', ctrlScreen.y);
      handle.setAttribute('r', 6); handle.classList.add('control-handle');
      g.appendChild(handle);
      makeHandleDraggable(handle, step);
      svg.appendChild(g);
    });
  });
}

function makeHandleDraggable(h, step) {
  let dragging = false, startX, startY, startCX, startCY;
  function onStart(e) { e.preventDefault(); e.stopPropagation(); dragging = true; const t = e.touches ? e.touches[0] : e; startX = t.clientX; startY = t.clientY; startCX = step.controlX; startCY = step.controlY; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onEnd); document.addEventListener('touchmove', onMove, { passive: false }); document.addEventListener('touchend', onEnd); }
  function onMove(e) { if (!dragging) return; e.preventDefault(); const t = e.touches ? e.touches[0] : e; step.controlX = startCX + (t.clientX - startX) / state.zoom; step.controlY = startCY + (t.clientY - startY) / state.zoom; renderFlows(); }
  function onEnd() { dragging = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onEnd); document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); }
  h.style.pointerEvents = 'all'; h.addEventListener('mousedown', onStart); h.addEventListener('touchstart', onStart, { passive: false });
}

function getBoxEdge(p, toX, toY) {
  if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') {
    return { x: toX || 0, y: toY || 0 };
  }
  // Get fixed pixel dimensions
  const elW = p.cachedWidth || p.element?.offsetWidth || 90;
  const elH = p.cachedHeight || p.element?.offsetHeight || 70;
  // Convert pixel size to logical size (since participants are fixed pixel size)
  // Add small padding (6px) for arrow clearance
  const w = (elW / 2 + 6) / state.zoom;
  const h = (elH / 2 + 6) / state.zoom;
  const dx = toX - p.x, dy = toY - p.y;
  if (dx === 0 && dy === 0) return { x: p.x, y: p.y };
  const scale = Math.min(w / Math.abs(dx || 0.001), h / Math.abs(dy || 0.001));
  return { x: p.x + dx * scale, y: p.y + dy * scale };
}

function bezierPoint(t, p0, p1, p2) {
  const mt = 1 - t;
  return { x: mt*mt*p0.x + 2*mt*t*p1.x + t*t*p2.x, y: mt*mt*p0.y + 2*mt*t*p1.y + t*t*p2.y };
}

function measureText(text, size) {
  const el = document.getElementById('measureText');
  el.setAttribute('font-size', size);
  el.textContent = text;
  return el.getBBox();
}

function applyLayout(type) {
  const actors = Object.values(state.participants);
  if (!actors.length) return;
  const cx = state.canvasSize.width / 2, cy = state.canvasSize.height / 2, padding = 150;
  state.flows.forEach(f => f.steps.forEach(s => { s.controlX = null; s.controlY = null; }));

  if (type === 'circular') {
    const radius = Math.min(cx, cy) - padding;
    actors.forEach((p, i) => { const angle = (i / actors.length) * 2 * Math.PI - Math.PI / 2; p.x = cx + Math.cos(angle) * radius; p.y = cy + Math.sin(angle) * radius; });
  } else if (type === 'grid') {
    const cols = Math.ceil(Math.sqrt(actors.length));
    const cellW = (state.canvasSize.width - padding * 2) / cols;
    const cellH = (state.canvasSize.height - padding * 2) / Math.ceil(actors.length / cols);
    actors.forEach((p, i) => { p.x = padding + (i % cols) * cellW + cellW / 2; p.y = padding + Math.floor(i / cols) * cellH + cellH / 2; });
  } else if (type === 'flow') {
    const levels = new Map(), visited = new Set(), actorKeys = Object.keys(state.participants);
    const targets = new Set();
    state.flows.forEach(f => f.steps.forEach(s => {
      const tk = actorKeys.find(k => {
        const p = state.participants[k];
        return p.displayName === s.to &&
          (typeof f.domainIndex !== 'number' || p.domainIndex === f.domainIndex);
      });
      if (tk) targets.add(tk);
    }));
    const roots = actorKeys.filter(k => !targets.has(k));
    if (!roots.length && actorKeys.length) roots.push(actorKeys[0]);
    let queue = roots.map(k => ({ key: k, level: 0 }));
    roots.forEach(k => { levels.set(k, 0); visited.add(k); });
    while (queue.length) {
      const { key, level } = queue.shift();
      const actor = state.participants[key];
      state.flows.forEach(f => {
        f.steps.forEach(s => {
          const fromMatches = s.from === actor.displayName &&
            (typeof f.domainIndex !== 'number' || actor.domainIndex === f.domainIndex);
          if (!fromMatches) return;
          const tk = actorKeys.find(k => {
            const p = state.participants[k];
            return p.displayName === s.to &&
              (typeof f.domainIndex !== 'number' || p.domainIndex === f.domainIndex);
          });
          if (tk && !visited.has(tk)) {
            levels.set(tk, level + 1);
            visited.add(tk);
            queue.push({ key: tk, level: level + 1 });
          }
        });
      });
    }
    actorKeys.forEach(k => { if (!levels.has(k)) levels.set(k, levels.size); });
    const byLevel = {};
    levels.forEach((lvl, key) => { if (!byLevel[lvl]) byLevel[lvl] = []; byLevel[lvl].push(key); });
    const numLevels = Object.keys(byLevel).length;
    const levelWidth = (state.canvasSize.width - padding * 2) / Math.max(numLevels, 1);
    Object.entries(byLevel).forEach(([lvl, keys]) => {
      const levelHeight = (state.canvasSize.height - padding * 2) / keys.length;
      keys.forEach((key, i) => { const p = state.participants[key]; p.x = padding + parseInt(lvl) * levelWidth + levelWidth / 2; p.y = padding + i * levelHeight + levelHeight / 2; });
    });
  } else if (type === 'force') {
    const iterations = 80, repulsion = 18000, attraction = 0.04, damping = 0.85;
    const actorKeys = Object.keys(state.participants);
    const edges = [];
    state.flows.forEach(f => f.steps.forEach(s => {
      const fk = actorKeys.find(k => {
        const p = state.participants[k];
        return p.displayName === s.from &&
          (typeof f.domainIndex !== 'number' || p.domainIndex === f.domainIndex);
      });
      const tk = actorKeys.find(k => {
        const p = state.participants[k];
        return p.displayName === s.to &&
          (typeof f.domainIndex !== 'number' || p.domainIndex === f.domainIndex);
      });
      if (fk && tk) edges.push({ from: fk, to: tk });
    }));
    const vel = {};
    actorKeys.forEach(k => { vel[k] = { x: 0, y: 0 }; });
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < actorKeys.length; i++) {
        for (let j = i + 1; j < actorKeys.length; j++) {
          const a = state.participants[actorKeys[i]], b = state.participants[actorKeys[j]];
          const dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const force = repulsion / (dist * dist), fx = (dx / dist) * force, fy = (dy / dist) * force;
          vel[actorKeys[i]].x -= fx; vel[actorKeys[i]].y -= fy;
          vel[actorKeys[j]].x += fx; vel[actorKeys[j]].y += fy;
        }
      }
      edges.forEach(e => {
        const a = state.participants[e.from], b = state.participants[e.to];
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx*dx + dy*dy) || 1;
        const force = dist * attraction, fx = (dx / dist) * force, fy = (dy / dist) * force;
        vel[e.from].x += fx; vel[e.from].y += fy;
        vel[e.to].x -= fx; vel[e.to].y -= fy;
      });
      actorKeys.forEach(k => {
        const p = state.participants[k];
        p.x += vel[k].x; p.y += vel[k].y;
        vel[k].x *= damping; vel[k].y *= damping;
        p.x = Math.max(padding, Math.min(state.canvasSize.width - padding, p.x));
        p.y = Math.max(padding, Math.min(state.canvasSize.height - padding, p.y));
      });
    }
  }
  renderParticipants(); renderFlows(); fitToScreen(); showToast(`Applied ${type} layout`);
}

function setZoom(z) {
  state.zoom = Math.max(0.2, Math.min(2, z));
  document.getElementById('zoomIndicator').textContent = `${Math.round(state.zoom * 100)}%`;
  renderParticipants();
  renderFlows();
}

function fitToScreen() {
  const ps = Object.values(state.participants);
  if (!ps.length) return;
  const rect = document.getElementById('diagramContainer').getBoundingClientRect();

  // Find bounding box of all participants in logical space
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  ps.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  // Add padding in logical space
  const logicalPadding = 100;
  minX -= logicalPadding;
  maxX += logicalPadding;
  minY -= logicalPadding;
  maxY += logicalPadding;

  const w = maxX - minX, h = maxY - minY;
  const screenPad = 40; // Padding in screen pixels

  // Calculate zoom to fit content
  state.zoom = Math.min(
    (rect.width - screenPad * 2) / w,
    (rect.height - screenPad * 2) / h,
    1.5
  );

  // Center the content
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  state.pan.x = rect.width / 2 - centerX * state.zoom;
  state.pan.y = rect.height / 2 - centerY * state.zoom;

  document.getElementById('zoomIndicator').textContent = `${Math.round(state.zoom * 100)}%`;
  renderParticipants(); renderFlows();
}

function setupPinchZoom() {
  let lastDist = 0;
  const container = document.getElementById('diagramContainer');
  container.addEventListener('touchstart', e => { if (e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY; lastDist = Math.sqrt(dx*dx + dy*dy); } }, { passive: true });
  container.addEventListener('touchmove', e => { if (e.touches.length === 2) { const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY, dist = Math.sqrt(dx*dx + dy*dy); if (lastDist > 0) setZoom(state.zoom + (dist - lastDist) * 0.004); lastDist = dist; } }, { passive: true });
  container.addEventListener('touchend', () => { lastDist = 0; });
}

async function exportPNG() {
  showToast('Exporting...');

  // 16:9 PowerPoint slide dimensions
  const exportWidth = 1920;
  const exportHeight = 1080;

  // Get steps content
  const stepsHtml = document.getElementById('stepsContainer').innerHTML;
  const hasSteps = stepsHtml.trim() && !stepsHtml.includes('empty-state');

  // Layout: diagram takes ~70% width if there are steps, 100% otherwise
  const storyPanelWidth = hasSteps ? 380 : 0;
  const diagramWidth = exportWidth - storyPanelWidth;
  const diagramHeight = exportHeight;

  // Calculate bounding box of all participants in logical space
  const ps = Object.values(state.participants);
  if (!ps.length) {
    showToast('No diagram to export');
    return;
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  ps.forEach(p => {
    const w = (p.cachedWidth || 90) / 2 + 20;
    const h = (p.cachedHeight || 70) / 2 + 20;
    minX = Math.min(minX, p.x - w);
    maxX = Math.max(maxX, p.x + w);
    minY = Math.min(minY, p.y - h);
    maxY = Math.max(maxY, p.y + h);
  });

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const contentCenterX = (minX + maxX) / 2;
  const contentCenterY = (minY + maxY) / 2;

  // Calculate scale to fit diagram in available space with padding
  const padding = 60;
  const availableWidth = diagramWidth - padding * 2;
  const availableHeight = diagramHeight - padding * 2;
  const exportScale = Math.min(
    availableWidth / contentWidth,
    availableHeight / contentHeight,
    2.5
  );

  // Centre of the diagram area
  const diagramCenterX = diagramWidth / 2;
  const diagramCenterY = diagramHeight / 2;

  // Build export container
  const exportContainer = document.getElementById('exportContainer');
  exportContainer.innerHTML = '';
  exportContainer.style.cssText = `position:absolute;left:0;top:0;width:${exportWidth}px;height:${exportHeight}px;background:white;display:flex;`;

  // Create diagram section
  const diagramSection = document.createElement('div');
  diagramSection.style.cssText = `width:${diagramWidth}px;height:${diagramHeight}px;position:relative;background:#fafafa;overflow:hidden;`;

  // Create SVG for flows
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;`;

  // Add arrow markers
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  FLOW_COLORS.forEach((c, i) => {
    const m = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    m.setAttribute('id', `export-arrow-${i}`);
    m.setAttribute('markerWidth', '8');
    m.setAttribute('markerHeight', '8');
    m.setAttribute('refX', '7');
    m.setAttribute('refY', '3');
    m.setAttribute('orient', 'auto');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M0,0 L0,6 L8,3 Z');
    path.setAttribute('fill', c);
    m.appendChild(path);
    defs.appendChild(m);
  });
  svg.appendChild(defs);

  // Helper to convert logical coords to export coords
  function toExport(x, y) {
    return {
      x: diagramCenterX + (x - contentCenterX) * exportScale,
      y: diagramCenterY + (y - contentCenterY) * exportScale
    };
  }

  // Render participants
  const participantContainer = document.createElement('div');
  participantContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';

  Object.values(state.participants).forEach(p => {
    const pos = toExport(p.x, p.y);
    const div = document.createElement('div');
    div.style.cssText = `
      position:absolute;
      background:white;
      border:2px solid #e2e8f0;
      border-radius:12px;
      padding:10px 8px;
      text-align:center;
      box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);
      min-width:80px;
      max-width:120px;
      transform:translate(-50%, -50%);
      left:${pos.x}px;
      top:${pos.y}px;
    `;

    const type = getActorType(p.icon);
    const colors = {
      person: { border: '#c7d2fe', icon: '#6366f1' },
      system: { border: '#a7f3d0', icon: '#10b981' },
      work: { border: '#fbcfe8', icon: '#ec4899' }
    };
    const color = colors[type] || colors.work;
    div.style.borderColor = color.border;

    div.innerHTML = `
      <span class="material-icons" style="font-size:28px;margin-bottom:4px;color:${color.icon};display:block;">${p.icon}</span>
      <div style="font-size:11px;font-weight:600;word-wrap:break-word;line-height:1.25;">${escapeHtml(p.displayName)}</div>
      ${p.annotation ? `<div style="font-size:9px;color:#64748b;margin-top:3px;font-style:italic;">${escapeHtml(p.annotation)}</div>` : ''}
    `;
    participantContainer.appendChild(div);
  });

  // Helper to get box edge - returns screen coordinates directly
  // The participant boxes are fixed pixel size in the export, so we need to
  // calculate the edge in screen space, not logical space
  function getExportEdge(p, toX, toY) {
    if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') {
      const fallback = toExport(toX || 0, toY || 0);
      return fallback;
    }
    // Get screen positions
    const pScreen = toExport(p.x, p.y);
    const toScreen = toExport(toX, toY);

    // Fixed pixel size for participant boxes (half-width + padding for arrow)
    const boxHalfW = 50;
    const boxHalfH = 40;

    const dx = toScreen.x - pScreen.x;
    const dy = toScreen.y - pScreen.y;
    if (dx === 0 && dy === 0) return pScreen;

    // Find intersection with box edge
    const scale = Math.min(boxHalfW / Math.abs(dx || 0.001), boxHalfH / Math.abs(dy || 0.001));
    return {
      x: pScreen.x + dx * scale,
      y: pScreen.y + dy * scale
    };
  }

  // Render flows
  const actorKeys = Object.keys(state.participants);
  state.flows.forEach((flow, fi) => {
    const color = FLOW_COLORS[fi % FLOW_COLORS.length];
    flow.steps.forEach((step, si) => {
      const fromKey = actorKeys.find(k => {
        const p = state.participants[k];
        if (state.currentDomain === -1) return p.displayName === step.from;
        return p.displayName === step.from && (typeof flow.domainIndex !== 'number' || p.domainIndex === flow.domainIndex);
      });
      const toKey = actorKeys.find(k => {
        const p = state.participants[k];
        if (state.currentDomain === -1) return p.displayName === step.to;
        return p.displayName === step.to && (typeof flow.domainIndex !== 'number' || p.domainIndex === flow.domainIndex);
      });
      const fromP = state.participants[fromKey], toP = state.participants[toKey];
      if (!fromP || !toP) return;

      // Use existing control points or calculate default
      let ctrlX = step.controlX, ctrlY = step.controlY;
      if (ctrlX === null) {
        const mx = (fromP.x + toP.x) / 2, my = (fromP.y + toP.y) / 2;
        const dx = toP.x - fromP.x, dy = toP.y - fromP.y, len = Math.sqrt(dx*dx + dy*dy) || 1;
        const offset = (si - (flow.steps.length - 1) / 2) * 50;
        ctrlX = mx + (-dy / len) * offset;
        ctrlY = my + (dx / len) * offset;
      }

      // Get edge points in screen coordinates
      const fromScreen = getExportEdge(fromP, ctrlX, ctrlY);
      const toScreen = getExportEdge(toP, ctrlX, ctrlY);
      const ctrlScreen = toExport(ctrlX, ctrlY);

      // Draw path
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', `M ${fromScreen.x},${fromScreen.y} Q ${ctrlScreen.x},${ctrlScreen.y} ${toScreen.x},${toScreen.y}`);
      pathEl.setAttribute('stroke', color);
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('stroke-width', '2');
      pathEl.setAttribute('stroke-linecap', 'round');
      pathEl.setAttribute('marker-end', `url(#export-arrow-${fi % FLOW_COLORS.length})`);
      svg.appendChild(pathEl);

      // Step badge - use participant centers for badge positioning, not edges
      const badgePos = bezierPoint(0.15, { x: fromP.x, y: fromP.y }, { x: ctrlX, y: ctrlY }, { x: toP.x, y: toP.y });
      const badgeScreen = toExport(badgePos.x, badgePos.y);
      const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      badge.setAttribute('cx', badgeScreen.x);
      badge.setAttribute('cy', badgeScreen.y - 12);
      badge.setAttribute('r', '9');
      badge.setAttribute('fill', color);
      svg.appendChild(badge);
      const bt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      bt.setAttribute('x', badgeScreen.x);
      bt.setAttribute('y', badgeScreen.y - 8);
      bt.setAttribute('text-anchor', 'middle');
      bt.setAttribute('fill', 'white');
      bt.setAttribute('font-size', '9');
      bt.setAttribute('font-weight', '700');
      bt.textContent = `${flow.number}.${si + 1}`;
      svg.appendChild(bt);

      // Action label
      if (step.action) {
        const labelPos = bezierPoint(0.5, { x: fromP.x, y: fromP.y }, { x: ctrlX, y: ctrlY }, { x: toP.x, y: toP.y });
        const labelScreen = toExport(labelPos.x, labelPos.y);
        const tm = measureText(step.action, 10);
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', labelScreen.x - tm.width/2 - 5);
        bg.setAttribute('y', labelScreen.y - 20);
        bg.setAttribute('width', tm.width + 10);
        bg.setAttribute('height', '16');
        bg.setAttribute('rx', '3');
        bg.setAttribute('fill', 'white');
        bg.setAttribute('stroke', '#e2e8f0');
        svg.appendChild(bg);
        const tx = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tx.setAttribute('x', labelScreen.x);
        tx.setAttribute('y', labelScreen.y - 9);
        tx.setAttribute('text-anchor', 'middle');
        tx.setAttribute('fill', '#1e293b');
        tx.setAttribute('font-size', '10');
        tx.setAttribute('font-weight', '500');
        tx.textContent = step.action;
        svg.appendChild(tx);
      }

      // Work object
      if (step.workObject) {
        const woPos = bezierPoint(0.8, { x: fromP.x, y: fromP.y }, { x: ctrlX, y: ctrlY }, { x: toP.x, y: toP.y });
        const woScreen = toExport(woPos.x, woPos.y);
        const tm = measureText(step.workObject, 9);
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', woScreen.x - tm.width/2 - 6);
        r.setAttribute('y', woScreen.y + 8);
        r.setAttribute('width', tm.width + 12);
        r.setAttribute('height', '14');
        r.setAttribute('rx', '3');
        r.setAttribute('fill', '#fce7f3');
        r.setAttribute('stroke', '#ec4899');
        r.setAttribute('stroke-width', '1.5');
        svg.appendChild(r);
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', woScreen.x);
        t.setAttribute('y', woScreen.y + 18);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('fill', '#be185d');
        t.setAttribute('font-size', '9');
        t.setAttribute('font-weight', '500');
        t.textContent = step.workObject;
        svg.appendChild(t);
      }

      // Annotation
      if (step.annotation) {
        const annPos = bezierPoint(step.workObject ? 0.65 : 0.75, { x: fromP.x, y: fromP.y }, { x: ctrlX, y: ctrlY }, { x: toP.x, y: toP.y });
        const annScreen = toExport(annPos.x, annPos.y);
        const tm = measureText(step.annotation, 9);
        const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        r.setAttribute('x', annScreen.x - tm.width/2 - 6);
        r.setAttribute('y', annScreen.y - 20);
        r.setAttribute('width', tm.width + 12);
        r.setAttribute('height', '14');
        r.setAttribute('rx', '3');
        r.setAttribute('fill', '#fef3c7');
        r.setAttribute('stroke', '#fbbf24');
        svg.appendChild(r);
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', annScreen.x);
        t.setAttribute('y', annScreen.y - 10);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('fill', '#92400e');
        t.setAttribute('font-size', '9');
        t.textContent = step.annotation;
        svg.appendChild(t);
      }
    });
  });

  diagramSection.appendChild(svg);
  diagramSection.appendChild(participantContainer);
  exportContainer.appendChild(diagramSection);

  // Create story panel on the right
  if (hasSteps) {
    const storyPanel = document.createElement('div');
    storyPanel.style.cssText = `
      width:${storyPanelWidth}px;
      height:${exportHeight}px;
      background:white;
      border-left:2px solid #e2e8f0;
      padding:30px 24px;
      box-sizing:border-box;
      overflow:hidden;
      display:flex;
      flex-direction:column;
    `;

    // Title
    const title = document.createElement('h2');
    title.style.cssText = 'font-size:18px;font-weight:600;margin-bottom:20px;color:#1e293b;flex-shrink:0;';
    title.textContent = 'Story';
    storyPanel.appendChild(title);

    // Steps content
    const stepsContent = document.createElement('div');
    stepsContent.style.cssText = 'flex:1;overflow:hidden;font-size:13px;line-height:1.6;color:#374151;';
    stepsContent.innerHTML = stepsHtml;

    // Remove domain headers from export (they're redundant)
    stepsContent.querySelectorAll('.domain-header').forEach(el => el.remove());

    storyPanel.appendChild(stepsContent);
    exportContainer.appendChild(storyPanel);
  }

  await new Promise(r => setTimeout(r, 200));

  try {
    const canvas = await html2canvas(exportContainer, {
      backgroundColor: '#ffffff',
      scale: 2,
      width: exportWidth,
      height: exportHeight,
      useCORS: true
    });
    const link = document.createElement('a');
    link.download = 'domain-story.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Exported!');
  } catch (e) {
    console.error('Export failed:', e);
    showToast('Export failed');
  }

  exportContainer.style.left = '-9999px';
}
