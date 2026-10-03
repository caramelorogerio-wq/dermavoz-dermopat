# Nome do ficheiro Word exportado perde o n.º da análise

## Causa confirmada

Testei o fluxo real no browser (sessão autenticada). Com o n.º da análise preenchido, a exportação gera o nome correto (`C26H0000.docx`). O problema é que a função `guardar` (Guardar relatório) limpa o n.º da análise no fim:

```js
// src/routes/_authenticated/app.tsx, linha 486 (dentro de guardar)
setNumeroAnalise("");
```

Fluxo problemático do médico:
1. Lê o código de barras → `numeroAnalise = "C26H0000"`
2. Dita o relatório
3. Clica em **Guardar** → `guardar()` corre `setNumeroAnalise("")`
4. Clica em **Exportar Word** → o nome do ficheiro passa a `relatorio.docx` (fallback), porque o número já foi apagado

Notar que `guardar` não limpa o `texto` (só limpa `textoOtimizado` e `numeroAnalise`), pelo que o campo do número fica vazio mas o texto permanece — comportamento inconsistente que origina o bug.

## Solução

Manter o n.º da análise depois de guardar, para que a exportação seguinte o use como nome de ficheiro. Remover a linha `setNumeroAnalise("")` de `guardar`.

### Alteração concreta em `src/routes/_authenticated/app.tsx`

Na função `guardar`, remover:

```js
setNumeroAnalise("");
```

(mantendo `setTextoOtimizado(null)` e o resto).

Assim, depois de guardar, o campo "N.º da análise" mantém-se preenchido e a exportação seguinte gera `C26H0000.docx`. Para iniciar uma nova análise, o médico lê o próximo código de barras (que substitui o valor) ou limpa manualmente — igual a hoje, mas sem perder o número entre guardar e exportar.

Não há outras alterações: UI, templates, conteúdo do documento e restante comportamento mantêm-se.
