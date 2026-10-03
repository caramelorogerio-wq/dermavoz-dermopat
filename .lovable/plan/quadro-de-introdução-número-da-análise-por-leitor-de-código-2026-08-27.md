# Quadro de introdução: número da análise por leitor de código de barras

## O que muda

O painel "Doentes" (seleção de doente, nome, n.º de processo, botão adicionar) é substituído por um painel simples **"Análise"** com um único campo: **N.º da análise**.

O campo é preparado para leitor físico de códigos de barras/QR (o leitor comporta-se como teclado):

- O campo fica com foco automático ao abrir a página, pronto a receber a leitura
- A leitura termina em Enter: o valor é aceite, limpo de espaços/quebras de linha e confirmado com uma notificação
- Continua a ser possível escrever o número à mão
- Um botão "Preparar leitura" devolve o foco ao campo depois de se ter clicado noutro sítio

O número passa a ser o **título do relatório** (o campo "Título" separado desaparece).

Tudo o resto — gravação, transcrição, otimização com IA, resumo técnico, vocabulário aprendido — fica igual.

## Exportação em Word

O botão "Exportar como texto (.txt)" passa a **"Exportar como Word (.docx)"**:

- Documento A4 com o n.º da análise como título
- Corpo com o texto do relatório (um parágrafo por linha)
- No fim, a secção "Resumo técnico" com fragmentos, blocos, seccionado, inclusão e código de faturação
- Nome do ficheiro: `<n.º da análise>.docx`

## Comportamento

- Ao guardar, o relatório fica com o título = n.º da análise. Sem número, usa-se a data como antes.
- Ao abrir um relatório guardado, o campo é preenchido com o respetivo número.
- A exportação usa o número da análise como nome do ficheiro.

## Detalhes técnicos

- Leitura de código: sem câmara e sem dependências — leitores USB/Bluetooth funcionam como emulação de teclado.
- Word: adicionar a biblioteca `docx` e gerar o ficheiro no browser (`Packer.toBlob`), sem backend; o botão "Copiar" mantém-se.
- Novo componente `src/components/campo-analise.tsx`: `Input` com `ref`, `autoFocus`, `onKeyDown` a intercetar `Enter` (com `preventDefault` para não submeter nada) e normalização do valor (`trim`, remover caracteres de controlo).
- Em `src/routes/_authenticated/app.tsx`:
  - remover estados e UI de `pacientes`, `pacienteId`, `novoPaciente`, `novoProcesso`, `criarPaciente` e a query a `pacientes`;
  - substituir o estado `titulo` por `numeroAnalise` (usado como `titulo` no insert; `paciente_id` fica sempre `null`);
  - `abrirRelatorio` preenche `numeroAnalise` a partir do título.
- Sem alterações à base de dados: a tabela `pacientes` e a coluna `paciente_id` mantêm-se intactas, apenas deixam de ser usadas nesta interface.
