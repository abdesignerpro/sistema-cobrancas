import { sendMessage } from './api';
import { clientService } from './clientService';
import { sendPaymentRequest, sendReminderMessage } from './api';

export interface MessageConfig {
  daysBeforeDue: number;
  messageTemplate: string;
  sendReminder: boolean;
  reminderDays: number;
  reminderMessage: string;
  chargeTemplate: string; // Template da mensagem de cobrança
}

const MESSAGE_CONFIG_KEY = '@sistema-cobrancas/message-config';

const DEFAULT_CHARGE_TEMPLATE = `🔔 *Lembrete de Pagamento*\n\n` +
  `Olá {nome}! Segue sua fatura para o serviço:\n\n` +
  `📋 *Detalhes do Serviço*\n` +
  `▫️ Serviço: *{servico}*\n` +
  `▫️ Valor: *{valor}*\n` +
  `▫️ Vencimento: *{dias}*\n\n` +
  `📱 *Como pagar com PIX*\n` +
  `1. Abra seu app do banco\n` +
  `2. Escolha pagar com PIX\n` +
  `3. Escaneie o QR Code ou copie o código abaixo\n\n` +
  `⚠️ *Importante*\n` +
  `• O QR Code e código PIX serão enviados em seguida\n` +
  `• Guarde o comprovante\n` +
  `• Em caso de dúvidas, entre em contato\n\n` +
  `🙏 Agradecemos a preferência!`;

export const messageService = {
  saveConfig: (config: MessageConfig): void => {
    // Se não houver template de mensagem, usa o padrão
    if (!config.messageTemplate) {
      config.messageTemplate = `Olá {nome}!\n\n` +
        `Seu serviço *{servico}* vence em {dias} dias.\n` +
        `Valor: *{valor}*\n\n` +
        `Para sua comodidade, estou enviando o QR Code do PIX em seguida.\n` +
        `Você pode pagar agora mesmo para evitar atrasos!\n\n` +
        `Qualquer dúvida estamos à disposição.`;
    }

    // Se não houver template de lembrete, usa o padrão
    if (!config.reminderMessage) {
      config.reminderMessage = `⚠️ *Lembrete Importante*\n\n` +
        `Olá {nome}!\n\n` +
        `Seu serviço *{servico}* vence hoje!\n` +
        `Valor: *{valor}*\n\n` +
        `Para sua comodidade, estou enviando o QR Code do PIX em seguida.\n` +
        `Efetue o pagamento hoje para evitar juros e multas.\n\n` +
        `Qualquer dúvida estamos à disposição.`;
    }

    // Adiciona o template de cobrança se não existir
    if (!config.chargeTemplate) {
      config.chargeTemplate = DEFAULT_CHARGE_TEMPLATE;
    }

    localStorage.setItem(MESSAGE_CONFIG_KEY, JSON.stringify(config));
  },

  getConfig: (): MessageConfig => {
    const savedConfig = localStorage.getItem(MESSAGE_CONFIG_KEY);
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      // Adiciona o template de cobrança se não existir
      if (!config.chargeTemplate) {
        config.chargeTemplate = DEFAULT_CHARGE_TEMPLATE;
      }
      return config;
    }

    return {
      daysBeforeDue: 3,
      messageTemplate: `Olá {nome}!\n\n` +
        `Seu serviço *{servico}* vence em {dias} dias.\n` +
        `Valor: *{valor}*\n\n` +
        `Para sua comodidade, estou enviando o QR Code do PIX em seguida.\n` +
        `Você pode pagar agora mesmo para evitar atrasos!\n\n` +
        `Qualquer dúvida estamos à disposição.`,
      sendReminder: true, // Ativa os lembretes por padrão
      reminderDays: 0,
      reminderMessage: `⚠️ *Lembrete Importante*\n\n` +
        `Olá {nome}!\n\n` +
        `Seu serviço *{servico}* vence hoje!\n` +
        `Valor: *{valor}*\n\n` +
        `Para sua comodidade, estou enviando o QR Code do PIX em seguida.\n` +
        `Efetue o pagamento hoje para evitar juros e multas.\n\n` +
        `Qualquer dúvida estamos à disposição.`,
      chargeTemplate: DEFAULT_CHARGE_TEMPLATE
    };
  },

  processTemplate: (template: string, data: { nome: string; servico: string; dias: string | number; valor: number }): string => {
    const valorFormatado = data.valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return template
      .replace(/{nome}/g, data.nome || '')
      .replace(/{servico}/g, data.servico || '')
      .replace(/{dias}/g, String(data.dias || ''))
      .replace(/{valor}/g, valorFormatado.replace('R$', '').trim());
  },

  testMessages: async (config: MessageConfig): Promise<{ mainMessage: string; reminderMessage?: string }> => {
    const testData = {
      nome: "Cliente Teste",
      servico: "Serviço Teste",
      dias: config.daysBeforeDue,
      valor: 150.00
    };

    const mainMessage = messageService.processTemplate(config.messageTemplate, testData);
    let reminderMessage;

    if (config.sendReminder) {
      const reminderData = { ...testData, dias: config.reminderDays };
      reminderMessage = messageService.processTemplate(config.reminderMessage, reminderData);
    }

    return {
      mainMessage,
      reminderMessage
    };
  },

  testSendMessage: async (phone: string, config: MessageConfig): Promise<{ success: boolean; error?: string }> => {
    try {
      const testData = {
        nome: "Cliente Teste",
        servico: "Serviço Teste",
        dias: config.daysBeforeDue,
        valor: 150.00
      };

      // Envia a mensagem principal
      const mainMessage = messageService.processTemplate(config.messageTemplate, testData);
      await sendMessage(phone, mainMessage);

      // Se tiver lembrete configurado, envia também
      if (config.sendReminder) {
        const reminderData = { ...testData, dias: config.reminderDays };
        const reminderMessage = messageService.processTemplate(config.reminderMessage, reminderData);
        await sendMessage(phone, reminderMessage);
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao enviar mensagem'
      };
    }
  },

  testReminders: async (client: any) => {
    try {
      console.log('🧪 Iniciando teste de mensagens...');
      
      // Envia apenas o lembrete com QR code
      console.log('\n1. Testando mensagem de lembrete com QR code...');
      await sendReminderMessage(
        client.phone,
        client.value,
        client.service,
        client.name,
        client.dueDate
      );
      
      console.log('\n✅ Teste concluído com sucesso!');
    } catch (error) {
      console.error('❌ Erro durante o teste:', error);
    }
  },

  sendAutomaticMessage: async (phone: string, nome: string, servico: string, valor: number, dueDate: Date): Promise<void> => {
    try {
      const config = messageService.getConfig();

      // Formata a data de vencimento
      const dueDateFormatted = dueDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Processa o template com os dados
      const message = messageService.processTemplate(config.chargeTemplate, {
        nome,
        servico,
        dias: dueDateFormatted,
        valor
      });

      // Envia a mensagem com o QR Code e código PIX
      await sendPaymentRequest(phone, valor, servico, nome);

    } catch (error) {
      console.error('Erro ao enviar mensagem automática:', error);
      throw error;
    }
  },

  checkAndSendPaymentRequests: async () => {
    try {
      const clients = clientService.getClients();
      const now = new Date();

      for (const client of clients) {
        // Ignora apenas clientes pagos ou sem data de vencimento
        if (!client.dueDate || client.status === 'Pago') continue;

        const dueDate = new Date(client.dueDate);
        
        // Converte as datas para timestamps para comparação precisa
        const nowTimestamp = now.getTime();
        const dueDateTimestamp = dueDate.getTime();

        // Adiciona uma margem de 1 minuto após o horário de vencimento
        const marginInMs = 60 * 1000; // 1 minuto em milissegundos
        
        console.log(`Verificando cliente ${client.name}:`);
        console.log(`- Hora atual: ${now.toLocaleString()}`);
        console.log(`- Hora vencimento: ${dueDate.toLocaleString()}`);
        
        // Verifica se está dentro da janela de 1 minuto após o vencimento
        if (nowTimestamp >= dueDateTimestamp && 
            nowTimestamp <= dueDateTimestamp + marginInMs) {
          try {
            // Não envia nova mensagem se já foi enviada
            if (client.status === 'Mensagem Enviada') {
              console.log(`- Mensagem já enviada para ${client.name}`);
              continue;
            }

            console.log(`- Enviando mensagem de cobrança...`);
            
            // Atualiza o status do cliente para "Mensagem Enviada" antes de enviar
            await clientService.updateClient({
              ...client,
              status: 'Mensagem Enviada'
            });

            // Envia a mensagem de cobrança
            await sendPaymentRequest(
              client.phone,
              client.value,
              client.service,
              client.name
            );

            console.log(`✓ Mensagem enviada com sucesso para ${client.name}`);
          } catch (error) {
            // Se houver erro, volta o status para o status anterior
            await clientService.updateClient({
              ...client,
              status: client.status
            });
            console.error(`✗ Erro ao enviar mensagem para ${client.name}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar cobranças:', error);
    }
  },

  startAutomaticCheck: () => {
    // Verifica imediatamente ao iniciar
    messageService.checkAndSendPaymentRequests();
    
    // Configura verificação a cada 1 minuto
    setInterval(() => {
      messageService.checkAndSendPaymentRequests();
    }, 60 * 1000); // 1 minuto em milissegundos
  }
};
