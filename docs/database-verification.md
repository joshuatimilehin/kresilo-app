# Kresilo database commands preserve the approval workflow

Direct tests through the attached Kristello MCP passed all 26 assertions on October 17, 2026. The generated migration is applied to `kresilo_demo` inside the existing workspace. Row counts and content fingerprints for all 12 research tables matched before and after migration and testing. No research data changed.

The exact assertion results and applied migration hash are in [the database check record](qa/kresilo-database-checks.json). Tests used three isolated synthetic guests with only labelled QA Salt Flats data. Their sessions were expired after testing; append-only evidence remains in the demo namespace.

Verified behavior:

- A new guest immediately receives its complete project snapshot; repeated and concurrent initialization return one project.
- Different guests receive distinct projects and cannot read each other's projects. Expired sessions cannot read a project.
- Blank reference reasons fail; a valid reference and its reason survive a separate database read.
- Creating or editing a proposal leaves the active poster unchanged and retains saved source references.
- Decline leaves the artwork unchanged, records history, and prevents later approval of the declined proposal.
- Approval changes poster data and creates exactly one linked decision, version and history event. Duplicate and simultaneous approval apply once.
- A deliberately failing approval rolls back the poster, approval, decision and version changes together.
- Manual decisions create history, and private preview selections persist across a separate read.

The tests call the generated functions directly, including `ensure_guest`, `get_project`, `add_reference`, `create_proposal`, `edit_proposal`, `decline_proposal`, `approve_proposal`, `add_decision`, and `set_preview_selection`. Inputs are bound parameters. Atomicity was tested by triggering the decision reason constraint after an approval began, then verifying the entire attempted change rolled back.

These results establish database behavior. They do not establish HTTP-server access, browser refresh behavior, mobile usability, visual fidelity, or hosted acceptance. Those remain pending under issues #3–#8, including the app server credential on #5. No delivery report or completion claim is made.
