# Capivara Companheira

Jogo mobile estilo Tamagotchi pensado para o público **idoso**. Você cuida de
uma capivara virtual: alimenta, dá banho, brinca e a coloca para dormir,
mantendo os status dela equilibrados. Feito com React Native + Expo, sem
backend — todo o progresso fica no aparelho.

> Projeto de protótipo para demonstrações. Não há build de produção.

---

## Começo rápido (recomendado)

É o caminho mais simples: só precisa de Node.js. Ideal para rodar o jogo e
para o dia da demonstração.

**Pré-requisitos:**

- [Node.js LTS](https://nodejs.org/) (versão 18 ou 20)
- [Expo Go](https://expo.dev/go) instalado no celular (Android ou iPhone), se
  quiser jogar no aparelho

**Passos:**

```bash
git clone https://github.com/erik-gastao/Capivara.git
cd Capivara
npm install
npx expo start --tunnel
```

Depois:

- **No celular:** abra o Expo Go e leia o QR Code que aparece no terminal
- **No navegador:** pressione `w` no terminal (ou rode `npx expo start --web`)

> **Por que `--tunnel`?** Ele faz o celular se conectar por um túnel na
> internet em vez da rede local — funciona mesmo com firewall, Wi-Fi de
> visitante ou redes diferentes. É um pouco mais lento para carregar, mas
> quase nunca falha. Se você e o celular estiverem na mesma rede sem
> firewall no caminho, `npx expo start` (sem `--tunnel`) também funciona.

### Setup automático (Windows)

Em uma máquina Windows recém-formatada, o script abaixo instala o que
estiver faltando (Git, Node) e roda o `npm install`:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1
```

Com `-ComDocker` ele também instala o Docker Desktop, para quem for usar o
Dev Container (abaixo). O VS Code não é obrigatório — quem quiser pode
acrescentar `-ComVSCode`:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup.ps1 -ComDocker
powershell -ExecutionPolicy Bypass -File .\setup.ps1 -ComDocker -ComVSCode
```

---

## Dev Container (ambiente isolado, para desenvolver)

Para quem vai **mexer no código**, o repositório traz um
[Dev Container](https://containers.dev/): um ambiente Linux com a versão
certa do Node e as dependências já instaladas, idêntico em qualquer máquina,
sem instalar nada no Windows além do Docker.

**Pré-requisito obrigatório:** apenas o
[Docker Desktop](https://www.docker.com/products/docker-desktop/) (que no
Windows exige o **WSL 2** — ver problemas comuns abaixo).

O `devcontainer.json` é um [padrão aberto](https://containers.dev/) e pode
ser usado com a ferramenta da sua preferência. Duas opções comuns:

**Opção A — pelo terminal, com a Dev Container CLI (sem editor específico):**

```bash
npm install -g @devcontainers/cli
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . npx expo start --tunnel
```

**Opção B — pelo VS Code (se você já o usa):**

1. Instale a extensão **Dev Containers**
   (`ms-vscode-remote.remote-containers`)
2. Abra a pasta do projeto e, quando o VS Code perguntar, clique em
   **"Reopen in Container"** (ou: `F1` → *Dev Containers: Reopen in
   Container*)
3. No terminal integrado: `npx expo start --tunnel`

Em ambas as opções, a primeira construção leva alguns minutos; as próximas
são rápidas. JetBrains (IntelliJ/WebStorm) e GitHub Codespaces também abrem
o mesmo arquivo, se preferir.

> **Atenção:** com o servidor dentro do contêiner, o celular **não** acha o
> servidor pela rede local — use sempre `--tunnel` para testar no Expo Go.
> A versão web (`npx expo start --web`) funciona normalmente pela porta 8081
> encaminhada.

---

## Comandos úteis

| Comando | O que faz |
| --- | --- |
| `npx expo start --tunnel` | Roda o jogo para testar no celular (Expo Go) |
| `npx expo start --web` | Roda o jogo no navegador |
| `npx tsc --noEmit` | Verifica os tipos TypeScript (deve passar sem erros) |

---

## Solução de problemas

### "A execução de scripts foi desabilitada neste sistema" (PowerShell)

O PowerShell bloqueia o `npx` por política de execução. Duas saídas:

```powershell
# Saída rápida, sem mudar nada na máquina:
npx.cmd expo start --tunnel

# Ou liberar scripts assinados para o seu usuário (uma vez só):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Docker Desktop: "There was a problem with WSL" / "O Subsistema do Windows para Linux não está instalado"

O Docker Desktop no Windows depende do WSL 2. Instale-o assim:

1. Abra o PowerShell **como administrador** (`Win + X` → Terminal (Admin))
2. Rode: `wsl --install --no-distribution`
3. **Reinicie o computador**
4. Confirme com `wsl --status` — deve mostrar "Versão Padrão: 2"

### WSL: erro mencionando virtualização (VT-x, AMD-V, "virtualization not enabled")

A virtualização está desligada na BIOS/UEFI do computador. Reinicie, entre na
BIOS (geralmente tecla `Del`, `F2` ou `F10` na inicialização) e ative
**Intel VT-x** ou **AMD SVM**, conforme o processador.

### Expo Go não conecta / QR Code não abre o jogo

- Use `npx expo start --tunnel` — resolve a grande maioria dos casos
  (firewall, redes diferentes, Wi-Fi corporativo)
- Confira se o app **Expo Go** está atualizado na loja do celular
- O projeto usa Expo SDK 51; versões muito novas do Expo Go podem não abrir
  SDKs antigos — se for o caso, prefira testar pela versão web

### "Port 8081 is running this app in another window" / porta ocupada

Já existe outro Metro bundler aberto. Feche o outro terminal que estiver
rodando `expo start`, ou aceite a sugestão do Expo de usar outra porta.

### `npm install` falha ou o projeto não inicia

- Confira a versão do Node: `node --version` (use **18 ou 20 LTS**; versões
  muito novas podem ser incompatíveis com o Expo SDK 51)
- Apague e reinstale as dependências:

  ```bash
  rm -rf node_modules   # no PowerShell: Remove-Item -Recurse -Force node_modules
  npm install
  ```

### `winget` não encontrado (ao rodar o setup.ps1)

Instale o **Instalador de Aplicativo** pela Microsoft Store
(<https://apps.microsoft.com/detail/9NBLGGH4NNS1>) e rode o script de novo.

---

## Estrutura do projeto

```
App.tsx              # ponto de entrada; registra as telas na navegação
src/types/           # tipos TypeScript (vocabulário do jogo)
src/screens/         # telas completas (uma por arquivo)
src/components/      # componentes de UI reutilizáveis
src/storage/         # leitura/escrita no AsyncStorage
src/utils/           # lógica pura do jogo (regras de status)
```

O jogo segue princípios de **acessibilidade para idosos**: textos grandes e
de alto contraste, botões generosos e espaçados, sem gestos complexos e sem
pressão de tempo. Veja o `CLAUDE.md` para as diretrizes completas.
