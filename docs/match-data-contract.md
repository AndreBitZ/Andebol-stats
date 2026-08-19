# Match Data Contract — Andebol Ecosystem

Version: 1.0

## Objetivo

Este contrato define o formato canónico usado para transportar dados entre `Andebol-stats` (recolha live) e o futuro `Handball Performance OS` (sistema central).

## Princípios

1. `Andebol-stats` é um cliente de recolha live, não a fonte permanente de identidade dos atletas.
2. Eventos são a unidade fundamental da análise.
3. Estatísticas agregadas são derivadas/compatíveis com os eventos, não substituem os eventos.
4. O jogo deve funcionar offline; sincronização é uma camada posterior.
5. `schemaVersion` permite evolução sem quebrar importações antigas.
6. IDs `legacy-*` criados pelo adapter são temporários. O Performance OS deverá associar os dados a IDs permanentes.

## Entidades

- `Player`: identidade do atleta.
- `Team`: identidade da equipa.
- `Season`: época desportiva.
- `Competition`: competição.
- `Match`: jogo.
- `MatchRoster`: relação jogador ↔ jogo, incluindo número da camisola e disponibilidade.
- `MatchEvent`: acontecimento cronológico.
- `Shot`: detalhe de um remate dentro de um evento.
- `GoalkeeperAction`: ação do guarda-redes relacionada com um remate.
- `Sanction`: sanção disciplinar.
- `Timeout`: pedido de tempo.
- `Substitution`: entrada/saída.
- `GameSituation`: contexto numérico da situação de jogo.

## Evento

O formato base é:

```json
{
  "id": "evt_001",
  "matchId": "match_001",
  "period": 1,
  "gameTime": 532,
  "teamId": "team_001",
  "playerId": "player_001",
  "type": "shot",
  "metadata": {}
}
```

Para um remate, `metadata.shot` contém zona, tipo, resultado e coordenadas.

## Compatibilidade com a app atual

A versão atual guarda:

- `gameData.A/B.stats`
- `gameData.A.players`
- `gameData.A.officials`
- `gameEvents`
- `gameSituationLog`
- `player.history`
- `gameData.B.history`

O adapter `js/matchAdapter.js` transforma estes dados no formato canónico sem alterar a lógica ou a interface da app.

## Limitações conhecidas da versão 1.0

- A app atual não possui IDs permanentes de jogadores.
- Data, competição e local não são atualmente obrigatórios no `GameStore`.
- Eventos antigos guardam uma descrição textual (`details`), pelo que nem todos os atributos podem ser recuperados de forma estruturada.
- Algumas ações rápidas do adversário não têm jogador associado.
- xG ainda não é calculado.
- O estado atual calcula tempo de jogo por atleta, mas não regista todas as substituições como eventos explícitos.

Estas limitações serão resolvidas nas próximas fases, sem quebrar o formato 1.0.
