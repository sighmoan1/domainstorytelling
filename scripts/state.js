// Constants
const FLOW_COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const DOMAIN_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const NOTE_TYPES = {
  'user-story': { icon: 'auto_stories', label: 'User Story' },
  'requirement': { icon: 'checklist', label: 'Requirement' },
  'assumption': { icon: 'psychology', label: 'Assumption' },
  'risk': { icon: 'warning', label: 'Risk' },
  'note': { icon: 'sticky_note_2', label: 'Note' }
};
const ICON_CATEGORIES = {
  suggested: ['person', 'group', 'computer', 'cloud', 'storage', 'description', 'shopping_cart', 'payments', 'email', 'support_agent', 'dashboard', 'archive', 'checklist', 'api', 'folder'],
  people: ['person', 'group', 'groups', 'support_agent', 'engineering', 'supervisor_account', 'badge'],
  tech: ['computer', 'dns', 'storage', 'cloud', 'api', 'database', 'terminal', 'settings', 'dashboard', 'archive']
};
const TEMPLATES = [
  { id: 'evolution', title: 'As-Is → To-Be', icon: 'timeline', desc: 'Domain evolution', content: '# Current State (As-Is)\n> [assumption] Current process is manual\n\n@User (person)\n@Legacy System (computer)\n\n## Manual Process\nUser enters data into Legacy System\n\n# Target State (To-Be)\n> [user-story] As a user I want automated entry\n> [requirement] 99.9% uptime\n\n@User (person)\n@New System (cloud)\n\n## Automated Process\nUser submits to New System' },
  { id: 'simple', title: 'Simple Flow', icon: 'schema', desc: 'Basic example', content: '# My Domain\n> [note] Add notes here\n\n@Customer (person)\n@System (computer)\n\n## Main Flow\nCustomer uses System' },
  { id: 'blank', title: 'Blank', icon: 'note_add', desc: 'Start fresh', content: '# Domain Story\n\n@Actor1 (person)\n@Actor2 (computer)\n\n## Flow\nActor1 action Actor2' }
];

// Application State
const state = {
  domains: [],
  currentDomain: -1,
  participants: {},
  flows: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  canvasSize: { width: 1600, height: 1200 },
  history: [],
  historyIndex: -1,
  errors: []
};

let allIcons = [];
let autocompleteIndex = -1;
