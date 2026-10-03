# Ditar o n.º da análise no modo mãos livres

## Problema

O campo "N.º da análise" é preenchido por um comando de voz (`App, análise ...`), mas o interpretador só sabe converter dígitos, números por extenso até vinte e o alfabeto NATO (alfa, bravo, charlie...). Quando o médico dita o código como se lê em português — "cê vinte e seis agá zero zero zero zero" — ou usa "traço"/"barra", nada corresponde e o comando é descartado, pelo que o campo fica vazio.

## O que vai mudar

1. **Nomes de letras em português** aceites na leitura soletrada: a, bê, cê, dê, é, éfe, gê, agá, i, jota, capa/cá, éle, éme, éne, ó, pê, quê, érre, ésse, tê, u, vê, dâblio/duplo vê, xis, ípsilon, zê — incluindo as variantes sem acento que o reconhecimento devolve.
2. **Números compostos**: "vinte e seis", "trinta e dois", "cento e vinte", dezenas e centenas, juntando-se corretamente ao código (ex.: "cê vinte e seis agá zero zero zero zero" → `C26H0000`).
3. **Separadores ditados**: "traço"/"hífen" → `-`, "barra" → `/`, "ponto" → `.`, "espaço" ignorado.
4. **Mais formas de invocar o comando**: "número de análise", "n.º análise", "análise número", "código da análise", "referência", além das já existentes.
5. **Limpeza do resultado**: remover espaços residuais e forçar maiúsculas, mantendo o formato usado hoje (`DMP000`, `C26H0000`).
6. **Confirmação audível/visível**: ao reconhecer, além de preencher o campo, mostrar um aviso com o valor lido (`Análise C26H0000 registada`) para o médico detetar leituras erradas sem tirar as mãos do trabalho.
7. **Ajuda actualizada**: acrescentar exemplos de ditado do código à lista de comandos.

## Detalhes técnicos

- Alterações concentradas em `src/lib/comandos-voz.ts`: expandir `NUMEROS`/`LETRAS_DITADAS`, reescrever `juntarCodigo` para percorrer os tokens com suporte a números compostos e separadores, e alargar o regex do comando `analise`.
- Em `src/routes/_authenticated/app.tsx`, o handler do comando `analise` passa a mostrar um toast com o valor aplicado (já preenche `numeroAnalise`; a lógica de gravação, transcrição e exportação fica intacta).
- `src/components/campo-analise.tsx` e o resto da UI não mudam.
- Sem alterações à base de dados, à IA ou à exportação Word/HL7.
