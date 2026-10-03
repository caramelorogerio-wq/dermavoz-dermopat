# Várias amostras por análise

Uma análise (ex.: DMP000) passa a poder conter várias amostras, cada uma com o seu título livre, texto macroscópico e resumo técnico próprio.

## Como vai funcionar

1. **Ditado contínuo**: o médico dita tudo seguido, dizendo em voz alta o título de cada amostra (ex.: "amostra: lesão do dorso ... amostra: nevo do braço ...").
2. **Separação automática**: ao terminar o ditado (ou ao carregar em "Separar amostras"), a IA divide o texto transcrito em blocos, atribuindo a cada um o título livre que o médico ditou. Se não detetar títulos, mantém tudo numa amostra única.
3. **Revisão**: cada amostra aparece como um cartão editável — título, texto e resumo técnico (fragmentos, blocos, seccionado, inclusão, código de faturação). O médico pode renomear, editar o texto, reordenar, adicionar ou remover amostras manualmente.
4. **Otimizar com IA**: aplica-se a todas as amostras, mantendo a separação.
5. **Guardar**: o relatório continua a ser um registo por análise, agora com as amostras guardadas dentro dele.
6. **Exportar Word**: um único ficheiro `DMP000.docx`, com o n.º da análise como título e cada amostra como secção (título da amostra + texto justificado + resumo técnico dessa amostra). Century Gothic 10, cabeçalho/rodapé e modelos existentes mantidos.

## Detalhes técnicos

- **Estado**: em `src/routes/_authenticated/app.tsx`, substituir `texto` + resumo único por `amostras: { id, titulo, texto, resumo }[]`, com uma amostra por defeito. O textarea principal passa a ser por amostra.
- **Separação**: nova função em `src/lib/ai-clinico.ts` / `transcribe.functions.ts` — prompt que devolve JSON `[{ titulo, texto }]` a partir do texto ditado, respeitando pt-PT e o vocabulário aprendido. Fallback: heurística por regex ("amostra …:") e, em último caso, uma única amostra.
- **Base de dados**: acrescentar coluna `amostras jsonb` (default `[]`) a `relatorios_transcritos`, via migração. As colunas atuais (`fragmentos`, `blocos`, `seccionado`, `inclusao`, `codigo_faturacao`) ficam como estão para compatibilidade com relatórios antigos; ao carregar um relatório sem `amostras`, monta-se uma amostra única a partir de `texto` + colunas existentes. RLS mantém-se inalterada.
- **Componentes**: `src/components/resumo-tecnico.tsx` passa a ser reutilizável por amostra (recebe `id` único nos campos); novo `src/components/lista-amostras.tsx` para os cartões (adicionar / remover / reordenar / amostra ativa).
- **Word**: `src/lib/relatorio-docx.ts` aceita `amostras: { titulo, texto, resumo }[]` e emite uma secção por amostra (título como Heading 2, texto justificado, resumo técnico por baixo), mantendo assinatura antiga como fallback.
- Interface, autenticação, vocabulário aprendido e endpoint `/api/transcrever` mantêm-se sem alterações de comportamento.
