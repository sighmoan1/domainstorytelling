// Simplified rendering functions
function renderSteps() {
  const visible = state.currentDomain === -1 ? state.domains : (state.domains[state.currentDomain] ? [state.domains[state.currentDomain]] : []);
  let html = '';

  visible.forEach(domain => {
    html += `<div class="domain-header" style="background:${domain.color}"><h2><span class="material-icons">folder</span>${domain.title}</h2></div>`;
    html += '<div class="story-text">';

    const domainFlows = state.flows
      .filter(f => f.domainTitle === domain.title)
      .sort((a, b) => (a.number || 0) - (b.number || 0));

    domainFlows.forEach(flow => {
      const flowNumber = flow.number || 0;
      html += `<div class="flow-title"><span class="flow-number">${flowNumber}.</span> ${flow.title}</div>`;

      flow.steps.forEach((step, stepIdx) => {
        const stepNumber = `${flowNumber}.${stepIdx + 1}`;
        // Build simple sentence: "From action To"
        let sentence = `${step.from}`;
        if (step.action) {
          sentence += ` ${step.action}`;
        }
        sentence += ` ${step.to}`;

        // Add work object if present
        if (step.workObject) {
          sentence += `. <span class="work-object">${escapeHtml(step.workObject)}</span>`;
        }

        // Add annotation/note if present
        if (step.annotation) {
          sentence += `. <span class="note">${escapeHtml(step.annotation)}</span>`;
        }

        html += `<p><span class="step-number">${stepNumber}</span> ${sentence}.</p>`;
      });
    });

    html += '</div>';
  });

  if (!html) html = '<div class="empty-state"><span class="material-icons">format_list_numbered</span><p>Steps will appear here</p></div>';

  document.getElementById('stepsContainer').innerHTML = html;
  document.getElementById('desktopStepsContainer').innerHTML = html;

  const desktopSteps = document.getElementById('desktopSteps');
  if (isDesktop() && state.flows.length > 0) desktopSteps.style.display = 'block';
  else if (isDesktop()) desktopSteps.style.display = 'none';
}

function renderStorySelector() {
  const selector = document.getElementById('storySelector');
  if (state.domains.length <= 1) { selector.classList.remove('visible'); return; }
  selector.classList.add('visible');
  const tabs = state.domains.map((d, i) =>
    `<button class="story-tab${state.currentDomain === i ? ' active' : ''}" data-index="${i}" style="${state.currentDomain === i ? 'background:' + d.color : ''}">${d.title}</button>`
  ).join('');
  selector.innerHTML = `<button class="story-tab${state.currentDomain === -1 ? ' active' : ''}" data-index="-1">All</button>${tabs}`;
  selector.querySelectorAll('.story-tab').forEach(tab => {
    tab.onclick = () => { state.currentDomain = parseInt(tab.dataset.index); updateVisibleDomain(); renderStorySelector(); };
  });
}

function updateVisibleDomain() {
  const visible = state.currentDomain === -1 ? state.domains : (state.domains[state.currentDomain] ? [state.domains[state.currentDomain]] : []);
  const newParticipants = {};
  const showingAll = state.currentDomain === -1;

  visible.forEach(domain => {
    const domainIndex = state.domains.indexOf(domain);
    domain.participants.forEach(p => {
      // In "All" view we want a single node per actor name (no per-domain duplication)
      const key = showingAll ? p.name : p.name;
      if (!newParticipants[key]) {
        newParticipants[key] = {
          ...p,
          // For "All" view, omit a specific domainIndex so actors can be reused
          domainIndex: showingAll ? undefined : domainIndex,
          displayName: p.name,
          x: null,
          y: null
        };
      }
    });
  });
  Object.entries(state.participants).forEach(([key, p]) => {
    if (newParticipants[key]) { newParticipants[key].x = p.x; newParticipants[key].y = p.y; newParticipants[key].element = p.element; }
    else if (p.element) p.element.remove();
  });
  state.participants = newParticipants;
  state.flows = [];
  visible.forEach(domain => {
    const domainIndex = state.domains.indexOf(domain);
    domain.flows.forEach(f => state.flows.push({
      ...f,
      domainTitle: domain.title,
      domainColor: domain.color,
      domainIndex
    }));
  });
  positionNewParticipants();
  renderParticipants();
  renderFlows();
  renderSteps();
  fitToScreen();
}

function update() {
  const input = document.getElementById('storyInput').value;
  const { domains, errors } = parseDomainStory(input);
  state.domains = domains;
  state.errors = errors;
  if (state.currentDomain >= state.domains.length) state.currentDomain = -1;
  updateVisibleDomain();
  renderStorySelector();
  validate();
  document.getElementById('emptyState').style.display = Object.keys(state.participants).length ? 'none' : 'flex';
}
