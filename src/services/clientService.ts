import { Client } from '../types';
import { parseDate, formatDateBR } from '../utils/dateUtils';
import { formatDateTime } from '../utils/dateTimeUtils';

const CLIENTS_KEY = '@sistema-cobrancas/clients';

const updateClientStatus = (client: Client): string => {
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

const getClients = (): Client[] => {
  const clientsJson = localStorage.getItem(CLIENTS_KEY);
  return clientsJson ? JSON.parse(clientsJson) : [];
};

const saveClients = (clients: Client[]): void => {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
};

const addClient = (client: Omit<Client, 'id' | 'status'>): void => {
  const clients = getClients();
  const newClient: Client = {
    ...client,
    id: crypto.randomUUID(),
    status: 'Pendente',
    automaticMessage: true,
    dueTime: client.dueTime || '00:00'
  };
  clients.push(newClient);
  saveClients(clients);
};

const updateClient = (updatedClient: Client): void => {
  const clients = getClients();
  const index = clients.findIndex(client => client.id === updatedClient.id);
  if (index !== -1) {
    clients[index] = updatedClient;
    saveClients(clients);
  }
};

const deleteClient = (clientId: string): void => {
  const clients = getClients();
  const filteredClients = clients.filter(client => client.id !== clientId);
  saveClients(filteredClients);
};

const updateClientStatuses = () => {
  try {
    const clients = getClients();
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
};

const checkClientStatuses = (): void => {
  try {
    const clients = getClients();
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
};

export const clientService = {
  getClients,
  addClient,
  updateClient,
  deleteClient,
  updateClientStatuses,
  checkClientStatuses
};
