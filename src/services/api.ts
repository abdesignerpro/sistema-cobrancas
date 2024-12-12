import axios from 'axios';
import { messageService } from './messageService';
import { Client } from '../types';

const getEvolutionApi = () => {
  const apiUrl = localStorage.getItem('apiUrl') || 'https://evolution.abdesignerpro.com.br';
  const apiKey = localStorage.getItem('apiKey') || 'E62B2FC8FEB2-48A8-8AAC-38C637367B96';
  const instanceName = localStorage.getItem('instanceName') || 'anderson';

  return {
    api: axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      }
    }),
    instanceName
  };
};

const getPixConfig = () => {
  return {
    nome: localStorage.getItem('pixNome') || 'AndersonBarbosa',
    cidade: localStorage.getItem('pixCidade') || 'CampinaGrande',
    chave: localStorage.getItem('pixChave') || '70408834498',
    txid: localStorage.getItem('pixTxid') || 'abdesignerpro'
  };
};

export interface PaymentData {
  value: number;
  message?: string;
}

const formatPhoneNumber = (phone: string): string => {
  // Remove todos os caracteres não numéricos e todos os "55" do início
  let number = phone.replace(/\D/g, '').replace(/^(55)+/, '');
  
  // Adiciona 55 uma única vez
  return '55' + number;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const sendMessage = async (number: string, message: string) => {
  try {
    if (!number) {
      throw new Error('Número de telefone não fornecido');
    }

    const { api, instanceName } = getEvolutionApi();
    
    // Formata o número de telefone
    const formattedNumber = formatPhoneNumber(number);
    
    console.log('Enviando mensagem para:', formattedNumber);
    console.log('Mensagem:', message);
    
    const response = await api.post(`/message/sendText/${instanceName}`, {
      number: formattedNumber,
      text: message
    });
    
    console.log('Resposta da API:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
};

export const checkConnection = async () => {
  try {
    const { api, instanceName } = getEvolutionApi();
    const response = await api.get(`/instance/connectionState/${instanceName}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao verificar conexão:', error);
    throw error;
  }
};

export const generateQRCodePix = async (value: number): Promise<{ qrcode: string; qrCodeText: string }> => {
  try {
    const pixConfig = getPixConfig();
    const params = new URLSearchParams({
      nome: pixConfig.nome,
      cidade: pixConfig.cidade,
      valor: value.toFixed(2),
      chave: pixConfig.chave,
      txid: pixConfig.txid
    });

    // Gera o QR Code
    const qrCodeUrl = `https://gerarqrcodepix.com.br/api/v1?${params.toString()}&saida=qr`;
    
    // Obtém o BR Code usando o proxy
    const brCodeResponse = await axios.get(`/pix-api?${params.toString()}&saida=br`);
    const brCode = brCodeResponse.data.brcode || brCodeResponse.data;

    return {
      qrcode: qrCodeUrl,
      qrCodeText: brCode
    };
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    throw error;
  }
};

// Função auxiliar para enviar QR code PIX
export const sendPixQRCode = async (phone: string, value: number) => {
  try {
    const { api, instanceName } = getEvolutionApi();
    const formattedNumber = formatPhoneNumber(phone);

    // Gera o QR Code PIX
    const { qrcode, qrCodeText } = await generateQRCodePix(value);

    // Envia o QR Code como imagem com o código PIX na legenda
    await api.post(`/message/sendMedia/${instanceName}`, {
      number: formattedNumber,
      mediatype: "image",
      media: qrcode,
      caption: qrCodeText,
      isUrl: true
    });

  } catch (error) {
    console.error('Erro ao enviar QR Code PIX:', error);
    throw error;
  }
};

export const sendPaymentRequest = async (client: Client): Promise<void> => {
  try {
    const message = `Olá ${client.name}, tudo bem?

Passando para lembrar sobre o pagamento do serviço: ${client.service}
Valor: ${client.value.toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL'
})}
Vencimento: ${client.dueDate}

Por favor, me avise quando realizar o pagamento para que eu possa dar baixa no sistema.

Agradeço a atenção!`;

    console.log(`Enviando mensagem para ${client.phone}:`, message);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    throw error;
  }
};

export const sendReminderMessage = async (
  phone: string,
  value: number,
  serviceName: string,
  clientName: string,
  dueDate: string
) => {
  try {
    const formattedNumber = formatPhoneNumber(phone);
    const config = messageService.getConfig();
    const message = config.messageTemplate
      .replace("{nome}", clientName)
      .replace("{servico}", serviceName)
      .replace("{valor}", formatCurrency(value))
      .replace("{dias}", "3"); // Fixo em 3 dias para teste

    // Envia a mensagem com QR code
    await sendMessage(formattedNumber, message);
    await sendPixQRCode(formattedNumber, value);
    
    console.log('✅ Mensagem de lembrete com QR code enviada com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem de lembrete:', error);
    throw error;
  }
};
