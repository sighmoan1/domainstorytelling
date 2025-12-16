// Parser functions
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseDomainStory(input) {
  const lines = input.split('\n');
  const domains = [], errors = [];
  let currentDomain = null, currentFlow = null, flowNum = 0;

  lines.forEach((rawLine, lineIdx) => {
    const line = rawLine.trim();
    if (!line) return;
    const lineNum = lineIdx + 1;

    if (line.match(/^#[^#]/)) {
      const title = line.replace(/^#\s*/, '').trim();
      flowNum = 0;
      currentDomain = { title, notes: [], participants: [], flows: [], color: DOMAIN_COLORS[domains.length % DOMAIN_COLORS.length] };
      domains.push(currentDomain);
      currentFlow = null;
      return;
    }

    if (line.startsWith('>')) {
      const noteMatch = line.match(/^>\s*\[(\w+(?:-\w+)?)\]\s*(.+)$/);
      if (noteMatch) {
        const note = { type: noteMatch[1].toLowerCase(), content: noteMatch[2] };
        if (currentDomain) currentDomain.notes.push(note);
      } else {
        const simpleNote = line.replace(/^>\s*/, '');
        if (simpleNote && currentDomain) currentDomain.notes.push({ type: 'note', content: simpleNote });
      }
      return;
    }

    if (!currentDomain) {
      currentDomain = { title: 'Domain Story', notes: [], participants: [], flows: [], color: DOMAIN_COLORS[0] };
      domains.push(currentDomain);
    }

    if (line.startsWith('@')) {
      const m = line.match(/^@(.+?)\s*\((\w+)\)\s*(?:"(.+)")?$/);
      if (m) currentDomain.participants.push({ name: m[1].trim(), icon: m[2].trim(), annotation: m[3] || null });
      else errors.push({ line: lineNum, msg: 'Invalid actor', hint: '@Name (icon)' });
      return;
    }

    if (line.startsWith('##')) {
      flowNum++;
      const title = line.replace(/^#+\s*/, '').trim();
      currentFlow = { number: flowNum, title: title || 'Untitled', steps: [] };
      currentDomain.flows.push(currentFlow);
      return;
    }

    if (line.startsWith('//')) return;

    // Detect if this is a step line: it should reference at least one actor.
    // Commas are treated as regular characters now (no longer required for parsing).
    const mightBeStep = currentDomain.participants.some(p =>
      line.toLowerCase().includes(p.name.toLowerCase())
    );

    if (mightBeStep) {
      if (!currentFlow) {
        errors.push({
          line: lineNum,
          msg: 'Step outside flow',
          hint: 'Add ## Flow first'
        });
        return;
      }

      const actorNames = currentDomain.participants.map(p => p.name);

      // Always use the whitespace-based parser so commas are fully optional.
      // (Old comma-based syntax is still supported because commas can appear inside the action.)
      const parsed = parseStepWhitespace(line, actorNames, lineNum, errors);

      if (parsed) {
        currentFlow.steps.push({ ...parsed, controlX: null, controlY: null });
      }
    }
  });

  return { domains, errors };
}

function parseStep(line, actorNames, lineNum, errors) {
  let annotation = null, workObject = null, cleanLine = line;
  const annM = cleanLine.match(/"([^"]+)"\s*$/);
  if (annM) { annotation = annM[1]; cleanLine = cleanLine.replace(annM[0], '').trim(); }
  const workM = cleanLine.match(/\{([^}]+)\}\s*$/);
  if (workM) { workObject = workM[1].trim(); cleanLine = cleanLine.replace(workM[0], '').trim(); }
  const parts = cleanLine.split(',').map(p => p.trim()).filter(p => p);
  if (parts.length < 2) { errors.push({ line: lineNum, msg: 'Need 2+ parts', hint: 'From, action, To' }); return null; }
  const fromName = parts[0] || '', toName = parts[parts.length - 1] || '';
  const fromMatch = actorNames.find(n => n.toLowerCase() === fromName.toLowerCase());
  const toMatch = actorNames.find(n => n.toLowerCase() === toName.toLowerCase());
  if (!fromMatch) errors.push({ line: lineNum, msg: `Unknown: ${fromName}`, hint: '@' + fromName + ' (icon)' });
  if (!toMatch && toName.toLowerCase() !== fromName.toLowerCase()) errors.push({ line: lineNum, msg: `Unknown: ${toName}`, hint: '@' + toName + ' (icon)' });
  return { from: fromMatch || fromName, action: parts.length > 2 ? parts.slice(1, -1).join(', ') : '', to: toMatch || toName, workObject, annotation };
}

function parseStepWhitespace(line, actorNames, lineNum, errors) {
  let annotation = null, workObject = null, cleanLine = line;

  // Extract annotation (quoted text at end)
  const annM = cleanLine.match(/"([^"]+)"\s*$/);
  if (annM) {
    annotation = annM[1];
    cleanLine = cleanLine.replace(annM[0], '').trim();
  }

  // Extract work object (curly braces at end)
  const workM = cleanLine.match(/\{([^}]+)\}\s*$/);
  if (workM) {
    workObject = workM[1].trim();
    cleanLine = cleanLine.replace(workM[0], '').trim();
  }

  if (!cleanLine) {
    errors.push({ line: lineNum, msg: 'Empty step', hint: 'Actor1 action Actor2' });
    return null;
  }

  // Sort actors by length (descending) for greedy matching
  const sortedActors = [...actorNames].sort((a, b) => b.length - a.length);

  // Find fromActor at start of line
  let fromMatch = null;
  let remainingLine = cleanLine;

  for (const actor of sortedActors) {
    // Case-insensitive match at start with word boundary
    const pattern = new RegExp(`^${escapeRegex(actor)}\\b`, 'i');
    if (pattern.test(cleanLine)) {
      fromMatch = actorNames.find(n => n.toLowerCase() === actor.toLowerCase());
      remainingLine = cleanLine.slice(actor.length).trim();
      break;
    }
  }

  if (!fromMatch) {
    errors.push({
      line: lineNum,
      msg: 'Start actor not found',
      hint: 'Define with @ActorName (icon)'
    });
    return null;
  }

  // Find toActor at end of remaining line
  let toMatch = null;
  let action = remainingLine;

  for (const actor of sortedActors) {
    // Case-insensitive match at end with word boundary
    const pattern = new RegExp(`\\b${escapeRegex(actor)}$`, 'i');
    if (pattern.test(remainingLine)) {
      toMatch = actorNames.find(n => n.toLowerCase() === actor.toLowerCase());
      action = remainingLine.slice(0, remainingLine.length - actor.length).trim();
      break;
    }
  }

  if (!toMatch) {
    errors.push({
      line: lineNum,
      msg: 'End actor not found',
      hint: `Actor1 action ${fromMatch}`
    });
    return null;
  }

  return {
    from: fromMatch,
    action: action || '',
    to: toMatch,
    workObject,
    annotation
  };
}

function validate() {
  const bar = document.getElementById('validationBar'), text = document.getElementById('validationText'), badge = document.getElementById('errorBadge');
  const input = document.getElementById('storyInput').value;
  if (!input.trim()) { bar.className = 'validation-bar'; text.innerHTML = '<span class="material-icons">edit</span> Empty'; badge.style.display = 'none'; return; }
  if (state.errors.length > 0) {
    const err = state.errors[0];
    bar.className = 'validation-bar error';
    text.innerHTML = `<span class="material-icons">error</span> Line ${err.line}: ${err.msg} <code>${err.hint}</code>`;
    badge.textContent = state.errors.length; badge.style.display = 'inline-flex'; return;
  }
  const actors = Object.keys(state.participants).length;
  const steps = state.flows.reduce((s, f) => s + f.steps.length, 0);
  bar.className = 'validation-bar success';
  text.innerHTML = `<span class="material-icons">check_circle</span> ${state.domains.length} domain${state.domains.length !== 1 ? 's' : ''}, ${actors} actors, ${steps} steps`;
  badge.style.display = 'none';
}
