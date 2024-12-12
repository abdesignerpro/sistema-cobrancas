import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { clientService } from '../services/clientService';
import { messageService } from '../services/messageService';
import { sendReminderMessage } from '../services/api';
import { serviceOptionsService, type ServiceOption } from '../services/serviceOptionsService';

// Função para obter a data atual no formato YYYY-MM-DD
const getCurrentDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para obter a hora atual no formato HH:mm
const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function ClientRegistration() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    value: '',
    dueDate: getCurrentDate(),
    dueTime: getCurrentTime(),
    automaticMessage: true
  });

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [newService, setNewService] = useState('');
  const [showNewService, setShowNewService] = useState(false);

  useEffect(() => {
    setServices(serviceOptionsService.getServices());
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
    
    if (value.length <= 11) {
      // Aplica a máscara (83) 99999-9999
      if (value.length > 2) value = value.replace(/^(\d{2})(\d)/, '($1) $2');
      if (value.length > 7) value = value.replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    setFormData(prev => ({ ...prev, phone: value }));
  };

  const formatPhoneForSubmit = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return '55' + numbers;
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      // Formata o telefone antes de salvar
      const formattedPhone = formatPhoneForSubmit(formData.phone);

      // Converte a data para o formato ISO
      const [year, month, day] = formData.dueDate.split('-');
      const [hours, minutes] = formData.dueTime.split(':');
      
      const dueDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );

      // Salva o cliente
      await clientService.saveClient({
        name: formData.name,
        phone: formattedPhone,
        service: formData.service,
        value: parseFloat(formData.value),
        dueDate: dueDate.toISOString(),
        automaticMessage: formData.automaticMessage
      });

      setShowSuccess(true);
      
      // Limpa o formulário
      setFormData({
        name: '',
        phone: '',
        service: '',
        value: '',
        dueDate: getCurrentDate(),
        dueTime: getCurrentTime(),
        automaticMessage: true
      });

      // Redireciona para a lista de clientes após 2 segundos
      setTimeout(() => {
        navigate('/clients');
      }, 2000);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Cadastro de Cliente
      </Typography>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome do Cliente"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="WhatsApp"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(83) 99999-9999"
                  helperText="Digite o número com DDD e país"
                  required
                  maxLength={15}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Valor"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data de Vencimento"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hora de Vencimento"
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
              >
                Cadastrar Cliente
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                onClick={() => navigate('/clients')}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success"
          variant="filled"
        >
          Cliente cadastrado com sucesso!
        </Alert>
      </Snackbar>
    </Box>
  );
}
