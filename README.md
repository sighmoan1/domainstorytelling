Go here to use it: https://sighmoan1.github.io/domainstorytelling/

Go here to find out more about it: https://domainstorytelling.org/

Architecture examples
---------------------

Open **Templates** to load illustrative stories for Claude Artifacts, Docker with
self-hosted Supabase, Firebase, managed hosting with server-mediated or direct
Supabase access, and Drive queried through Gemini or imported into Postgres.
Each `#` heading is a separate concrete scenario. Select a story tab above
the diagram; use **Steps & Notes** to read its assumptions and numbered actions.
The examples describe possible configurations, not the actual configuration
or policy approval of a particular service or organisation.

The notation is `@Actor (material_icon)`, `## Scenario`, and
`Actor verb phrase Other Actor {Work object} "optional annotation"`.
People and active software systems are actors; exchanged data and artifacts
are work objects. The source/build stories and runtime/use stories are kept
separate because they occur at different times. This is a conversation aid,
not a substitute for a deployment diagram or a security assessment.

Run `node --test tests/*.test.js` to validate the supplied examples and parser.

Running locally on your machine
-------------------------------

1. Make sure you have Node.js installed (`node -v` should print a version).
2. From the project root (`/Users/apple/domainstorytelling-1`), run:

   `node server.js`

3. Open `http://localhost:3000` in your browser.

Modeling As-is and To-be variants
---------------------------------

To model current and future states of the same domain (e.g. \"Managing partnerships\"), use **separate top-level stories** and keep flows inside each variant:

```markdown
# Managing partnerships – As-is

@A (person)
@B (system)
@C (cloud)
@D (person)
@E (system)
@F (system)

## As-is flow 1
A uses B
B creates C

## As-is flow 2
D uses E

# Managing partnerships – To-be

@A (person)
@B (system)
@C (cloud)
@D (person)
@E (system)
@F (system)

## To-be flow 1
D uses F
```

Each `#` heading becomes its own diagram. Reusing actor names across As-is and To-be variants lets you compare them conceptually, while keeping layouts and dragging independent per story.
