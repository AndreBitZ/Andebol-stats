# Canonical Match tests

Run the test with a browser/ES-module capable environment after loading the project. The test is intentionally dependency-free and exercises the canonical adapter with a representative match state.

Covered:
- canonical schema version;
- shot extraction from player/opponent history;
- legacy timeline `shot` entries not being duplicated;
- unique event IDs;
- player extraction;
- rejection of duplicated event IDs.
