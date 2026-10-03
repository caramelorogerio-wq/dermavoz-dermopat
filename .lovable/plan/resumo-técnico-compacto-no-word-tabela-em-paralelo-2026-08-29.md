# Resumo técnico compacto no Word (tabela em paralelo)

## Problema

Hoje, na exportação Word, cada campo do resumo técnico ocupa uma linha própria ("N.º de fragmentos", "N.º de blocos", "Seccionado", "Inclusão", "Código de faturação"), o que gasta 5-6 linhas por amostra.

## Solução

Substituir essas linhas por uma tabela discreta de 2 colunas (rótulo/valor em paralelo), sem grelha visível, que passa a ocupar cerca de 3 linhas:

```text
Resumo técnico da amostra
N.º de fragmentos: 3        Seccionado: Sim
N.º de blocos: 2            Inclusão: Total
Código de faturação: 31057
```

- Mantém-se o mesmo conteúdo e os mesmos rótulos, só muda a disposição.
- Century Gothic 10pt, coerente com o resto do documento.
- Nos relatórios de amostra única, o "N.º da análise" entra como primeiro campo da tabela.
- Sem bordas visíveis (apenas uma linha fina superior a separar do texto, opcional), com espaçamento interno mínimo nas células.

## Numeração contínua dos blocos

O "N.º de blocos" passa a ser exportado como intervalo, contado de forma contínua ao longo das amostras da mesma análise:

```text
Amostra 1 (3 blocos) → N.º de blocos: 1 a 3
Amostra 2 (3 blocos) → N.º de blocos: 4 a 6
Amostra 3 (2 blocos) → N.º de blocos: 7 a 8
```

- Com 1 bloco escreve-se apenas o número (ex.: "4"), não "4 a 4".
- Com 0 blocos escreve-se "0".
- A contagem reinicia em cada documento exportado (cada análise).
- Só muda a exportação Word; na interface o médico continua a introduzir apenas a quantidade de blocos da amostra.

## Notas técnicas

- `src/lib/relatorio-docx.ts`: o bloco de `linha(...)` em `corpoAmostra` passa a construir uma `Table` com `WidthType.DXA`, `columnWidths` somando à largura útil da página (A4 com margens actuais), `borders` a `BorderStyle.NONE` e `margins` pequenas nas células.
- `corpoAmostra` passa a devolver `(Paragraph | Table)[]`; ajustar as assinaturas e o `children` das secções em conformidade.
- Acumulador de blocos percorrido por índice de amostra para calcular início/fim do intervalo.
- Sem alterações à interface, à base de dados ou ao componente `resumo-tecnico.tsx`.

