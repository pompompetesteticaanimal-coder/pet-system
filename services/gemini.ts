import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMessage = async (
  type: 'reminder' | 'promotion' | 'completion',
  data: { clientName: string; petName?: string; serviceName?: string; price?: number; date?: string }
): Promise<string> => {
  try {
    const systemPrompt = `Você é um assistente virtual útil e educado de um Pet Shop chamado "PetGestor". 
    Sua tarefa é gerar mensagens curtas e profissionais para WhatsApp. 
    Use emojis apropriados (patinhas, banho, brilho). 
    Responda APENAS com o texto da mensagem.`;

    let userPrompt = "";

    if (type === 'reminder') {
      userPrompt = `Crie um lembrete amigável para ${data.clientName} sobre o agendamento do pet ${data.petName || 'seu pet'} para ${data.serviceName} no dia ${new Date(data.date!).toLocaleString('pt-BR')}.`;
    } else if (type === 'completion') {
      userPrompt = `Crie uma mensagem avisando ${data.clientName} que o pet ${data.petName} está pronto. O serviço foi ${data.serviceName} e o total é R$ ${data.price?.toFixed(2)}. Pergunte que horas podem vir buscar.`;
    } else if (type === 'promotion') {
      userPrompt = `Crie uma mensagem promocional curta sobre o serviço ${data.serviceName} oferecendo um cuidado especial.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      }
    });

    return response.text || "Não foi possível gerar a mensagem.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao conectar com o assistente inteligente.";
  }
};

export const analyzeDay = async (appointments: any[], revenue: number): Promise<string> => {
    try {
        const prompt = `
        Analise o seguinte resumo do dia de um Pet Shop:
        - Total de agendamentos: ${appointments.length}
        - Faturamento estimado: R$ ${revenue.toFixed(2)}
        - Detalhes: ${JSON.stringify(appointments.map(a => ({ status: a.status, service: a.serviceName })))}

        Forneça um breve resumo executivo (max 3 linhas) motivador para a equipe e uma dica de negócio baseada nesses dados.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Análise indisponível.";
    } catch (e) {
        return "Não foi possível analisar os dados no momento.";
    }
}
