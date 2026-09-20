# Arquitetura — Pring Pongas

## Camadas

```text
client/src/
├── App.tsx                         # Shell e roteamento mínimo
├── pages/Home.tsx                  # Menu, navegação e composição da partida
├── components/PongCanvas.tsx       # Ponte React ↔ motor Canvas
├── game/
│   ├── types.ts                    # Tipos de estado e conteúdo
│   ├── content.ts                  # Personagens, mesas e dificuldades
│   ├── physics.ts                  # Funções puras de colisão e rebote
│   └── PongGame.ts                 # Loop, input, IA, desenho e ciclo da partida
└── index.css                       # Tokens, layout, textura e motion
```

## Responsabilidades

`Home` controla somente a navegação da experiência, seleção de modo/dificuldade e o perfil local. `PongCanvas` cria uma instância do motor uma única vez por montagem, encaminha teclado/toque e apresenta snapshots. `PongGame` não importa React e é responsável por loop, estado de partida, renderização 2D, IA e emissão de snapshots. `physics.ts` contém cálculos determinísticos e testáveis isoladamente. `content.ts` mantém a configuração data-driven para futuras coleções.

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
