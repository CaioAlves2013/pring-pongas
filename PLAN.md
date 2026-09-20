# Plano do jogo Pring Pongas

## Direção

Construir um MVP web de pingue-pongue arcade em Canvas 2D, com uma partida contra bot, três modos de início, três mesas coerentes, três dificuldades, placar com aparência de transmissão esportiva caótica e progresso local. A interface usa a identidade **Pring Pongas**: azul-noite, roxo profundo, verde elétrico, coral, amarelo solar, azul-gelo, branco-gelo e lavanda acinzentada.

## Riscos isolados

### 1. Física arcade e colisões
- **Por que isolar:** a bola precisa refletir nas bordas, mudar o ângulo conforme a posição na raquete, acelerar durante a troca e marcar pontos sem atravessar a raquete.
- **Abordagem:** manter a física em funções puras e um controlador de partida independente do React. A bola usa velocidade mínima horizontal, limite de velocidade e uma pequena margem de correção após a colisão.
- **Verificar:** jogar com teclado, observar rebotes nas duas raquetes, confirmar aumento progressivo da velocidade, pontuação após saída pela lateral e reinício limpo do saque.

### 2. Estados de partida e pausa
- **Por que isolar:** menu, saque, jogo, pausa, ponto e fim precisam trocar sem perder placar ou criar loops duplicados.
- **Abordagem:** a classe `PongGame` mantém um estado explícito e a camada React apenas apresenta snapshots e dispara ações.
- **Verificar:** iniciar, pausar com espaço, retomar, voltar ao menu e reiniciar após vitória/derrota sem duplicar animações.

### 3. IA com personalidade por dificuldade
- **Por que isolar:** o bot não deve ser perfeito e precisa parecer diferente em Fácil, Normal e Difícil.
- **Abordagem:** reação atrasada, erro controlado, velocidade de deslocamento e previsão parcial variam por dados de dificuldade.
- **Verificar:** repetir partidas e observar que Fácil atrasa e erra mais, enquanto Difícil reage antes, mas ainda permite pontos humanos.

## Construção principal

- **Assets necessários:** referência visual gerada da marca, arte de apoio para o menu e geometrias desenhadas em Canvas para mesa, rede, bola, raquetes e efeitos.
- **Persistência:** perfil mínimo em `localStorage`, com vitórias, derrotas, melhor rally e nível calculado por experiência.
- **Acessibilidade:** controles por W/S e setas, botão de pausa, alto contraste, rótulos visíveis, modo de treino e respeito a `prefers-reduced-motion` na interface.
- **Verificar:**
  - UI responsiva, legível e sem sobreposição em desktop e largura móvel básica.
  - Canvas mostra texturas, silhuetas e paleta Pring Pongas sem placeholders genéricos.
  - Jogador consegue iniciar partida rápida, aleatória e treino.
  - Placar, saque, rally, dificuldade, mesa e modificador aparecem no HUD.
  - Bot apresenta comportamento coerente com a dificuldade.
  - Resultado mostra vencedor, pontuação e ações de rematch/menu.
  - Progresso continua após recarregar a página.
  - URL `?demo` inicia uma partida automatizada para captura visual determinística.
  - Não há erros de TypeScript, build ou console no fluxo principal.
  - **Presentation proof bundle:** screenshots do preview do WebDev em desktop e viewport móvel.
