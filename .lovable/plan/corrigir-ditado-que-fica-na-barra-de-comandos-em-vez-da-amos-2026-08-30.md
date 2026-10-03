# Corrigir ditado que fica na barra de comandos em vez da amostra

## O que se passa (confirmado no código)

Com o modo mãos livres ligado, dois consumidores do microfone correm ao mesmo tempo:

- o reconhecimento do navegador (`use-reconhecimento-voz.ts`) está em escuta contínua e mostra tudo o que ouve na linha "Ouvido: …";
- o gravador (`recorder-panel.tsx`) abre um segundo `getUserMedia` quando se diz "App, iniciar gravação".

Hoje nada coordena os dois:

- `app.tsx` (caso `iniciar-gravacao`) chama `recorderRef.current?.iniciar()` e mostra logo "A gravar…", mesmo que o gravador falhe — `iniciar()` é assíncrono e não devolve resultado;
- o reconhecimento nunca é suspenso durante a gravação.

Resultado: o médico dita, o texto aparece só em "Ouvido: fragmento Fusiforme de pele" e nunca chega ao campo da amostra.

## O que vai ser feito

1. **Um microfone de cada vez** — ao iniciar gravação por voz, o reconhecimento de comandos é suspenso; ao parar, é retomado. O áudio do ditado passa a ir sempre para o gravador e daí para a transcrição.
2. **Escuta mínima para parar** — durante a gravação fica activa apenas a deteção de "App, parar" / "App, terminar" (janelas curtas entre fatias de áudio), para não se perder o controlo por voz.
3. **Estado honesto** — "A gravar…" só aparece quando o gravador arranca mesmo; se falhar (permissão, microfone ocupado), mostra-se o motivo real em vez de sucesso falso.
4. **Texto na amostra certa** — a amostra activa no momento em que a gravação começa fica fixada como destino da transcrição, mesmo que a amostra activa mude entretanto.
5. **Indicação visual** — a barra de comandos passa a mostrar "A gravar — diga 'App, parar'" enquanto grava.

## Notas técnicas

- `src/components/recorder-panel.tsx`: `iniciar()`/`parar()` expostos por ref devolvem `Promise<boolean>`/`boolean` com o resultado real; o erro de `getUserMedia` é propagado como mensagem.
- `src/hooks/use-reconhecimento-voz.ts`: nova opção `suspenso` (pausa/retoma sem destruir o hook) e modo `apenasParar` para a escuta mínima.
- `src/routes/_authenticated/app.tsx`: `iniciar-gravacao` aguarda o arranque, suspende os comandos e guarda o id da amostra alvo; `parar-gravacao` retoma a escuta completa.
- `src/components/barra-comandos-voz.tsx`: apenas apresentação do novo estado.

Sem alterações à base de dados, à transcrição por IA nem à exportação Word.
