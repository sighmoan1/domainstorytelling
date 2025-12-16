Go here to use it: https://sighmoan1.github.io/domainstorytelling/

Go here to find out more about it: https://domainstorytelling.org/

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
