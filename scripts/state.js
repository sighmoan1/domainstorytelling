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
  tech: ['computer', 'dns', 'storage', 'cloud', 'api', 'database', 'terminal', 'settings', 'dashboard', 'archive', 'code', 'folder', 'schedule', 'verified_user']
};
// Examples are loaded from examples.js. A template can contain several separate
// scenarios; each # heading becomes its own diagram.

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
