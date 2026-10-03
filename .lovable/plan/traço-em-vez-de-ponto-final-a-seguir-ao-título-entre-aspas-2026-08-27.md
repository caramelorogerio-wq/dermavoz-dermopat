# Traço em vez de ponto final a seguir ao título entre aspas

## Contexto
Quando o médico dita um título de amostra delimitado por comandos de voz ("abrir aspas … fechar aspas"), o texto otimizado apresenta um ponto final a seguir ao fecho das aspas (ex.: `"lesão do dorso".`). O médico prefere que a seguir ao título entre aspas apareça um traço (`"lesão do dorso" -`), funcionando como separador entre o título e o corpo do texto.

## Alterações

### 1. `src/lib/ai-clinico.ts` — `PROMPT_OTIMIZACAO`
Acrescentar instrução ao prompt: quando um título é delimitado por "abrir/fechar aspas", a aspa de fecho **não** deve ser seguida de ponto final; em vez disso, deve ser seguida de um traço (" -") que separa o título do corpo do texto. Manter as restantes regras de aspas já existentes.

### 2. `src/lib/amostras.ts` — `normalizarAspasDitadas`
Após substituir "fechar aspas" pela aspa de fecho `"`, substituir um ponto final imediatamente a seguir pela sequência " -" (espaço + traço). Garantir que não ficam traços duplicados e que a regra só se aplica à aspa de fecho (não a aspas normais no meio do texto). Esta função alimenta a separação heurística (fallback quando a IA de separação não está disponível), pelo que o comportamento fica consistente com a otimização.

## Verificação
- `tsgo` typecheck do projeto.
- Confirmar que a regra só afecta o fecho de aspas ditadas (títulos) e não aspas gerais no corpo do texto.

## Não alterar
- UI, autenticação, transcrição, separação por IA, exportação Word, base de dados.
