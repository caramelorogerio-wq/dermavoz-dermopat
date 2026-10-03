# Palavra de activação: "app" em vez de "DermaVoz"

## O que muda

No modo mãos livres passa a bastar dizer **"App, …"** antes de cada comando — por exemplo, "App, iniciar gravação", "App, guardar", "App, exportar".

- "DermaVoz" continua a funcionar como alternativa (quem já se habituou não perde nada).
- A lista de ajuda, o texto do painel e os exemplos passam todos a mostrar "App, …".
- Variantes de reconhecimento aceites: "app", "ap", "apo", "APP" (o reconhecimento de voz em pt-PT nem sempre devolve a mesma grafia).

## Nota

"App" é uma palavra curta e pode aparecer no meio do ditado. Para evitar comandos acidentais, mantém-se a regra actual: só conta como comando quando a frase **começa** pela palavra de activação — dizer "app" a meio de uma frase não dispara nada. As acções destrutivas (apagar amostra, novo relatório, terminar sessão) continuam a exigir "confirmar".

## Detalhes técnicos

- `src/lib/comandos-voz.ts`: `PALAVRA_ACTIVACAO = "App"`; acrescentar "app", "ap", "apo" ao início de `VARIANTES_ACTIVACAO` mantendo as variantes de "dermavoz"; actualizar os exemplos de `LISTA_COMANDOS` para o prefixo "App,".
- `src/components/barra-comandos-voz.tsx`: actualizar o texto explicativo e o aviso de confirmação para usar "App".
- Sem alterações à gravação, transcrição, base de dados ou exportação.
