# Aprender com os relatórios anteriores

Objetivo: a transcrição e a otimização passam a usar os relatórios que o médico já guardou, para respeitar o seu vocabulário, abreviaturas e estilo de escrita.

## Como vai funcionar

1. **Vocabulário pessoal automático**
   Ao ditar, a app vai buscar os últimos relatórios guardados na conta do médico, extrai os termos mais frequentes e pouco comuns (nomes de lesões, siglas, localizações, nomes próprios) e envia-os como pistas ao motor de reconhecimento de voz, juntamente com o vocabulário base de dermatopatologia. Resultado: menos erros em palavras que o médico usa muito.

2. **Otimização com o estilo do próprio médico**
   O botão "Otimizar Relatório com IA" passa a receber 2 a 3 relatórios anteriores como exemplos de estilo (pontuação, forma de estruturar frases, abreviaturas). A IA continua proibida de inventar ou alterar conteúdo clínico — só ajusta forma e terminologia.

3. **Correções aprendidas**
   Sempre que o médico otimiza um texto e depois o edita manualmente antes de guardar, a app regista discretamente os pares "palavra transcrita → palavra corrigida" que se repetem. Esses pares passam a ser aplicados automaticamente nas transcrições seguintes e reforçam as pistas enviadas ao modelo.

4. **Controlo pelo médico**
   Um painel "Vocabulário aprendido" na página do consultório mostra os termos e correções aprendidas, permitindo apagar entradas erradas ou acrescentar termos à mão. Também haverá um interruptor para desligar a aprendizagem.

## Detalhes técnicos

- Nova tabela `termos_aprendidos` (medico_id, termo, correcao_de, ocorrencias, origem: automatico/manual, activo), com RLS por `auth.uid() = medico_id` e GRANTs para `authenticated`/`service_role`.
- Nova função servidor `learning.functions.ts`:
  - `getVocabularioPessoal` — junta termos aprendidos + termos extraídos dos últimos ~20 relatórios do médico e devolve uma string de pistas (limitada em tamanho para caber no campo `prompt` do STT).
  - `registarCorreccoes` — compara texto otimizado com o texto final guardado e grava os pares de correção recorrentes.
- `transcribeAudio` e `optimizeReport` passam a aceitar as pistas pessoais: o STT recebe `VOCABULARIO` + termos pessoais no campo `prompt`; a otimização recebe os exemplos de estilo e a lista de correções no prompt de sistema.
- Extração de termos feita no servidor com heurística simples (frequência, exclusão de palavras comuns em pt-PT), sem custo adicional de IA.
- UI: novo painel em `src/routes/_authenticated/app.tsx` para listar/editar/apagar termos e o interruptor de aprendizagem.
