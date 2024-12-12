import { Client, MessageConfig } from '../types';

const MESSAGE_CONFIG_KEY = '@sistema-cobrancas/message-config';

export const DEFAULT_CHARGE_TEMPLATE = `Olá [nome], tudo bem?

Passando para lembrar sobre o pagamento do serviço: [servico]
Valor: [valor]
Vencimento: [vencimento]

Por favor, me avise quando realizar o pagamento para que eu possa dar baixa no sistema.

Agradeço a atenção!`;

export const defaultConfig: MessageConfig = {
  chargeTemplate: DEFAULT_CHARGE_TEMPLATE,
  messageTemplate: '',
  daysBeforeDue: 3,
  sendReminder: false,
  reminderDays: 1,
  reminderMessage: '',
  hour: 9,
  minute: 0
};

const processTemplate = (template: string, client: Client): string => {
  return template
    .replace('[nome]', client.name)
    .replace('[servico]', client.service)
    .replace('[valor]', client.value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }))
    .replace('[vencimento]', client.dueDate);
};

const createTestClient = (): Client => ({
  id: 'test-id',
  name: "Cliente Teste",
  service: "Serviço Teste",
  value: 150.00,
  dueDate: new Date().toISOString().split('T')[0],
  dueTime: '09:00',
  status: 'Pendente',
  automaticMessage: true,
  phone: '5511999999999'
});

export const messageService = {
  getConfig: (): MessageConfig => {
    const storedConfig = localStorage.getItem(MESSAGE_CONFIG_KEY);
    if (storedConfig) {
      return JSON.parse(storedConfig);
    }
    return defaultConfig;
  },

  saveConfig: (config: MessageConfig): void => {
    localStorage.setItem(MESSAGE_CONFIG_KEY, JSON.stringify(config));
  },

  processTemplate,

  testMessages: async (config: MessageConfig): Promise<{ mainMessage: string; reminderMessage?: string }> => {
    const testClient = createTestClient();
    const mainMessage = processTemplate(config.messageTemplate, testClient);
    let reminderMessage;

    if (config.sendReminder) {
      reminderMessage = processTemplate(config.reminderMessage, testClient);
    }

    return {
      mainMessage,
      reminderMessage
    };
  },

  testSendMessage: async (phone: string, config: MessageConfig): Promise<{ success: boolean; error?: string }> => {
    try {
      const testClient = createTestClient();
      const mainMessage = processTemplate(config.messageTemplate, testClient);
      await sendMessage(testClient.phone || '', mainMessage);

      if (config.sendReminder) {
        const reminderMessage = processTemplate(config.reminderMessage, testClient);
        await sendMessage(testClient.phone || '', reminderMessage);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar mensagem'
      };
    }
  },

  sendChargeMessage: async (client: Client): Promise<{ success: boolean; error?: string }> => {
    try {
      const config = messageService.getConfig();
      const message = processTemplate(config.chargeTemplate, client);
      await sendMessage(client.phone || '', message);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar mensagem'
      };
    }
  }
};

export const sendMessage = async (phone: string, message: string): Promise<void> => {
  if (!message) {
    throw new Error('Mensagem não definida');
  }

  if (!phone) {
    throw new Error('Telefone não definido');
  }

  // Aqui você implementaria a lógica real de envio da mensagem
  console.log(`Enviando mensagem para ${phone}: ${message}`);
};
