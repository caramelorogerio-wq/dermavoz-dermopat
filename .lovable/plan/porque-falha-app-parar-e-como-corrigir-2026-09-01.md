# Porque falha "App, parar" e como corrigir

## Diagnóstico (confirmado no código)

Durante a gravação o comando de paragem falha por três razões que se acumulam:

1. **A escuta é desligada durante a gravação.** Em `app.tsx`, quando o gravador não arranca à primeira, a app faz `setVozSuspensa(true)` e volta a tentar — mas nunca reactiva a escuta enquanto grava. Com `suspenso = true`, o hook `use-reconhecimento-voz` faz `abort()` e deixa de ouvir. Nesse cenário nenhum comando é ouvido, incluindo "App, parar".

2. **Se o reconhecimento morre, não é retomado.** No hook, o reinício após `onend` faz `instancia.start()` dentro de um `try/catch` vazio. Se o motor recusar (microfone ocupado pelo `MediaRecorder`), a escuta fica desligada em silêncio, sem aviso e sem nova tentativa.

3. **Exige sempre a palavra de activação.** Durante a gravação, a fala do médico vai toda para o ditado; dizer só "parar" não é aceite e frases não reconhecidas são descartadas (`if (aGravarRef.current) return`).

## O que vai mudar

- **Nunca suspender a escuta durante a gravação.** A suspensão passa a ser usada apenas na janela curta em que se liberta o microfone para a segunda tentativa de arranque, sendo reactivada assim que a gravação começa.
- **Reinício resiliente da escuta.** Se `start()` falhar, tenta de novo com recuo progressivo (100 ms, 300 ms, 800 ms, 1,5 s) enquanto o modo mãos livres estiver ligado, em vez de desistir em silêncio.
- **Palavras de paragem sem palavra de activação.** Durante a gravação, "parar", "para", "stop", "terminar" e "fim de ditado" param a gravação mesmo sem dizer "App". Estas palavras são removidas do fim do texto ditado para não ficarem no relatório.
- **Escape sempre disponível.** A tecla `Esc` passa a parar a gravação, como rede de segurança quando o navegador não deixa partilhar o microfone.
- **Indicação honesta do estado.** A barra de comandos mostra "escuta indisponível durante a gravação" quando o reconhecimento não conseguir arrancar, para o médico saber que tem de usar o botão ou o `Esc`.

## Detalhes técnicos

- `src/hooks/use-reconhecimento-voz.ts`: retentativas com recuo no `onend` e no arranque; expor `activoReal` para a UI saber se está mesmo a ouvir.
- `src/routes/_authenticated/app.tsx`: reactivar `setVozSuspensa(false)` logo após arranque bem-sucedido; em `tratarFrase`, quando `aGravarRef.current` é verdadeiro, comparar a frase com a lista de palavras de paragem antes de descartar; handler de `keydown` para `Esc`.
- `src/lib/comandos-voz.ts`: exportar `PALAVRAS_PARAGEM` e uma função `ehParagemDirecta(texto)`.
- `src/components/barra-comandos-voz.tsx`: estado de escuta durante gravação.

Sem alterações à base de dados, IA, exportação Word ou HL7.
