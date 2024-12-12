import { useState, useEffect } from 'react';
import { Client, DashboardStats } from '../types';
import { clientService } from '../services/clientService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import WarningIcon from '@mui/icons-material/Warning';
import { formatDateTimeForDisplay } from '../utils/dateTimeUtils';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalReceivables: 0,
    upcomingPayments: 0,
    upcomingDueDates: []
  });

  useEffect(() => {
    const updateStats = () => {
      const clients = clientService.getClients();
      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(now.getDate() + 30);

      const totalReceivables = clients.reduce((total, client) => {
        if (client.status !== 'Pago') {
          return total + client.value;
        }
        return total;
      }, 0);

      const upcomingPayments = clients.filter(client => {
        const dueDate = new Date(client.dueDate);
        return dueDate <= thirtyDaysFromNow && client.status !== 'Pago';
      }).length;

      const upcomingDueDates = clients
        .filter(client => {
          const dueDate = new Date(client.dueDate);
          return dueDate <= thirtyDaysFromNow && client.status !== 'Pago';
        })
        .map(client => ({
          client: client.name,
          dueDate: client.dueDate,
          value: client.value,
          status: client.status
        }))
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      setStats({
        totalReceivables,
        upcomingPayments,
        upcomingDueDates
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total a Receber
              </Typography>
              <Typography variant="h5" component="div">
                {stats.totalReceivables.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pagamentos Próximos (30 dias)
              </Typography>
              <Typography variant="h5" component="div">
                {stats.upcomingPayments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Próximos Vencimentos
              </Typography>
              <List>
                {stats.upcomingDueDates.map((item, index) => (
                  <div key={index}>
                    <ListItem>
                      <ListItemText
                        primary={item.client}
                        secondary={`Vencimento: ${formatDateTimeForDisplay(item.dueDate)} - Valor: ${item.value.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })}`}
                      />
                    </ListItem>
                    {index < stats.upcomingDueDates.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
