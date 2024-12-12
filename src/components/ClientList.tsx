import { useState, useEffect } from 'react';
import { Client } from '../types';
import { clientService } from '../services/clientService';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  AlertColor,
  Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ClientEdit from './ClientEdit';
import { formatDateBR } from '../utils/dateUtils';

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    const loadedClients = clientService.getClients();
    setClients(loadedClients);
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setEditDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setSelectedClient(null);
  };

  const handleSaveEdit = (updatedClient: Client) => {
    clientService.updateClient(updatedClient);
    loadClients();
    handleCloseEdit();
    setNotification({
      open: true,
      message: 'Cliente atualizado com sucesso!',
      severity: 'success'
    });
  };

  const handleDeleteClick = async (client: Client) => {
    setSelectedClient(client);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedClient(null);
  };

  const handleConfirmDelete = async () => {
    if (selectedClient) {
      try {
        await clientService.deleteClient(selectedClient.id);
        setClients(clients.filter(c => c.id !== selectedClient.id));
        setDeleteDialogOpen(false);
        setSelectedClient(null);
        setNotification({
          open: true,
          message: 'Cliente excluído com sucesso!',
          severity: 'success'
        });
      } catch (error) {
        setNotification({
          open: true,
          message: 'Erro ao excluir cliente',
          severity: 'error'
        });
      }
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <TextField
        fullWidth
        label="Buscar clientes"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        margin="normal"
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
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.service}</TableCell>
                <TableCell>
                  {client.value.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  })}
                </TableCell>
                <TableCell>{formatDateBR(client.dueDate)}</TableCell>
                <TableCell>{client.status}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEditClick(client)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteClick(client)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedClient && (
        <ClientEdit
          open={editDialogOpen}
          client={selectedClient}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      )}

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          Tem certeza que deseja excluir o cliente {selectedClient?.name}?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error">
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
