# Multiplayer online — Pring Pongas

O modo **2 jogadores online** usa o Supabase Realtime com canais efêmeros, sem expor chaves privadas e sem exigir servidor de jogo no MVP.

## Fluxo

1. O jogador 1 clica em **2 jogadores online**, gera um código de seis caracteres e cria a sala.
2. O jogador 1 compartilha o código com o jogador 2.
3. O jogador 2 abre o mesmo botão, informa o código e entra como convidado.
4. A presença Realtime libera a partida quando os dois jogadores estão conectados.
5. O anfitrião controla a física, a bola, o placar e a validação de pontos. O convidado envia apenas a posição da raquete coral e recebe o estado sincronizado.

O jogo mantém o modo local contra o bot separado. Se a conexão cair, a sala exibe o estado de espera novamente em vez de fabricar uma partida online divergente.
