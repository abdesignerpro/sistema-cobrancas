import { parseDate, formatDateBR } from '../utils/dateUtils';
import { formatDateTime } from '../utils/dateTimeUtils';

interface Client {
  id: number;
  name: string;
  phone: string;
  service: string;
  value: number;
  dueDate: string;
  status: string;
  pixKey?: string;
  pixQRCode?: string;
}

const CLIENTS_KEY = '@sistema-cobrancas/clients';

const updateClientStatus = (client: any): string => {
  if (!client.dueDate) return 'Pendente';
  
  const now = new Date();
  const dueDate = new Date(client.dueDate);
  
  // Ajusta as datas para comparar apenas o dia
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDateDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  
  if (client.status === 'Mensagem Enviada') return 'Mensagem Enviada';
  if (client.status === 'Pago') return 'Pago';
  
  // Compara as datas ignorando o horário
  if (dueDateDate < nowDate) return 'Atrasado';
  if (dueDateDate.getTime() === nowDate.getTime()) return 'Vence Hoje';
  return 'Pendente';
};

export const clientService = {
  getClients: (): Client[] => {
    try {
      const clientsStr = localStorage.getItem(CLIENTS_KEY);
      if (!clientsStr) return [];
      
      const clients = JSON.parse(clientsStr);
      
      // Atualiza o status de todos os clientes antes de retornar
      const updatedClients = clients.map((client: any) => ({
        ...client,
        status: updateClientStatus(client)
      }));
      
      // Salva os clientes com status atualizados
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(updatedClients));
      
      return updatedClients;
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      return [];
    }
  },

  saveClient: async (client: Omit<Client, 'id' | 'status'>): Promise<Client> => {
    try {
      const clients = clientService.getClients();
      
      const newClient: Client = {
        ...client,
        id: Date.now(),
        status: 'Pendente',
        dueDate: client.dueDate // Mantém a data ISO como está
      };

      clients.push(newClient);
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
      
      return newClient;
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      throw error;
    }
  },

  updateClient: async (client: Client): Promise<Client> => {
    try {
      const clients = clientService.getClients();
      const index = clients.findIndex(c => c.id === client.id);
      
      if (index === -1) {
        throw new Error('Cliente não encontrado');
      }
      
      // Mantém a data ISO como está
      clients[index] = {
        ...client,
        dueDate: client.dueDate
      };
      
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
      
      return clients[index];
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  },

  deleteClient: (clientId: number): void => {
    try {
      const clients = clientService.getClients();
      const updatedClients = clients.filter((c: Client) => c.id !== clientId);
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(updatedClients));
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
    }
  },

  updateClientStatuses: () => {
    try {
      const clients = clientService.getClients();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updatedClients = clients.map(client => {
        // Não atualiza se já tiver mensagem enviada
        if (client.status === 'Mensagem Enviada') {
          return client;
        }

        if (!client.dueDate) return client;

        const dueDate = new Date(client.dueDate);
        dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset());
        dueDate.setHours(0, 0, 0, 0);
        
        if (dueDate < today) {
          client.status = 'Atrasado';
        } else if (dueDate.toDateString() === today.toDateString()) {
          client.status = 'Pendente';
        } else {
          client.status = 'Em dia';
        }
        
        return client;
      });

      localStorage.setItem(CLIENTS_KEY, JSON.stringify(updatedClients));
      return updatedClients;
    } catch (error) {
      console.error('Erro ao atualizar status dos clientes:', error);
    }
  },

  checkClientStatuses: (): void => {
    try {
      const clients = clientService.getClients();
      const today = new Date();

      const updatedClients = clients.map(client => {
        // Não atualiza se já tiver mensagem enviada
        if (client.status === 'Mensagem Enviada') {
          return client;
        }

        if (!client.dueDate) return client;

        const dueDate = new Date(client.dueDate);
        
        if (dueDate < today) {
          client.status = 'Atrasado';
        } else if (dueDate.toDateString() === today.toDateString()) {
          client.status = 'Pendente';
        } else {
          client.status = 'Em dia';
        }
        
        return client;
      });

      localStorage.setItem(CLIENTS_KEY, JSON.stringify(updatedClients));
    } catch (error) {
      console.error('Erro ao verificar status dos clientes:', error);
    }
  }
};
