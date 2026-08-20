# Match Data Contract — Andebol Ecosystem

Version: 1.1

## Source of truth

**Performance OS is the master of identity and match setup. Andebol-stats is the specialist live-statistics client.**

The intended workflow is:

`Performance OS → export LIVE package → Andebol-stats → live coding/statistics → export canonical result → Performance OS`

Performance OS creates the match, teams, players, season and competition context first. Andebol-stats must never create a second identity for a player that already has a permanent Performance OS `playerId`.

## Principles

1. Performance OS owns permanent club, team, season, competition and player identities.
2. Andebol-stats owns fast live event collection and live statistical interaction.
3. Events are the fundamental analytical unit.
4. Aggregated statistics are derived from events whenever possible.
5. The game must work offline.
6. `schemaVersion` allows controlled evolution.
7. IDs supplied by Performance OS are preserved end-to-end.
8. Legacy IDs are supported only for old games that predate the integration.
9. Importing a result into Performance OS must merge by permanent IDs rather than create duplicate players/teams.
10. Visual presentation can evolve independently from the data contract.

## Canonical package

The current contract version is `1.1.0`.

Required top-level sections:

- `schemaVersion`
- `source`
- `match`
- `players`
- `roster`
- `events`
- `situations`
- `statistics`
- `metadata`

A remate uses `events[].metadata.shot`:

```json
{
  "shooterId": "player_001",
  "position": "LE",
  "zone": "Z3",
  "distance": "6-9m",
  "type": "jump_shot",
  "outcome": "goal",
  "xg": 0.42
}
```

## Compatibility

Andebol-stats accepts `1.0.0`, `1.0.1` and `1.1.0` packages. New Performance OS exports use `1.1.0`.

The importer preserves permanent player IDs and imports the canonical event stream, including shot context and xG where available. fileciteturn223file0

The existing canonical exporter already validates the package before download. fileciteturn222file0

## Performance OS integration

Performance OS should provide, at minimum:

- match ID;
- home/away team IDs and names;
- season/competition IDs;
- permanent player IDs;
- squad/roster;
- match date and venue.

After the live analysis, Andebol-stats returns the same match ID and permanent player IDs together with the event stream. Performance OS then imports the result and updates the existing match instead of creating a new match/player identity.

## Evolution rules

A breaking change requires a new major contract version. Additive fields should remain optional whenever possible. Both applications must reject unsupported versions clearly instead of silently importing malformed data.
