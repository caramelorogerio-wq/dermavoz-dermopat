# Resumo técnico por voz — modo guiado

Hoje é preciso dizer tudo numa frase só ("App, resumo técnico 3 fragmentos 2 blocos seccionado total"). Passa a haver um modo passo a passo: entra-se no quadro e preenche-se campo a campo, com respostas curtas.

## Como fica

1. `App, resumo técnico` (ou `App, preencher resumo`) — entra no quadro da amostra activa. O cartão do resumo fica destacado e a barra de voz mostra a pergunta actual.
2. A app pergunta, por ordem:
   - "Fragmentos?" → responder só o número: `três` ou `3`
   - "Blocos?" → `dois`
   - "Seccionado?" → `seccionado` / `não seccionado` (ou `sim` / `não`)
   - "Inclusão?" → `total` / `reserva`
   - "Código?" → `31057` / `31077` (ou `um` / `dois` para a 1.ª/2.ª opção)
3. Cada resposta é aplicada logo e avança para o campo seguinte. No fim: "Resumo técnico preenchido" e sai do modo.

Dentro do modo guiado não é preciso dizer "App" antes de cada resposta — só palavras soltas. Comandos de apoio:
- `saltar` / `seguinte` — deixa o campo como está
- `voltar` / `anterior` — regressa ao campo anterior
- `repetir` — repete a pergunta
- `sair` / `terminar` — fecha o modo guiado a qualquer momento

## Atalhos directos (continuam a funcionar)

Frases curtas sem entrar no modo guiado, para correcções pontuais:
- `App, 3 fragmentos`
- `App, 2 blocos`
- `App, não seccionado`
- `App, inclusão total` / `App, reserva`
- `App, código 31077`

A frase longa actual (`App, resumo técnico 3 fragmentos 2 blocos seccionado total`) deixa de existir.

## Notas técnicas

- `src/lib/comandos-voz.ts`: novo comando `{ tipo: "resumo-guiado" }` e um interpretador separado `interpretarRespostaResumo(campo, texto)` para respostas soltas por campo; alargar os atalhos curtos no `interpretarComando`.
- `src/routes/_authenticated/app.tsx`: estado `campoResumoActivo` (ou `null`); enquanto activo, as frases ouvidas passam primeiro pelo interpretador de respostas e só depois pelo fluxo normal de comandos; a resposta actualiza `amostraActiva.resumo` via `actualizarAmostra`. Sai do modo ao gravar ditado, mudar de amostra ou dizer `sair`.
- `src/components/barra-comandos-voz.tsx`: mostra a pergunta actual e as opções aceites em vez do texto "Ouvido".
- `src/components/resumo-tecnico.tsx`: realce visual (anel/borda) no campo que está a ser preenchido, via nova prop opcional `campoActivo`.
- Sem alterações à base de dados, à transcrição por IA ou à exportação Word.
