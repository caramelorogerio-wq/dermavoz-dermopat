# Plano: Retenção automática de relatórios

## Estado atual
- Existem **96 relatórios** guardados na tabela `relatorios_transcritos`.
- Não há limite artificial no código nem no Lovable Cloud — o teto real é o espaço/quotas do plano de base de dados.
- Não existe hoje nenhuma regra de expurgo automático.

## O que vamos construir
1. Adicionar à tabela `relatorios_transcritos` uma coluna `expira_em` (timestamp opcional) que indica quando um relatório pode ser apagado automaticamente.
2. Criar uma tabela `configuracoes_medico` para guardar, por médico, o prazo de retenção pretendido (em dias) e se o prazo conta desde a criação ou desde a última edição.
3. Criar uma função agendada (`pg_cron`) que corre todos os dias à 01:00 e apaga relatórios cuja `expira_em` já passou.
4. Atualizar a aplicação para:
   - calcular e gravar `expira_em` quando um relatório é criado ou editado;
   - mostrar nas definições do médico o prazo de retenção escolhido;
   - mostrar no relatório a data em que expira.

## Decisões pendentes (o utilizador escolhe)
- Prazo padrão: 30, 90, 365 dias ou configurável por médico.
- Base do prazo: data de criação ou última edição.

## Sugestão recomendada
- Prazo padrão de **90 dias**.
- Contar desde a **última edição** — relatórios em uso não desaparecem enquanto o médico os mantém atualizados.

## Notas de segurança
- Apenas o próprio médico pode ver/apagar os seus relatórios (RLS já existe).
- O expurgo corre com `service_role` numa tarefa agendada segura.
- Não alteramos a interface principal de ditado/exportação; adicionamos apenas um painel de definições e um indicador de expiração.
