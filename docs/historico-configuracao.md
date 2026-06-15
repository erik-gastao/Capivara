# Histórico de configuração — Capivara Companheira

Documento gerado em 14/06/2026. Registra os problemas encontrados, decisões
tomadas e soluções aplicadas durante a configuração do ambiente de
desenvolvimento. Útil como referência em projetos futuros com stack
semelhante (React Native + Expo + Windows).

---

## 1. Docker Desktop iniciando com erro de WSL

### Problema

Ao ligar a máquina, o Docker Desktop abria automaticamente e exibia o erro:

```
There was a problem with WSL
running wslexec: An error occurred while running the command.
DockerDesktop/Wsl/ExecError: c:\windows\system32\wsl.exe --version:
exit status 1 (stderr: O Subsistema do Windows para Linux não está instalado.)
```

Em paralelo, o Windows abria um prompt de 60 segundos oferecendo instalar o
WSL.

### Causa

O Docker Desktop estava na lista de inicialização automática do Windows
(`HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`), mas o WSL 2 — do
qual ele depende como backend no Windows — não estava instalado.

### Solução aplicada

**Passo 1 — Remover o Docker da inicialização automática** (o WSL seria
instalado depois; não faz sentido o Docker tentar subir sem o pré-requisito):

```powershell
Remove-ItemProperty -Path "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run" -Name "Docker Desktop"
```

Verificar se foi removido:

```powershell
Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
```

> Alternativa sem terminal: Gerenciador de Tarefas → aba "Aplicativos de
> inicialização" → clique com botão direito em "Docker Desktop" → Desabilitar.
> Ou pelo próprio Docker Desktop: Settings → General → desmarcar
> "Start Docker Desktop when you sign in".

**Passo 2 — Confirmar que o Docker não tem outros gatilhos de autostart:**

```powershell
# Serviço do Docker deve estar como Manual (não Automatic)
Get-Service "com.docker.service" | Select-Object Name, StartType

# Não deve haver tarefas agendadas do Docker
Get-ScheduledTask | Where-Object { $_.TaskName -like "*Docker*" }
```

---

## 2. Instalação do WSL 2

### Por que o WSL é necessário

O Docker Desktop no Windows usa o WSL 2 como backend para rodar os
contêineres Linux. Sem ele, o Docker não inicializa.

### Instalação

Requer **PowerShell como administrador** e uma **reinicialização**:

```powershell
wsl --install --no-distribution
```

O `--no-distribution` instala só o subsistema (o que o Docker precisa), sem
baixar uma distribuição Linux completa (ex.: Ubuntu). Economiza espaço e
tempo quando o objetivo é apenas habilitar o Docker.

Após reiniciar, verificar:

```powershell
wsl --status
# Deve mostrar: Versão Padrão: 2
```

### Problemas conhecidos

| Mensagem de erro | Causa | Solução |
|---|---|---|
| "Virtualização não habilitada" / "VT-x not enabled" | Virtualização desligada na BIOS | Reiniciar, entrar na BIOS (Del/F2/F10) e ativar Intel VT-x ou AMD SVM |
| "wsl --install" não encontrado | Windows muito antigo | Atualizar o Windows (WSL 2 requer Windows 10 build 19041+) |
| Prompt de 60 segundos ao ligar | Docker na inicialização sem WSL | Ver seção 1 acima |

### Verificação do Docker após o WSL

Com o Docker Desktop aberto:

```powershell
docker run --rm hello-world
```

Se imprimir "Hello from Docker!", a instalação está completa e funcional.

---

## 3. Configuração do ambiente isolado (Dev Container)

### O que é e quando usar

Um Dev Container é um ambiente de desenvolvimento que roda dentro de um
contêiner Docker. Vantagens:

- Versão exata do Node garantida para todos os colaboradores
- `npm install` automático ao criar o contêiner
- Não polui o Windows com ferramentas do projeto
- Qualquer máquina com Docker recria o ambiente idêntico

Indicado para quem vai **mexer no código**. Para quem só quer rodar ou
demonstrar o jogo, basta Node.js + `npm install` (ver seção 4).

### Arquivo `.devcontainer/devcontainer.json`

```json
{
  "name": "Capivara Companheira",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "forwardPorts": [8081],
  "portsAttributes": {
    "8081": { "label": "Expo / Metro bundler" }
  },
  "mounts": [
    "source=capivara-node-modules,target=${containerWorkspaceFolder}/node_modules,type=volume"
  ],
  "postCreateCommand": "sudo chown node:node node_modules && npm install",
  "remoteUser": "node",
  "customizations": {
    "vscode": {
      "extensions": ["expo.vscode-expo-tools"]
    }
  }
}
```

**Decisões de design:**

- **Imagem `typescript-node:20`** — Node 20 LTS com TypeScript e Git
  inclusos; não precisa de Dockerfile próprio porque o projeto Expo é
  gerenciado (sem código nativo customizado).
- **Volume para `node_modules`** — no Windows, o bind mount é lento para
  milhares de arquivos pequenos. Manter o `node_modules` num volume Linux
  nativo acelera muito o `npm install` e o Metro bundler.
- **`sudo chown` antes do `npm install`** — o volume é criado pertencendo ao
  root; é preciso devolver a posse ao usuário `node` antes de instalar.
- **Porta 8081** — porta padrão do Metro bundler. Permite abrir a versão web
  (`npx expo start --web`) no navegador do Windows normalmente.

### VS Code não é obrigatório

O formato `devcontainer.json` é um [padrão aberto](https://containers.dev/).
Funciona com qualquer cliente compatível:

**Via terminal (Dev Container CLI):**

```bash
npm install -g @devcontainers/cli
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . npx expo start --tunnel
```

**Via VS Code** (se já usar): instalar a extensão
`ms-vscode-remote.remote-containers` → abrir a pasta → "Reopen in Container".

**Outros clientes:** JetBrains (IntelliJ/WebStorm), GitHub Codespaces.

### Atenção: celular físico + Dev Container

Com o servidor rodando dentro do contêiner, o modo LAN não funciona — o
celular não enxerga o servidor pela rede local. Usar sempre:

```bash
npx expo start --tunnel
```

O `--tunnel` cria uma conexão pública que atravessa o contêiner. A versão web
(porta 8081 encaminhada) funciona normalmente sem tunnel.

---

## 4. Fluxo rápido sem Docker (para demonstrações)

Para rodar o jogo sem Docker, WSL ou Dev Container — ideal para o dia da
demonstração em qualquer máquina:

```bash
git clone https://github.com/erik-gastao/Capivara.git
cd Capivara
npm install
npx expo start --tunnel   # leia o QR Code com o Expo Go no celular
```

Requisitos: apenas **Node.js LTS** (18 ou 20) e o app **Expo Go** no celular.

---

## 5. Script de setup para Windows (`setup.ps1`)

Script idempotente (pode rodar várias vezes sem problema) que instala via
`winget` só o que estiver faltando.

```powershell
# Instala Git + Node (mínimo para rodar o projeto)
powershell -ExecutionPolicy Bypass -File .\setup.ps1

# + Docker Desktop (para usar o Dev Container)
powershell -ExecutionPolicy Bypass -File .\setup.ps1 -ComDocker

# + VS Code (opcional)
powershell -ExecutionPolicy Bypass -File .\setup.ps1 -ComDocker -ComVSCode
```

**Limitação conhecida:** o WSL não pode ser instalado por script sem
intervenção do usuário — exige PowerShell como administrador e uma
reinicialização. O script detecta quando o WSL está faltando e imprime as
instruções exatas.

**Pré-requisito do script:** o `winget` precisa estar disponível. Se não
estiver, instalar o "Instalador de Aplicativo" pela Microsoft Store:
`https://apps.microsoft.com/detail/9NBLGGH4NNS1`

---

## 6. Atualização Expo SDK 51 → 54

### Por que atualizar

O Expo Go nas lojas de aplicativos é atualizado periodicamente e deixa de
suportar SDKs antigos. Para testar num dispositivo físico com o Expo Go atual,
o projeto precisou subir para o SDK 54.

### Comando oficial e suas limitações

O comando oficial de upgrade é:

```bash
npx expo install expo@~54.0.0 --fix
```

Ele calcula as versões compatíveis de todas as dependências e atualiza o
`package.json`. No entanto, **não atualiza tudo automaticamente** — neste
projeto, ficaram com versões erradas após o comando:

| Pacote | Esperado | Deixado para trás |
|---|---|---|
| `@types/react` | `~19.1.10` | `~18.2.79` |
| `typescript` | `~5.9.2` | `~5.3.3` |
| `@react-navigation/native` | `^7.x` | `^6.1.18` |
| `@react-navigation/native-stack` | `^7.x` | `^6.9.26` |
| `@expo/vector-icons` | `^15.1.1` | ausente (era transitivo no SDK 51) |

### Causa dos conflitos

O `@react-navigation` v6 declara `react@"^18.0.0"` como peer dependency. O
SDK 54 quer `react@19.1.0`. O npm não consegue resolver essa contradição e
aborta a instalação.

A solução foi atualizar o `@react-navigation` para a **v7**, que suporta
React 19, e corrigir manualmente as versões do `@types/react` e do
`typescript` no `package.json`.

### Passos completos que funcionaram

```bash
# 1. Rodar o comando oficial (atualiza a maioria das dependências)
npx expo install expo@~54.0.0 --fix

# Se falhar, editar o package.json manualmente com as versões abaixo e rodar:
npm install
```

**Versões finais no `package.json` após o upgrade:**

```json
{
  "dependencies": {
    "@expo/metro-runtime": "~6.1.2",
    "@expo/vector-icons": "^15.1.1",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/native": "^7.3.2",
    "@react-navigation/native-stack": "^7.17.4",
    "expo": "~54.0.0",
    "expo-status-bar": "~3.0.9",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-web": "^0.21.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~19.1.10",
    "typescript": "~5.9.2"
  }
}
```

### Avisos do npm que podem ser ignorados

Durante o `npm install`, aparecem muitos avisos `ERESOLVE overriding peer
dependency`. Esses são **avisos, não erros** — o npm instalou mesmo assim,
sobrescrevendo os conflitos. São normais na transição React 18 → 19, onde
muitos pacotes ainda não atualizaram suas declarações de peer dependency.

O critério de que o upgrade está correto é o TypeScript compilar sem erros:

```bash
npx tsc --noEmit
# saída vazia = tudo certo
```

### Mudanças de código necessárias

Nenhuma neste projeto. O `@react-navigation` v7 manteve a mesma API para
`NativeStackScreenProps`, `useNavigation`, `useFocusEffect` e afins. O
`AsyncStorage` 2.x também foi transparente porque a única API que mudou
(`getAllKeys`) não era usada.

---

## 7. Problemas ao testar no Expo Go após o upgrade

### Erro 1: "Cannot find module 'babel-preset-expo'"

Aparece no terminal ao rodar `expo start`. O `babel-preset-expo` era uma
dependência transitiva no SDK 51 e deixou de ser no SDK 54 — precisa ser
declarado explicitamente no `package.json`:

```bash
npm install babel-preset-expo
```

### Erro 2: "private properties are not supported" (tela vermelha no celular)

```
[runtime not ready]: SyntaxError: 33919:5: private properties are not supported
```

**Causa real:** incompatibilidade entre a versão do SDK do projeto e a versão
do Expo Go instalada no dispositivo. O Expo Go suporta apenas as duas últimas
versões do SDK. Se o projeto estiver numa versão que o Expo Go não suporta
mais (ou ainda não suporta), o Hermes — motor JavaScript embutido no Expo Go
— rejeita o bundle.

**Diagnóstico:** verificar qual SDK o Expo Go do dispositivo suporta
(aparece na tela inicial do app) e comparar com a versão no `package.json`.

**Solução:** manter o projeto na mesma versão de SDK que o Expo Go suporta.
Para descobrir o SDK mais recente disponível no npm:

```bash
npm show expo version --json
```

**Atenção:** não basta o Expo Go estar "atualizado" na loja — a loja pode
estar oferecendo uma versão que suporta SDK 54 enquanto o npm já tem SDK 56.
Sempre confirmar com o usuário qual versão o Expo Go do dispositivo alvo
suporta **antes** de definir qual SDK usar no projeto.

### Erro 3: "PluginError: Unable to resolve a valid config plugin for expo-status-bar"

```
PluginError: Unable to resolve a valid config plugin for expo-status-bar
```

**Causa:** o comando `expo install expo@~56.0.0 --fix` adicionou
automaticamente `"expo-status-bar"` na lista de `plugins` do `app.json`.
Ao reverter para SDK 54, a versão antiga do `expo-status-bar` (`~3.0.9`)
não tem `app.plugin.js` e o Expo não consegue carregar o plugin.

**Solução:** remover a entrada de `plugins` do `app.json`:

```json
// Remover este bloco do app.json:
"plugins": [
  "expo-status-bar"
]
```

### Erro 4: "Port 8081 is already in use"

Processo Node anterior ficou preso em segundo plano. Para liberar a porta:

```powershell
# Descobrir o PID do processo na porta 8081
Get-NetTCPConnection -LocalPort 8081 | Select-Object OwningProcess

# Encerrar o processo (substituir XXXX pelo PID)
Stop-Process -Id XXXX -Force
```

### Lição aprendida: sequência segura para testar no celular

1. Confirmar a versão de SDK que o Expo Go do dispositivo suporta
2. Instalar a versão de SDK correspondente no projeto
3. Deletar `node_modules`, `package-lock.json` e `.expo` antes de reinstalar
   após qualquer troca de SDK (cache corrompido causa erros difíceis de diagnosticar)
4. Rodar sempre com `--clear` na primeira vez após um upgrade: `npx expo start --tunnel --clear`
5. Limpar o cache do Expo Go no dispositivo: Configurações → Aplicativos →
   Expo Go → Armazenamento → Limpar cache

---

## 8. Configuração do Git e fluxo de fork

### Identidade global do Git

Configurar uma vez na máquina para que todos os commits saiam com a autoria
correta:

```bash
git config --global user.name "Nome Completo"
git config --global user.email "email@exemplo.com"
```

Para o e-mail aparecer vinculado ao perfil do GitHub (avatar, gráfico de
contribuições), ele precisa estar cadastrado em:
GitHub → Settings → Emails.

### Fluxo de fork adotado

```
upstream → BerBelmont/Capivara  (repositório original do colega)
origin   → erik-gastao/Capivara (fork pessoal)
```

Configurar os remotes:

```bash
# Se o origin ainda aponta para o repositório do colega:
git remote rename origin upstream
git remote add origin https://github.com/SEU-USUARIO/Capivara.git
```

**Fluxo do dia a dia:**
- Desenvolver na branch `erik-adds` (ou branches de funcionalidade)
- `git push origin erik-adds` — envia para o fork pessoal
- Abrir Pull Request do fork para o repositório do colega quando pronto
- `git fetch upstream` — puxa atualizações do repositório do colega

### Merge do fork na main

Quando o `erik-adds` diverge da `main` do fork (porque o colega fez commits
no original), o fluxo para unir tudo:

```bash
git fetch origin          # baixa o estado atual do fork
git switch -c main origin/main   # cria main local a partir do fork
git merge erik-adds --no-edit    # mescla as mudanças (sem conflito se os arquivos forem diferentes)
npx tsc --noEmit                 # valida antes de enviar
git push origin main
```

---

## Referências rápidas

| Situação | Comando |
|---|---|
| Rodar o jogo no celular | `npx expo start --tunnel` |
| Rodar no navegador | `npx expo start --web` |
| Verificar TypeScript | `npx tsc --noEmit` |
| Ver versão do WSL | `wsl --status` |
| Testar Docker | `docker run --rm hello-world` |
| Ver remotes do Git | `git remote -v` |
| Ver inicialização do Windows | `Get-ItemProperty "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Run"` |
