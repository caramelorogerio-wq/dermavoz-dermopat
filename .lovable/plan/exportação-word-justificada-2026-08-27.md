# Exportação Word justificada

## Objetivo
O corpo do relatório exportado para Word (.docx) deve ficar em formato **justificado** (texto alinhado a ambos os margens), mantendo a fonte Century Gothic 10pt já configurada.

## Alteração
Ficheiro único: `src/lib/relatorio-docx.ts`

Aplicar `alignment: AlignmentType.JUSTIFIED` aos parágrafos do corpo do relatório — o array `paragrafos` gerado a partir do texto transcrito (linhas 123-132). Estes são os parágrafos de conteúdo clínico ditado pelo médico.

Mantêm o alinhamento atual:
- Título (H1) — conforme template (center no "carta", left nos restantes)
- Subtítulo "Relatório clínico · {data}" — conforme template
- Linhas do "Resumo técnico" (`linha(...)`) — sem alinhamento (esquerda)
- Cabeçalhos e rodapés — inalterados

`AlignmentType.JUSTIFIED` já está disponível no import atual do `docx`.

## Nota técnica
Em docx-js, a justificação só se aplica a parágrafos com mais de uma linha; linhas curtas (última linha de cada parágrafo) ficam naturalmente alinhadas à esquerda, que é o comportamento esperado em Word.
