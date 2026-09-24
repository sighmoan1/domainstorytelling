const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const context = vm.createContext({});
for (const file of ['scripts/state.js', 'scripts/examples.js', 'scripts/parser.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
}
const templates = vm.runInContext('TEMPLATES', context);
const parse = vm.runInContext('parseDomainStory', context);

test('every example has complete, separate, parseable scenarios', () => {
  for (const template of templates) {
    const { domains, errors } = parse(template.content);
    assert.equal(errors.length, 0, `${template.id}: ${JSON.stringify(errors)}`);
    assert.ok(domains.length > 0, template.id);
    for (const domain of domains) {
      assert.ok(domain.flows.length > 0, domain.title);
      assert.ok(domain.flows.every(flow => flow.steps.length > 0), domain.title);
      assert.ok(domain.flows.every(flow => flow.steps.every(step => step.from && step.to && step.action && step.workObject)), domain.title);
    }
  }
});

test('server-mediated and direct browser access remain visibly different', () => {
  const server = parse(templates.find(t => t.id === 'managed-server').content).domains[1];
  const direct = parse(templates.find(t => t.id === 'managed-direct').content).domains[1];
  assert.ok(server.flows[0].steps.some(s => s.from === 'App Server' && s.to === 'Supabase API'));
  assert.ok(direct.flows[0].steps.some(s => s.from === 'Browser App' && s.to === 'Supabase API'));
  assert.ok(direct.flows[0].steps.some(s => s.annotation === 'row-level security'));
});

test('a copy is explicit in the ingestion example and absent from the connector example', () => {
  const copy = parse(templates.find(t => t.id === 'drive-copy').content).domains[0];
  const connector = parse(templates.find(t => t.id === 'drive-gemini').content).domains[0];
  assert.ok(copy.flows[0].steps.some(s => s.to === 'Postgres' && s.workObject === 'Derived records'));
  assert.ok(!connector.participants.some(p => p.name === 'Postgres'));
});

test('actor definitions are scoped to their story and either annotation order parses', () => {
  const result = parse(`# One\n@Service (cloud)\n@User (person)\n## Do\nUser asks Service {Question} "today"\n# Two\n@Service (computer)\n@User (person)\n## Do\nUser asks Service "today" {Question}`);
  assert.equal(result.errors.length, 0);
  assert.equal(result.domains[0].participants.find(p => p.name === 'Service').icon, 'cloud');
  assert.equal(result.domains[1].participants.find(p => p.name === 'Service').icon, 'computer');
  assert.equal(result.domains[1].flows[0].steps[0].annotation, 'today');
  assert.equal(result.domains[1].flows[0].steps[0].workObject, 'Question');
});

test('unknown actors cause visible validation errors', () => {
  const result = parse('# One\n@User (person)\n## Do\nUser asks Missing {Question}');
  assert.equal(result.errors[0].line, 4);
  assert.equal(result.domains[0].flows[0].steps.length, 0);
});
