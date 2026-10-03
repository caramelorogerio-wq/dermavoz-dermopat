# Página de custos mensais de IA

## Objetivo
Uma nova página na app que mostre quanto está a ser gasto em IA (ditado + otimização + separação de amostras): total do mês, custo médio por relatório e custo por minuto de áudio.

## Situação atual
A aplicação chama a IA em três sítios (transcrição de áudio, otimização do relatório e separação de amostras), mas não guarda nenhum registo de utilização. Sem esse registo não é possível mostrar custos históricos — por isso a primeira parte do trabalho é começar a registar cada utilização.

## O que vai ser feito

### 1. Registo de utilização
Nova tabela `uso_ia` na base de dados, com uma linha por chamada de IA:
- médico (dono do registo), data/hora
- tipo: `transcricao`, `otimizacao` ou `separacao`
- segundos de áudio (quando aplicável), tokens de entrada/saída (quando aplicável)
- custo estimado em euros
- número da análise associada, quando existir

Segurança: RLS por médico (cada um vê apenas o seu), com GRANTs adequados; a escrita é feita apenas no servidor.

Cada chamada de IA passa a gravar automaticamente uma linha nesta tabela, sem alterar o comportamento do ditado nem da otimização.

### 2. Cálculo do custo
Tabela de preços em código (por minuto de áudio e por milhão de tokens), aplicada no servidor no momento do registo. Os valores ficam num único ficheiro, fáceis de ajustar.

### 3. Nova página "Custos"
Acessível a partir da app (área autenticada), mostra:
- Cartões de topo: total do mês atual, nº de relatórios do mês, custo médio por relatório, custo por minuto de áudio
- Tabela por mês (últimos 12 meses): minutos de áudio, nº de relatórios, custo de transcrição, custo de texto, total
- Repartição por tipo de utilização no mês selecionado
- Nota de que os valores são estimativas baseadas nos preços do modelo

Design em linha com o resto da app (azul clínico/branco, pt-PT).

## Notas técnicas
- Tabela `uso_ia` criada por migração, com índice em (médico, data) e RLS `auth.uid()`.
- Registo feito dentro dos handlers em `src/lib/transcribe.functions.ts` e em `src/routes/api/transcrever.ts`, usando o cliente com privilégios apenas no servidor.
- Duração do áudio calculada no cliente (a partir do blob gravado/ficheiro) e enviada junto com o pedido; se não vier, é estimada pelo tamanho do áudio.
- Nova rota `src/routes/_authenticated/custos.tsx` com agregação por mês feita numa função de servidor.
- Histórico anterior a esta alteração não aparece (não foi registado); os totais começam a partir de agora.
