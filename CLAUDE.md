# Capivara Companheira

Jogo mobile estilo Tamagotchi para o público **idoso**. O jogador cuida de uma
capivara virtual (a "Capy"): alimenta, dá banho, brinca e a coloca para dormir,
mantendo seus status equilibrados. Inclui minijogos, loja e navegação por
cômodos de uma casa.

O público-alvo idoso é o princípio que orienta todas as decisões de design e
código. Em caso de dúvida entre simplicidade/clareza e sofisticação, escolha
sempre simplicidade e clareza.

## Stack

- React Native `0.81.5` com Expo SDK `~54` (gerenciado, sem código nativo custom)
- TypeScript em modo `strict`
- Navegação: React Navigation v7 (native-stack)
- Persistência local: `@react-native-async-storage/async-storage`
- Sem backend: todo o estado vive no dispositivo
- Só orientação retrato (portrait)

> O Expo Go do dispositivo alvo suporta SDK 54. Não atualizar o SDK sem
> confirmar antes qual versão o Expo Go do celular de testes suporta.

## Comandos

- Instalar: `npm install`
- Rodar no celular: `npx expo start --tunnel` (use sempre `--tunnel` — funciona em qualquer rede)
- Rodar no navegador: `npx expo start --web`
- Verificar tipos: `npx tsc --noEmit`

No Windows com PowerShell, substituir `npx` por `npx.cmd` se o comando travar.

Sempre rode `npx tsc --noEmit` após mudanças e garanta que passa sem erros antes
de considerar uma tarefa concluída.

## Estrutura do projeto

- `App.tsx` — ponto de entrada; registra todas as telas no stack de navegação
- `src/types/` — definições de tipo TypeScript (vocabulário do jogo). Comece por aqui.
- `src/screens/` — telas completas (uma por arquivo)
- `src/components/` — peças de UI reutilizáveis montadas pelas telas
- `src/storage/` — leitura e escrita de estado no AsyncStorage
- `src/utils/` — lógica pura do jogo (regras de status, cálculos)
- `src/assets/capySprites.ts` — constantes `require()` de todos os sprites da Capy e itens

Mantenha essa separação de responsabilidades. Lógica de jogo vai em `utils`,
não dentro de telas. Acesso a armazenamento vai em `storage`, não espalhado.
Novos assets de imagem devem ser exportados de `src/assets/capySprites.ts`.

## Modelo do jogo (ver src/types/game.ts)

- A Capy tem 4 status numéricos: `hunger`, `happiness`, `energy`, `hygiene`.
  Convencionalmente na faixa de 0 a 100 — sempre faça "clamp" para manter os
  valores dentro desses limites.
- `coins` também faz parte de `CapybaraStatus` — moeda do jogo, sem faixa
  máxima, nunca negativa. Use `addCoinsBonus` em `statusRules` para alterá-la.
- O humor (`CapybaraMood`: feliz/normal/triste) é **derivado** dos status, não
  armazenado separadamente.
- 4 ações de cuidado (`CareAction`): `feed`, `bath`, `play`, `sleep`.
- As ações têm trade-offs (definidos em `src/utils/statusRules`): por exemplo,
  comer reduz higiene e brincar reduz energia. Esse equilíbrio é o núcleo da
  jogabilidade — preserve-o ao mexer nas regras.
- Telas: **Game** (ponto de entrada), MiniGames, MemoryGame, CatchFoodGame,
  Shop, Profile, e 4 cômodos (Kitchen, Bathroom, Garden, Bedroom) que
  reutilizam o mesmo `RoomScreen`. Não existe mais HomeScreen.

### Navegação por cômodos (PageNav)

A navegação entre cômodos usa paginação com setas e bolinhas (`PageNav`),
sem tiles/botões individuais. A ordem fixa é:

```
Início (Game) → Alimentar (Kitchen) → Brincar (Garden) → Dormir (Bedroom) → Banho (Bathroom)
```

- O componente `PageNav` vive em `src/components/PageNav.tsx` e exporta
  também a constante `ROOM_PAGES` com a ordem canônica — use ela em qualquer
  lugar que precise da ordem dos cômodos.
- Navegação entre cômodos usa `navigation.replace()` para não empilhar telas.
  Voltar ao Início usa `navigation.goBack()`.
- O último cômodo visitado é salvo via `saveLastRoom` e restaurado ao abrir
  o app (lógica em `GameScreen` com `useRef hasRestoredRoom`).

### Layout do GameScreen

- **Linha superior:** moedas (esquerda) + botão de perfil (direita)
- **Barras de status:** 4 barras verticais estilo Pou (fome/alegria/energia/higiene)
- **PageNav:** paginação de cômodos logo abaixo das barras
- **Área principal:** imagem do lobby (`capybara-lobby-cartoon.png`) flex:1

Não reintroduza `GameBottomNav` nem tiles de ação no `GameScreen` sem discutir
antes — a remoção foi intencional para simplificar a interface para o público idoso.

### Layout do RoomScreen

Cada cômodo tem:
- Barras de status compactas (altura 44px) no topo
- `PageNav` para trocar de cômodo
- `CapybaraDisplay` com a cena do cômodo
- Botão de ação principal (`ActionButton`)
- **Barra inferior fixa** com 3 slots (esquerda / centro / direita), onde
  a direita é sempre a loja. Os ítens do centro/esquerda são visuais por ora.

## Sistema de sprites da Capy (`src/assets/capySprites.ts`)

A Capy é composta por camadas de imagens PNG transparentes sobrepostas.
Todas as imagens estão em `assets/images/` e exportadas de `capySprites.ts`.

| Exportação | Camada | Conteúdo |
|---|---|---|
| `capyBody` | Base | Corpo inteiro: `normal`, `cesta`, `pipoca`, `sad`, `sleepHat` |
| `capyEyes` | Olhos | `openNormal`, `openSick`, `tired`, `closed` |
| `capyMouth` | Boca/bochechas | `normal`, `happy`, `veryHappy`, `joke`, `sick`, `uau`, `faceTired` |
| `capyWalk` | Animação | Capy andando com cesta: `center`, `right`, `left` |
| `cestaPinhas` | Item | Array[5]: cesta com 1–5 pinhas (índice = quantidade − 1) |
| `shopAssets` | UI | `loja` (fachada da loja), `hatBoina` (acessório) |
| `statusIcons` | UI | `sleep` (ícone Zzz para o quarto) |

**Regra:** não use `require("../../assets/images/...")` diretamente nas telas —
importe de `capySprites.ts` para manter os paths centralizados.

O `CapybaraDisplay` atual ainda usa imagens de cena únicas por cômodo
(`capybara-kitchen.png` etc.). A migração para composição em camadas com
`capyBody` + `capyEyes` + `capyMouth` é o próximo passo planejado.

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
