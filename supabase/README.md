# Banco Supabase — Pring Pongas

O projeto Supabase `pring-pongas` foi criado na organização `CaioAlves`, na região `sa-east-1`, com o identificador `jvqxolwsluvxbmbjmudw`. A migration `pring_pongas_schema` foi aplicada com sucesso.

A estrutura inicial contém `player_profiles` para progresso do jogador, `matches` para histórico de partidas e `match_events` para eventos opcionais de uma partida. As três tabelas estão com Row Level Security habilitado; a integração autenticada do próximo ciclo deve criar as políticas de acesso antes de expor dados persistentes ao cliente.

O código continua usando `localStorage` no MVP para não expor credenciais ou permitir escrita anônima sem políticas definidas. A integração cliente-Supabase pode ser adicionada quando autenticação ou políticas públicas forem decididas.

## Publicação externa

O commit local da migração 3D é `02f90d4`. O push para `https://github.com/CaioAlves2013/pring-pongas.git` retornou HTTP 403 com a credencial atual, portanto é necessário reconectar um token GitHub com permissão de escrita no repositório. A conta Vercel ainda não apresenta uma equipe conectada nesta sessão.
