# Plano: Apagar relatórios antigos, manter vocabulário aprendido

## Objetivo
Concluir a migração para o modo zero-retention (RGPD): eliminar os relatórios clínicos guardados na base de dados, mantendo intacto o vocabulário aprendido (termos médicos e correções) da conta.

## O que será feito

### 1. Apagar os relatórios guardados
- Eliminar **todas as linhas** da tabela `relatorios_transcritos` (atualmente 3 relatórios de teste do utilizador).
- Operação irreversível: os textos destes relatórios não poderão ser recuperados.
- Executado via ferramenta de dados (não é migração de schema).

### 2. Manter o vocabulário aprendido
- A tabela `termos_aprendidos` **não será tocada** — todos os termos e correções aprendidos continuam disponíveis para a transcrição/otimização.
- Tabelas `medicos`, `configuracoes_medico` e `pacientes` também ficam intactas.

### 3. Sem alterações de código nem de schema
- Nenhuma alteração a tabelas, colunas, RLS, grants, triggers ou pg_cron.
- Nenhuma alteração ao Worker nem às secrets.
- A aplicação já está em modo zero-retention (sem botão Guardar, sem histórico); esta etapa apenas limpa os dados antigos.

## Nota técnica
- A função `apagar_relatorios_expirados` e a tabela `relatorios_transcritos` ficam na base de dados mas sem uso — podem ser removidas numa etapa futura, se desejado.
