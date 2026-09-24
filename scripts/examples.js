// These are concrete, illustrative scenarios, not endorsements or assertions
// about any particular organisation's configuration. Each # is one story.
const TEMPLATES = [
  {
    id: 'claude-artifact', title: 'Claude Artifact', icon: 'auto_awesome',
    desc: 'A builder publishes an artifact; a colleague uses it.',
    content: `# Publish an Artifact
> [assumption] Example with optional Artifact storage; sharing and storage depend on configuration.
@Builder (person)
@Claude (cloud) "Anthropic service"
@Artifact (computer)
@Colleague (person)
## Publish a working example
Builder describes a task to Claude {Prompt}
Claude creates for Builder {Artifact code}
Builder publishes with Claude {Artifact}
Claude shares with Colleague {Artifact link}

# Use an Artifact
> [assumption] Illustrative use with storage enabled; connected services would need their own separate story.
@Colleague (person)
@Artifact (computer)
@Artifact Storage (storage) "Anthropic service"
## Complete a task
Colleague opens Artifact {Artifact link}
Colleague submits to Artifact {Input}
Artifact saves in Artifact Storage {Record} "if storage is enabled"
Artifact shows Colleague {Result}`
  },
  {
    id: 'self-hosted', title: 'Docker + self-hosted Supabase', icon: 'dns',
    desc: 'A GitHub source, a server deployment and a local database.',
    content: `# Deploy a self-hosted application
> [assumption] The team operates the host and its database; build and deployment steps vary.
@Developer (person)
@GitHub (code)
@Deployment Job (settings)
@Docker Host (dns) "team-operated server"
## Release a change
Developer pushes to GitHub {Source code}
GitHub triggers Deployment Job {Commit}
Deployment Job builds for Docker Host {Container image}
Docker Host confirms to Developer {Running containers}

# Use a self-hosted application
> [note] Application and Postgres run on the same team's infrastructure in this example.
@User (person)
@Web App (computer)
@Supabase API (api)
@Postgres (storage) "team-operated server"
## Find a record
User requests from Web App {Record query}
Web App requests from Supabase API {Record query}
Supabase API reads from Postgres {Record}
Supabase API returns to Web App {Record}
Web App displays to User {Record}`
  },
  {
    id: 'firebase', title: 'GitHub + Firebase', icon: 'local_fire_department',
    desc: 'A managed build and application with Firebase data services.',
    content: `# Deploy through Firebase App Hosting
> [assumption] This example uses GitHub-connected Firebase App Hosting.
@Developer (person)
@GitHub (code)
@App Hosting (cloud) "Google-managed"
@Cloud Build (settings)
@Cloud Run (computer)
## Release a change
Developer pushes to GitHub {Source code}
GitHub notifies App Hosting {Commit}
App Hosting requests from Cloud Build {Build}
Cloud Build supplies Cloud Run {Application image}
App Hosting confirms to Developer {Deployment URL}

# Use a Firebase application
> [assumption] This scenario uses direct client access with Firebase Auth and Firestore rules.
@User (person)
@Web App (computer)
@Firebase Auth (verified_user)
@Firestore (storage) "Google-managed"
## Read a record
User signs in through Web App {Credentials}
Web App authenticates with Firebase Auth {Sign-in request}
Firebase Auth returns to Web App {User token}
Web App requests from Firestore {Record query} "user token and security rules"
Firestore returns to Web App {Record}
Web App shows User {Record}`
  },
  {
    id: 'managed-server', title: 'Managed host + Supabase: server', icon: 'lan',
    desc: 'The app server mediates every database request.',
    content: `# Deploy an application to a managed host
> [assumption] The app host builds GitHub commits and the database is Supabase managed.
@Developer (person)
@GitHub (code)
@App Host (cloud) "app-host provider"
@App Server (computer)
## Release a change
Developer pushes to GitHub {Source code}
GitHub sends App Host {Commit}
App Host deploys to App Server {Application build}

# Read via the app server
> [note] The server decides what reaches Supabase. It keeps privileged credentials off the browser.
@User (person)
@Browser (computer)
@App Server (computer)
@Supabase API (api) "Supabase-managed"
@Postgres (storage) "Supabase-managed"
## Read a record
User asks Browser {Record query}
Browser sends App Server {Record query}
App Server authorises for User {Request}
App Server requests from Supabase API {Record query}
Supabase API reads from Postgres {Record}
Supabase API returns to App Server {Record}
App Server returns to Browser {Permitted record}
Browser shows User {Permitted record}`
  },
  {
    id: 'managed-direct', title: 'Managed host + Supabase: direct', icon: 'open_in_browser',
    desc: 'The browser talks to Supabase with user identity and RLS.',
    content: `# Deploy a browser application
> [assumption] This example has a separately hosted frontend and managed Supabase.
@Developer (person)
@GitHub (code)
@App Host (cloud) "app-host provider"
@Browser App (computer)
## Release a change
Developer pushes to GitHub {Source code}
GitHub sends App Host {Commit}
App Host publishes Browser App {Frontend build}

# Read Supabase directly
> [note] The publishable key is public; user identity and row-level security control database access.
@User (person)
@Browser App (computer)
@Supabase Auth (verified_user)
@Supabase API (api) "Supabase-managed"
@Postgres (storage) "Supabase-managed"
## Read a record
User signs in to Browser App {Credentials}
Browser App authenticates with Supabase Auth {Sign-in request}
Supabase Auth returns to Browser App {User token}
Browser App requests from Supabase API {Record query} "user token"
Supabase API reads from Postgres {Permitted rows} "row-level security"
Supabase API returns to Browser App {Permitted record}
Browser App shows User {Permitted record}`
  },
  {
    id: 'drive-gemini', title: 'Drive + Gemini', icon: 'search',
    desc: 'Answer a question from a connected source without an app database.',
    content: `# Ask a question about a Drive document
> [assumption] The user is authorised to access the document through an enabled connector.
@User (person)
@Gemini (cloud)
@Drive (folder) "source documents"
## Answer a question
User asks Gemini {Question}
Gemini searches Drive {Relevant documents} "subject to connection permissions"
Drive returns to Gemini {Document excerpts}
Gemini produces for User {Answer with sources}
> [note] This story does not assume a separate copy in an application database. Service processing and retention require configuration review.`
  },
  {
    id: 'drive-copy', title: 'Drive → ingestion → Supabase', icon: 'move_to_inbox',
    desc: 'A scheduled job creates a second, derived data store.',
    content: `# Ingest Drive documents
> [assumption] The organisation has authorised an import and defined refresh and deletion behaviour.
@Scheduler (schedule)
@Ingestion Job (settings)
@Drive (folder)
@Supabase API (api)
@Postgres (storage) "copied data"
## Refresh the index
Scheduler starts Ingestion Job {Refresh request}
Ingestion Job requests from Drive {Documents}
Drive returns to Ingestion Job {Document contents}
Ingestion Job writes to Supabase API {Document copy and metadata}
Supabase API stores in Postgres {Derived records}

# Search an ingested document
> [note] Search now reads a copy in Postgres, which may lag behind Drive permissions or deletion.
@User (person)
@Web App (computer)
@Supabase API (api)
@Postgres (storage)
## Find a document
User searches Web App {Question}
Web App requests from Supabase API {Search query}
Supabase API reads from Postgres {Derived records}
Supabase API returns to Web App {Matches and source links}
Web App shows User {Matches and source links}`
  },
  {
    id: 'simple', title: 'Ticket at the box office', icon: 'confirmation_number',
    desc: 'A small, human-centred story to learn the notation.',
    content: `# Buy a cinema ticket
> [assumption] A seat is available for the chosen show.
@Moviegoer (person)
@Cashier (person)
## Buy a ticket
Moviegoer requests from Cashier {Show}
Cashier suggests to Moviegoer {Available seats}
Moviegoer chooses with Cashier {Seat}
Cashier issues to Moviegoer {Ticket}`
  },
  { id: 'blank', title: 'Blank story', icon: 'note_add', desc: 'Start with one concrete scenario.',
    content: '# A person completes a task\n> [assumption] Describe one typical case.\n\n@Person (person)\n@Service (computer)\n\n## Complete the task\nPerson requests from Service {Information}\nService returns to Person {Result}' }
];
