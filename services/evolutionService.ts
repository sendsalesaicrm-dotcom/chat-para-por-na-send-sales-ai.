
import { EvolutionApiMessage } from '../types';

// Credenciais da Evolution API
const BASE_URL = 'https://evolution-v230-evolution-api.2yhtoy.easypanel.host';
const INSTANCE = 'teste';
const API_KEY = '88B9C1B4A9AA-4B52-A810-BE42012E6413';

// O SEU NÚMERO (O número do WhatsApp conectado na Evolution)
// Isso ajuda a identificar quando uma mensagem no banco foi enviada por VOCÊ.
export const MY_NUMBER = '5511999999999'; // <-- Altere para o seu número real com DDI e DDD

export async function sendTextMessage(number: string, text: string) {
  const cleanedNumber = number.replace(/\D/g, '');
  
  try {
    const response = await fetch(`${BASE_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        number: cleanedNumber,
        text: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Evolution API send error:', error);
    throw error;
  }
}

export async function fetchHistory(number: string): Promise<EvolutionApiMessage[]> {
  const cleanedNumber = number.replace(/\D/g, '');
  
  try {
    const response = await fetch(`${BASE_URL}/chat/findMessages/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
      },
      body: JSON.stringify({
        "where": {
          "key": {
            "remoteJid": `${cleanedNumber}@s.whatsapp.net`
          }
        },
        "options": {
          "limit": 50,
          "sort": "DESC"
        }
      })
    });

    if (!response.ok) {
        console.warn('Falha ao buscar mensagens:', response.status);
        return [];
    }

    const data = await response.json();
    let messages: any[] = [];

    if (data && data.messages && Array.isArray(data.messages.records)) {
        messages = data.messages.records;
    } else if (data && Array.isArray(data.messages)) {
        messages = data.messages;
    } else if (Array.isArray(data)) {
        messages = data;
    } else {
        return [];
    }

    return messages.reverse(); 
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
}
