# Recuperação quando um comando de voz não é entendido

## Situação actual (confirmada no código)

Em `src/routes/_authenticated/app.tsx` (linhas 1071-1076), se o texto depois de "App" não corresponder a nenhum comando, aparece apenas um aviso vermelho: `Comando não reconhecido: "..."`. Não há sugestão, nem forma de corrigir sem repetir tudo. No modo guiado do resumo (linhas 1025-1032) há já uma repetição da pergunta, mas sem sugestões.

## O que vai ser feito

1. **Sugestão do comando mais parecido** — quando o que foi ouvido se aproxima de um comando conhecido (ex.: "iniciar gravasão", "otimiza relatório"), a app propõe: *"Não percebi. Quis dizer «iniciar gravação»? Diga «App, sim» ou «App, não»."* Um "sim" executa o comando; "não" ou 8 segundos de silêncio descarta.
2. **Execução directa quando a semelhança é muito alta** — pequenos erros de fonética (uma ou duas letras) executam logo o comando, com aviso discreto do que foi entendido, para não obrigar a confirmar sempre.
3. **Painel de recuperação na barra de comandos** — em vez de só um toast, a barra mostra a frase ouvida e até três botões com os comandos mais prováveis, clicáveis com o rato caso a voz falhe. Fica visível até ser usado ou até ao comando seguinte.
4. **"App, repetir" e "App, ajuda"** — "repetir" volta a mostrar a última frase não entendida com as sugestões; "ajuda" (já existente) passa também a abrir a lista quando houve duas falhas seguidas.
5. **Modo guiado mais tolerante** — respostas não entendidas passam a sugerir também as opções válidas do campo em botões, além de repetir a pergunta.
6. **Tempo de espera prolongado** — a sessão de escuta de comandos passa a ter um timeout maior de inactividade (de ~5 s para ~10-12 s) antes de considerar que o utilizador terminou de falar, e a janela de confirmação de sugestões fica activa durante 12 segundos em vez de 8. O reconhecimento reinicia mais depressa quando o navegador corta a sessão (300 ms → 100 ms) para não perder o início da frase seguinte.
7. **Nada muda durante o ditado** — com gravação em curso, o ruído continua a ser ignorado sem avisos.

## Notas técnicas

- `src/lib/comandos-voz.ts`: nova função de semelhança (distância de Levenshtein normalizada) sobre as formas canónicas dos comandos; `sugerirComandos(texto): { frase, comando, score }[]` devolvendo o top 3; limiares: ≥0.9 executa directamente, ≥0.6 sugere, abaixo disso só lista genérica.
- `src/hooks/use-reconhecimento-voz.ts`: ajuste do timeout de inactividade da API nativa e do intervalo de reinício após `onend` (100 ms), para manter o microfone disponível mais tempo.
- `src/components/barra-comandos-voz.tsx`: apresentação da frase ouvida e dos botões de sugestão (apenas UI).

Sem alterações à base de dados, à transcrição, à IA, à exportação Word ou ao HL7.
