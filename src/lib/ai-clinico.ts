export const mimeFor: Record<string, string> = {
  wav: "audio/wav",
  mp3: "audio/mpeg",
  webm: "audio/webm",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  aac: "audio/aac",
  flac: "audio/flac",
};

// Vocabulário enviado ao modelo de reconhecimento de voz para melhorar a
// grafia de terminologia dermatopatológica frequente em ditado clínico.
export const VOCABULARIO =
  "Ditado clínico em português europeu de dermatopatologia. Comandos de ditado frequentes: ponto final, vírgula, novo parágrafo, abrir aspas, fechar aspas, abre aspas, fecha aspas, abrir parêntesis, fechar parêntesis. Terminologia frequente: exame macroscópico, biópsia punch, biópsia incisional, biópsia excisional, peça de excisão, fuso cutâneo, margens cirúrgicas, margem lateral, margem profunda, epiderme, derme papilar, derme reticular, hipoderme, tecido celular subcutâneo, acantose, hiperqueratose, paraqueratose, espongiose, acantólise, disqueratose, papilomatose, atipia citológica, mitoses, infiltrado inflamatório linfocitário, perivascular, liquenoide, granulomatoso, queratose seborreica, queratose actínica, carcinoma basocelular, carcinoma espinocelular, doença de Bowen, melanoma maligno, nevo melanocítico, nevo displásico, índice de Breslow, nível de Clark, ulceração, regressão, invasão perineural, invasão linfovascular, dermatofibroma, quisto epidérmico, molusco contagioso, verruga vulgar, psoríase, líquen plano, dermatite espongiótica, pênfigo, penfigoide bolhoso, lúpus eritematoso, imuno-histoquímica, HE, PAS, S100, Melan-A, HMB-45, Ki-67, formol tamponado, inclusão em parafina, milímetros, mm, centímetros, cm.";

export const PROMPT_OTIMIZACAO =
  "És um revisor de relatórios de dermatopatologia em Portugal. Recebes uma transcrição bruta de ditado e devolves o mesmo conteúdo corrigido: pontuação e maiúsculas correctas, parágrafos legíveis, correcção de erros de reconhecimento de voz, e terminologia dermatopatológica escrita segundo o português europeu padrão (pt-PT, sem grafia brasileira). Expande ditados de pontuação (por exemplo 'ponto final', 'vírgula', 'novo parágrafo') na pontuação respectiva. Converte os comandos de aspas ditados em aspas reais: 'abrir aspas'/'abre aspas'/'aspas' antes do texto e 'fechar aspas'/'fecha aspas' depois passam a \" \" em torno do texto ditado entre eles, removendo sempre as palavras do comando; se faltar o comando de fecho, fecha as aspas no fim da frase. Quando um título for delimitado por estes comandos de aspas (abrir aspas … fechar aspas), a aspa de fecho não deve ser seguida de ponto final: em vez disso coloca logo a seguir um traço (\" -\") que separa o título do corpo do texto. Faz o mesmo com 'abrir/fechar parêntesis'. Abrevia unidades conforme a prática clínica: 'milímetros' → 'mm', 'centímetros' → 'cm'. Quando \"por\" for usado como separador de dimensões, como em \"10 por 5 mm\", escrever \"10 x 5 mm\". Não substituir \"por\" quando tiver outro significado na frase. Não inventes, não acrescentes, não removas informação clínica, não resumas e não uses markdown. Devolve apenas o texto revisto.";

export const PROMPT_SEPARACAO =
  'És um assistente de dermatopatologia em Portugal. Recebes a transcrição de um ditado que pode conter várias amostras da mesma análise. Divide o texto por amostra, respeitando os títulos que o médico ditou em voz alta (por exemplo "amostra: lesão do dorso", "amostra A, nevo do braço"). É frequente o médico delimitar o título com comandos de voz: "amostra abrir aspas lesão do dorso fechar aspas" — nesse caso o título é exactamente o texto entre os comandos ("lesão do dorso"), e as palavras "abrir aspas", "abre aspas", "fechar aspas", "fecha aspas" nunca aparecem no titulo nem no texto. Devolve exclusivamente JSON válido, sem markdown e sem comentários, no formato {"amostras":[{"titulo":"...","texto":"..."}]}. O campo titulo é o título livre ditado pelo médico (sem a palavra "amostra" repetida, mas mantendo a letra ou número quando ditado); se não houver título, usa "Amostra 1", "Amostra 2", etc. O campo texto contém o conteúdo macroscópico dessa amostra, sem o título. Não inventes, não acrescentes, não removas nem resumas informação clínica: todo o texto original deve ficar distribuído pelas amostras. Se não existir qualquer separação, devolve uma única amostra com todo o texto.';


export async function gatewayError(response: Response) {

  const body = await response.text();
  let message = body;
  try {
    message = JSON.parse(body)?.error?.message ?? body;
  } catch {
    /* texto simples */
  }
  if (response.status === 429) {
    return "Demasiados pedidos em curto espaço de tempo. Tente novamente dentro de momentos.";
  }
  if (response.status === 402) {
    return message || "Créditos de IA esgotados. Adicione créditos para continuar.";
  }
  return message || "Falha no pedido de IA.";
}
