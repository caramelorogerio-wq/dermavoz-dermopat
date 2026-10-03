# Correcção do layout do resumo técnico no Word

## Opção escolhida
**A) Corrigir o documento Word exportado.**

## Problema
Quando o relatório tem várias amostras, o número dos blocos (agora mostrado como intervalo contínuo, ex. "4 a 5") fica na mesma linha do número de fragmentos no resumo técnico. Este layout lado-a-lado só funciona bem quando há uma única amostra.

## Solução
- Manter o resumo técnico com **duas colunas** em relatórios de amostra única.
- Em relatórios com **várias amostras**, apresentar os campos do resumo técnico de cada amostra em **linhas separadas** (uma coluna só), dando mais destaque ao intervalo de blocos.

## Ficheiro a alterar
- `src/lib/relatorio-docx.ts`

## Verificação
- Gerar um documento Word de teste com várias amostras e confirmar que os campos do resumo técnico aparecem empilhados verticalmente.
