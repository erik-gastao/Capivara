# Capivara Companheira

Jogo mobile estilo Tamagotchi para o público **idoso**. O jogador cuida de uma
capivara virtual (a "Capy"): alimenta, dá banho, brinca e a coloca para dormir,
mantendo seus status equilibrados. Inclui minijogos, loja e navegação por
cômodos de uma casa.

O público-alvo idoso é o princípio que orienta todas as decisões de design e
código. Em caso de dúvida entre simplicidade/clareza e sofisticação, escolha
sempre simplicidade e clareza.

## Stack

- React Native `0.74.5` com Expo SDK `~51` (gerenciado, sem código nativo custom)
- TypeScript em modo `strict`
- Navegação: React Navigation (native-stack)
- Persistência local: `@react-native-async-storage/async-storage`
- Sem backend: todo o estado vive no dispositivo
- Só orientação retrato (portrait)

## Comandos

- Instalar: `npm install`
- Rodar: `npx expo start` (no Windows, se o PowerShell bloquear: `npx.cmd expo start`)
- Rodar no navegador: `npx expo start --web`
- Verificar tipos: `npx tsc --noEmit`

Sempre rode `npx tsc --noEmit` após mudanças e garanta que passa sem erros antes
de considerar uma tarefa concluída.

## Estrutura do projeto

- `App.tsx` — ponto de entrada; registra todas as telas no stack de navegação
- `src/types/` — definições de tipo TypeScript (vocabulário do jogo). Comece por aqui.
- `src/screens/` — telas completas (uma por arquivo)
- `src/components/` — peças de UI reutilizáveis montadas pelas telas
- `src/storage/` — leitura e escrita de estado no AsyncStorage
- `src/utils/` — lógica pura do jogo (regras de status, cálculos)

Mantenha essa separação de responsabilidades. Lógica de jogo vai em `utils`,
não dentro de telas. Acesso a armazenamento vai em `storage`, não espalhado.

## Modelo do jogo (ver src/types/game.ts)

- A Capy tem 4 status numéricos: `hunger`, `happiness`, `energy`, `hygiene`.
  Convencionalmente na faixa de 0 a 100 — sempre faça "clamp" para manter os
  valores dentro desses limites.
- O humor (`CapybaraMood`: feliz/normal/triste) é **derivado** dos status, não
  armazenado separadamente.
- 4 ações de cuidado (`CareAction`): `feed`, `bath`, `play`, `sleep`.
- As ações têm trade-offs (definidos em `src/utils/statusRules`): por exemplo,
  comer reduz higiene e brincar reduz energia. Esse equilíbrio é o núcleo da
  jogabilidade — preserve-o ao mexer nas regras.
- Telas: Home, Game, MiniGames, MemoryGame, Shop, Profile, e 4 cômodos
  (Kitchen, Bathroom, Garden, Bedroom) que reutilizam o mesmo `RoomScreen`.

## Acessibilidade (requisito central, não opcional)

O jogo é para idosos. Toda UI nova deve seguir estes princípios por padrão:

- **Texto grande e legível.** Fontes amplas; nunca texto pequeno ou cinza-claro
  sobre fundo claro. Alto contraste sempre.
- **Não depender só de cor.** Status crítico ou feedback nunca pode ser
  indicado apenas por cor — use também texto, ícone ou forma.
- **Alvos de toque grandes e espaçados.** Botões generosos, com espaço entre
  eles para evitar toques acidentais.
- **Sem gestos complexos.** Nada de arrastar, pinçar ou multitoque. Toques
  simples apenas.
- **Sem pressão de tempo.** Nenhuma ação deve exigir reação rápida.
- **Feedback óbvio.** Toda ação dá retorno visual claro e imediato.
- **Telas simples.** Um objetivo por tela; evite poluição visual e menus
  escondidos.

A paleta atual usa tons creme/bege quentes (ex.: `#F8F3E8`, `#F5E8D0`).
Mantenha a coerência com ela.

## Convenções de código

- TypeScript `strict` — tipos explícitos, sem `any`.
- Componentes em arquivos separados; reutilize componentes de `components/`
  em vez de duplicar UI.
- Mantenha lógica pura (sem efeitos colaterais) em `utils/` para facilitar
  testes e leitura.

## Como trabalhar comigo neste projeto

- Antes de implementar mudanças não triviais, descreva o plano e espere
  aprovação.
- Para qualquer alteração, mostre o que mudou e explique o porquê das decisões
  — este projeto também é de aprendizado.
- Não reescreva partes que já funcionam sem necessidade.
- Ao tocar nas regras de status, explique o impacto no equilíbrio do jogo.
