# Comandos por voz (mãos livres)

Objectivo: percorrer o fluxo completo sem rato — n.º da análise → gravar → resumo técnico → otimizar com IA → guardar → exportar.

## Como vai funcionar

Um interruptor "Modo mãos livres" no topo do ecrã. Quando activo, a app fica à escuta contínua (reconhecimento de voz do navegador, em pt-PT) e reage a comandos ditos depois da palavra de activação **"DermaVoz"**. Fora da gravação, os comandos são executados de imediato; durante o ditado, o texto continua a ser transcrito normalmente e só as frases iniciadas por "DermaVoz" são tratadas como comando (e não entram no relatório).

Cada comando reconhecido mostra confirmação visual (aviso no ecrã) e um sinal sonoro curto, para o médico saber que foi entendido sem olhar.

## Comandos previstos (pela ordem do fluxo)

| Dizer | Acção |
|---|---|
| "DermaVoz, análise C26H0000" / "número da análise ..." | preenche o n.º da análise (também aceita leitura soletrada) |
| "DermaVoz, iniciar gravação" / "gravar" | começa a gravar |
| "DermaVoz, parar" / "terminar gravação" | pára e envia para transcrição |
| "DermaVoz, nova amostra" / "amostra dois" | cria ou muda de amostra |
| "DermaVoz, apagar amostra" | remove a amostra activa (pede confirmação por voz: "confirmar") |
| "DermaVoz, resumo técnico: 3 fragmentos, 2 blocos, seccionado..." | preenche os campos do resumo técnico |
| "DermaVoz, otimizar" / "otimizar com IA" | corre a otimização |
| "DermaVoz, guardar" | guarda o relatório |
| "DermaVoz, exportar" / "exportar Word" | gera o ficheiro Word |
| "DermaVoz, copiar" | copia o texto |
| "DermaVoz, novo relatório" | limpa e recomeça |
| "DermaVoz, terminar sessão" | sai da conta |
| "DermaVoz, ajuda" / "que comandos" | abre a lista de comandos |

Acções destrutivas (apagar amostra, novo relatório, terminar sessão) exigem sempre um "confirmar" antes de executar.

## Nota sobre navegadores

O reconhecimento contínuo usa a API de voz do navegador — funciona no Edge e no Chrome (que já usa). No Safari/Firefox o interruptor fica indisponível com uma explicação; toda a app continua a funcionar com o rato como hoje.

## Detalhes técnicos

- Novo `src/lib/comandos-voz.ts`: normalização do texto (sem acentos/pontuação), tabela de padrões → acção, extracção de argumentos (n.º da análise, números do resumo técnico), e máquina de confirmação para acções destrutivas.
- Novo hook `src/hooks/use-reconhecimento-voz.ts`: encapsula `SpeechRecognition`/`webkitSpeechRecognition` com `continuous` + `interimResults`, reinício automático em `onend`, detecção de suporte e de permissão negada. Só é usado no cliente (dentro de `useEffect`).
- Novo `src/components/barra-comandos-voz.tsx`: interruptor, indicador de escuta, última frase reconhecida e diálogo de ajuda com a lista de comandos.
- Em `src/routes/_authenticated/app.tsx`: um `despacharComando(acção, args)` liga cada comando às funções já existentes (`guardar`, `exportar`, `copiar`, `otimizarTexto`, `adicionarAmostra`, `apagar`, `sair`, `setNumeroAnalise`, actualização do resumo técnico) e ao arranque/paragem da gravação.
- Em `src/components/recorder-panel.tsx`: expor `iniciar`/`parar` por `ref` (ou props controladas) para que o comando de voz possa accionar a gravação sem clique; comportamento actual do botão fica igual.
- Sem alterações à base de dados, à transcrição no servidor nem ao formato de exportação.
