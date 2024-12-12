import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { formatForInput } from '../utils/dateUtils';
import { serviceOptionsService, type ServiceOption } from '../services/serviceOptionsService';
import { parseDateTime, getTimeFromDate, getDateFromDateTime } from '../utils/dateTimeUtils';

interface EditClientDialogProps {
  open: boolean;
  client: {
    id: number;
    name: string;
    phone: string;
    service: string;
    value: number;
    dueDate: string;
    status: string;
  };
  onSave: (client: any) => void;
  onClose: () => void;
}

export default function EditClientDialog({ open, client, onSave, onClose }: EditClientDialogProps) {
  const [formData, setFormData] = useState({
    id: client?.id || 0,
    name: client?.name || '',
    phone: client?.phone || '',
    service: client?.service || '',
    value: client?.value || '',
    dueDate: '',
    dueTime: '12:00',
    status: client?.status || 'Pendente'
  });

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [newService, setNewService] = useState('');
  const [showNewService, setShowNewService] = useState(false);

  useEffect(() => {
    setServices(serviceOptionsService.getServices());
  }, []);

  useEffect(() => {
    if (client) {
      const dueDate = new Date(client.dueDate);
      
      setFormData({
        ...client,
        dueDate: dueDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
        dueTime: `${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}` // Formato HH:mm
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'value' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
    
    if (value.length <= 11) {
      // Aplica a máscara (83) 99999-9999
      if (value.length > 2) value = value.replace(/^(\d{2})(\d)/, '($1) $2');
      if (value.length > 7) value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setShowNewService(true);
    } else {
      setFormData(prev => ({ ...prev, service: value }));
    }
  };

  const handleNewServiceSubmit = () => {
    if (newService.trim()) {
      const updatedServices = serviceOptionsService.addService(newService.trim());
      setServices(updatedServices);
      setFormData(prev => ({ ...prev, service: newService.trim() }));
      setNewService('');
      setShowNewService(false);
    }
  };

  const formatPhoneForSubmit = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return '55' + numbers;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      const formattedPhone = formatPhoneForSubmit(formData.phone);
      
      // Gera a data ISO com o timezone do Brasil
      const dueDate = parseDateTime(
        formData.dueDate.split('T')[0].split('-').reverse().join('/'), // Converte YYYY-MM-DD para DD/MM/YYYY
        formData.dueTime
      );

      await onSave({
        ...formData,
        phone: formattedPhone,
        dueDate: dueDate
      });

      onClose();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Editar Cliente</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="name"
              label="Nome"
              fullWidth
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              name="phone"
              label="WhatsApp"
              fullWidth
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="(83) 99999-9999"
              required
              maxLength={15}
            />
            <FormControl fullWidth required>
              <InputLabel>Serviço</InputLabel>
              <Select
                value={formData.service}
                onChange={handleServiceChange}
                label="Serviço"
              >
                {services.map((service) => (
                  <MenuItem key={service.id} value={service.name}>
                    {service.name}
                  </MenuItem>
                ))}
                <MenuItem value="new">+ Novo Serviço</MenuItem>
              </Select>
            </FormControl>
            {showNewService && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder="Nome do novo serviço"
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleNewServiceSubmit}
                  disabled={!newService.trim()}
                  size="small"
                >
                  Adicionar
                </Button>
              </Box>
            )}
            <TextField
              name="value"
              label="Valor"
              type="number"
              fullWidth
              value={formData.value}
              onChange={handleChange}
              required
              inputProps={{ step: "0.01" }}
            />
            <TextField
              name="dueDate"
              label="Data de Vencimento"
              type="date"
              fullWidth
              value={formData.dueDate}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              name="dueTime"
              label="Hora de Vencimento"
              type="time"
              fullWidth
              value={formData.dueTime}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
