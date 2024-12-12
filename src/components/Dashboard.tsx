import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, Paper } from '@mui/material';
import { clientService } from '../services/clientService';
import PeopleIcon from '@mui/icons-material/People';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import WarningIcon from '@mui/icons-material/Warning';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { Link } from 'react-router-dom';
import { formatDateBR, parseDate, addDays, isSameDay } from '../utils/dateUtils';
import { formatDateTimeForDisplay } from '../utils/dateTimeUtils';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalClients: 0,
    messagesSent: 0,
    pendingPayments: 0,
    upcomingDueDates: [],
    totalReceivable: 0
  });

  useEffect(() => {
    const calculateStats = () => {
      const clients = clientService.getClients();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Total de clientes
      const totalClients = clients.length;

      // Total de mensagens enviadas
      const messagesSent = clients.filter(client => 
        client.status === 'Mensagem Enviada'
      ).length;

      // Cobranças pendentes
      const pendingPayments = clients.filter(client => 
        ['Pendente', 'Atrasado', 'Vence Hoje'].includes(client.status)
      ).length;

      // Próximos vencimentos (próximos 7 dias)
      const nextWeek = addDays(today, 7);

      const upcomingDueDates = clients
        .filter(client => {
          if (!client.dueDate) return false;
          const dueDate = new Date(client.dueDate);
          return dueDate >= today && dueDate <= nextWeek;
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .map(client => ({
          name: client.name,
          service: client.service,
          value: client.value,
          dueDate: client.dueDate,
          status: client.status
        }));

      // Calcula total a receber
      const totalReceivable = upcomingDueDates.reduce((total, client) => 
        total + client.value, 0
      );

      setStats({
        totalClients,
        messagesSent,
        pendingPayments,
        upcomingDueDates,
        totalReceivable
      });
    };

    calculateStats();
    const interval = setInterval(calculateStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Bem-vindo ao CobrançasPRO</Typography>
        <Button
          component={Link}
          to="/client-registration"
          variant="contained"
          color="primary"
          startIcon={<PeopleIcon />}
        >
          Novo Cliente
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h3">{stats.totalClients}</Typography>
              <Typography color="textSecondary">Total de Clientes</Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WhatsAppIcon color="success" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h3">{stats.messagesSent}</Typography>
              <Typography color="textSecondary">Mensagens Enviadas</Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WarningIcon color="error" sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h3">{stats.pendingPayments}</Typography>
              <Typography color="textSecondary">Cobranças Pendentes</Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AttachMoneyIcon color="primary" sx={{ fontSize: 40 }} />
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'medium',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 0.5
                }}
              >
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0
                }).format(stats.totalReceivable || 0)}
              </Typography>
              <Typography color="textSecondary" sx={{ whiteSpace: 'nowrap' }}>
                A Receber (7 dias)
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Próximos Vencimentos
          </Typography>
          {stats.upcomingDueDates.length > 0 ? (
            <Box sx={{ 
              display: 'grid', 
              gap: 2,
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              {stats.upcomingDueDates.map((item, index) => (
                <Paper 
                  key={index} 
                  elevation={1}
                  sx={{ 
                    p: 2,
                    borderRadius: 2,
                    bgcolor: item.status === 'Atrasado' ? '#ffebee' :
                            item.status === 'Vence Hoje' ? '#fff3e0' :
                            item.status === 'Pago' ? '#e8f5e9' :
                            item.status === 'Mensagem Enviada' ? '#e3f2fd' :
                            '#ffffff',
                    borderLeft: 6,
                    borderColor: item.status === 'Atrasado' ? 'error.main' :
                               item.status === 'Vence Hoje' ? 'warning.main' :
                               item.status === 'Pago' ? 'success.main' :
                               item.status === 'Mensagem Enviada' ? 'info.main' :
                               'grey.300',
                    '&:hover': {
                      bgcolor: item.status === 'Atrasado' ? '#ffcdd2' :
                              item.status === 'Vence Hoje' ? '#ffe0b2' :
                              item.status === 'Pago' ? '#c8e6c9' :
                              item.status === 'Mensagem Enviada' ? '#bbdefb' :
                              '#f5f5f5',
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 1
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 500,
                      color: 'text.primary'
                    }}>
                      {item.name}
                    </Typography>
                    <Chip 
                      label={item.status}
                      size="small"
                      color={
                        item.status === 'Atrasado' ? 'error' :
                        item.status === 'Vence Hoje' ? 'warning' :
                        item.status === 'Pago' ? 'success' :
                        item.status === 'Mensagem Enviada' ? 'info' :
                        'default'
                      }
                      sx={{ 
                        fontWeight: 'medium',
                        minWidth: 120
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mt: 2
                  }}>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {item.service}
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold',
                      color: 'text.primary'
                    }}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(item.value)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Vence em {formatDateTimeForDisplay(item.dueDate)}
                  </Typography>
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography>Nenhum vencimento próximo.</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
