# Códigos de facturação em quadro próprio no Word

## Objectivo

No resumo técnico de cada amostra deixa de aparecer o "N.º da análise" e o "Código de facturação". Os códigos passam a estar reunidos num quadro único no fim do documento.

## Alterações

1. Resumo técnico (por amostra), passa a mostrar apenas:
   - N.º de fragmentos
   - N.º de blocos (mantendo a numeração contínua "1 a 3", "4 a 6", ...)
   - Seccionado
   - Inclusão

   O "N.º da análise" deixa de aparecer também no caso de amostra única (continua no título e no cabeçalho do documento).

2. Novo quadro final "Códigos de facturação", depois da última amostra:
   - Uma linha por amostra, com o nome da amostra (ou "Amostra N") e o respectivo código.
   - Em relatório de amostra única, uma só linha com o código.
   - Estilo igual ao resumo: Century Gothic 10pt, duas colunas, sem grelha visível, precedido de um título a negrito.

## Detalhe técnico

Apenas `src/lib/relatorio-docx.ts`:
- Remover as entradas `N.º da análise` e `Código de facturação` do array `campos` em `corpoAmostra`.
- Acrescentar uma função que constrói o quadro final a partir de `lista` (reutilizando `celula`/`SEM_BORDAS`, com colunas rótulo/valor) e inseri-la no fim de `children` da secção.

Sem alterações à UI, base de dados ou transcrição.
