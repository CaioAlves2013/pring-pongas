# Memória de desenvolvimento

- O projeto WebDev foi inicializado como `web-static` em `/home/ubuntu/pring-pongas`.
- O esqueleto fornecido recomenda Canvas 2D, por isso o MVP mantém a lógica de partida sem dependência de motor 3D.
- O escopo prioriza uma partida funcional e visualmente forte sobre múltiplas rotas vazias.
- O áudio não é incluído no primeiro corte porque navegadores exigem gesto do usuário para desbloqueio; a interface usa feedback visual e está preparada para evolução.
- Não utilizar personagens ou elementos de propriedades existentes; todas as formas e nomes são originais.
- O jogo foi migrado para Babylon.js 3D com iluminação neon controlada, mesa, rede, bola esférica e raquetes cilíndricas com cabo.
- O projeto Supabase `pring-pongas` foi criado na organização `CaioAlves`, região `sa-east-1`, projeto `jvqxolwsluvxbmbjmudw`, e a migration `pring_pongas_schema` foi aplicada.
- O push para o GitHub fornecido falhou com HTTP 403 porque a credencial atual não tem permissão de escrita; o commit local `02f90d4` contém a migração 3D e a migration SQL.
- A conexão Vercel ainda não está disponível nesta sessão; a listagem de equipes retornou zero equipes.
