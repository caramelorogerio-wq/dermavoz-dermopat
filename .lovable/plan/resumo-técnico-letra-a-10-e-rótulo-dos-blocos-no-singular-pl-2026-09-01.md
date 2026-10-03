# Resumo técnico: letra a 10 e rótulo dos blocos no singular/plural

## O que muda

1. **Tamanho de letra 10 em todo o resumo técnico (Word).** Os valores dos campos já saem a 10pt, mas o título "Resumo técnico"/"Resumo técnico da amostra" sai a 11pt ou 13pt. Passa a 10pt (a negrito) para o quadro ficar uniforme.

2. **Rótulo do número de blocos conforme a quantidade.**
   - Mais do que 1 bloco: `N.º dos blocos: 1 a 3` (intervalo contínuo entre amostras, como hoje).
   - Exactamente 1 bloco: `N.º do bloco: 4`.
   - Nunca há 0 blocos: o mínimo é 1, pelo que o valor por omissão do campo passa a 1 e nunca se exporta "0".

3. **Mesma regra na exportação HL7/FHIR.** O resumo textual enviado passa a usar o mesmo rótulo (`N.º do bloco` / `N.º dos blocos`) e o mesmo intervalo numérico contínuo por amostra que o Word, em vez da contagem simples actual.

## Detalhes técnicos

- `src/lib/relatorio-docx.ts`: título do resumo com `size: 20`; rótulo do campo calculado a partir de `amostra.resumo.blocos` (`blocos === 1 ? "N.º do bloco" : "N.º dos blocos"`).
- `src/lib/relatorio-docx.ts`: exportar um auxiliar `rotuloBlocos(quantidade)` reutilizável.
- `src/lib/hl7.ts`: `resumoTexto` passa a receber o número do primeiro bloco da amostra e usar `rotuloBlocos` + `intervaloBlocos`; a numeração acumula ao longo das amostras da mesma análise, tal como no Word.

Sem alterações à interface, base de dados, comandos de voz ou IA.
