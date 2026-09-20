# Arquitetura — Pring Pongas

## Camadas

```text
client/src/
├── App.tsx                         # Shell e roteamento mínimo
├── pages/Home.tsx                  # Menu, navegação e composição da partida
├── components/PongCanvas.tsx       # Ponte React ↔ motor Babylon.js
├── game/
│   ├── types.ts                    # Tipos de estado e conteúdo
│   ├── content.ts                  # Personagens, mesas e dificuldades
│   ├── physics.ts                  # Funções puras de colisão e rebote
│   ├── PongGame.ts                 # Loop 2D legado preservado para referência
│   └── scene.ts                    # Cena 3D, mesa, rede, bola e raquetes
├── index.css                       # Tokens, layout, textura e motion
├── public/manifest.json             # Manifesto PWA instalável
└── public/pring-pongas-icon.svg     # Ícone leve do app mobile
```

## Responsabilidades

`Home` controla somente a navegação da experiência, seleção de modo/dificuldade e o perfil local. `PongCanvas` cria o `Engine` Babylon uma única vez por montagem, encaminha teclado e apresenta snapshots. `scene.ts` não importa React e é responsável pela cena 3D, loop, estado de partida, renderização, IA, colisões arcade e emissão de snapshots. `PongGame` e `physics.ts` permanecem isolados como referência 2D e base para testes futuros. `content.ts` mantém a configuração data-driven para futuras coleções.

## Fluxo de estados

```text
MENU → PLAYING (saque) → PLAYING
PLAYING ↔ PAUSED
PLAYING → POINT (mensagem breve) → PLAYING
PLAYING → WON / LOST
WON / LOST → MENU ou nova partida
```

## Convenções de marca

- Nome exibido: `PRING PONGAS`.
- Nome técnico: `pring-pongas`.
- Classe principal: `PringPongas` / componente `PongCanvas`.
- Título da janela: `Pring Pongas`.
- Paleta centralizada em CSS e repetida no motor Canvas para o desenho.
