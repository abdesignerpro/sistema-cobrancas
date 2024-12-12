import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Box,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ScienceIcon from '@mui/icons-material/Science';
import { clientService } from '../services/clientService';
import { sendPaymentRequest } from '../services/api';
import EditClientDialog from './EditClientDialog';
import { formatDateBR, parseDate } from '../utils/dateUtils';
import { messageService } from '../services/messageService';

const formatDateTimeForDisplay = (dateTimeString: string) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    const updatedClients = clientService.updateClientStatuses();
    setClients(updatedClients || []);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (clientToDelete) {
      clientService.deleteClient(clientToDelete.id);
      loadClients();
      showNotification('Cliente excluído com sucesso', 'success');
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const filteredClients = clients.filter((client: any) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'em dia':
        return 'success';
      case 'pendente':
        return 'warning';
      case 'atrasado':
        return 'error';
      case 'mensagem enviada':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleSendMessage = async (client: any) => {
    try {
      if (!client.phone) {
        throw new Error('Cliente não tem número de telefone cadastrado');
      }

      let phone = client.phone.replace(/\D/g, '');
      if (!phone.startsWith('55')) {
        phone = '55' + phone;
      }

      await sendPaymentRequest(phone, client.value, client.service, client.name);
      
      clientService.updateClient({
        ...client,
        status: 'Mensagem Enviada'
      });
      
      loadClients();
      showNotification('Cobrança enviada com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao enviar cobrança:', error);
      showNotification(
        error instanceof Error ? error.message : 'Erro ao enviar cobrança',
        'error'
      );
    }
  };

  const handleEditClick = (client) => {
    setSelectedClient(client);
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedClient(null);
  };

  const handleEditSave = (updatedClient) => {
    clientService.updateClient(updatedClient);
    setClients(clientService.getClients());
    handleEditClose();
  };

  const handleTestReminders = async (client: any) => {
    try {
      await messageService.testReminders(client);
    } catch (error) {
      console.error('Erro ao testar lembretes:', error);
    }
  };

  return (
    <Box sx={{ width: '100%', padding: 2 }}>
      <TextField
        fullWidth
        label="Buscar clientes"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ marginBottom: 2 }}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Serviço</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.map((client: any) => (
              <TableRow key={client.id}>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.service}</TableCell>
                <TableCell>R$ {client.value.toFixed(2)}</TableCell>
                <TableCell>
                  {client.dueDate ? formatDate(client.dueDate) : 'Não definido'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={client.status}
                    color={getStatusColor(client.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleEditClick(client)}
                    sx={{ color: "primary.main" }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDeleteClick(client)}
                    sx={{ color: "error.main" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleSendMessage(client)}
                    sx={{ color: "#25D366" }}
                  >
                    <WhatsAppIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleTestReminders(client)}
                    sx={{ color: '#7a288a' }}
                    title="Testar envio de lembretes"
                  >
                    <ScienceIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedClient && (
        <EditClientDialog
          open={editDialogOpen}
          client={selectedClient}
          onClose={handleEditClose}
          onSave={handleEditSave}
        />
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir o cliente {clientToDelete?.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
