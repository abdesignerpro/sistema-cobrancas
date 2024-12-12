import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import { MessageConfig, messageService } from '../services/messageService';

const DEFAULT_MESSAGE_TEMPLATE = `🔔 *Lembrete de Pagamento*\n\n` +
  `Olá {nome}! Segue sua fatura para o serviço:\n\n` +
  `📋 *Detalhes do Serviço*\n` +
  `▫️ Serviço: *{servico}*\n` +
  `▫️ Valor: *R$ {valor}*\n` +
  `▫️ Vencimento: *{dias}*\n\n` +
  `📱 *Como pagar com PIX*\n` +
  `1. Abra seu app do banco\n` +
  `2. Escolha pagar com PIX\n` +
  `3. Escaneie o QR Code ou copie o código abaixo\n\n` +
  `⚠️ *Importante*\n` +
  `• Guarde o comprovante\n` +
  `• Em caso de dúvidas, entre em contato\n\n` +
  `🙏 Agradecemos a preferência!`;

export default function AutomaticSending() {
  const [config, setConfig] = useState<MessageConfig>(messageService.getConfig());
  const [showSuccess, setShowSuccess] = useState(false);
  const [testMessages, setTestMessages] = useState<{ mainMessage: string; reminderMessage?: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleChange = (field: keyof MessageConfig) => (
    event: React.ChangeEvent<HTMLInputElement | { value: unknown }>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? (event.target as HTMLInputElement).checked 
      : event.target.value;
    setConfig({ ...config, [field]: value });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    messageService.saveConfig(config);
    setShowSuccess(true);
  };

  const handleTest = async () => {
    const messages = await messageService.testMessages(config);
    setTestMessages(messages);
  };

  const handleSendTest = async () => {
    if (!phone) {
      setSendResult({
        success: false,
        error: 'Por favor, insira um número de telefone'
      });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const result = await messageService.testSendMessage(phone, config);
      setSendResult(result);
    } catch (error) {
      setSendResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar mensagem'
      });
    } finally {
      setSending(false);
    }
  };

  const handleResetTemplate = () => {
    const newConfig = { ...config, messageTemplate: DEFAULT_MESSAGE_TEMPLATE };
    setConfig(newConfig);
    messageService.saveConfig(newConfig);
    setShowSuccess(true);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Configuração de Mensagens Automáticas
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Mensagem de Cobrança
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                multiline
                rows={8}
                label="Template da Mensagem de Cobrança"
                value={config.chargeTemplate}
                onChange={handleChange('chargeTemplate')}
                helperText="Use {nome}, {servico}, {valor}, {dias} como variáveis"
              />
              <Button
                variant="outlined"
                onClick={() => {
                  const newConfig = { ...config, chargeTemplate: messageService.DEFAULT_CHARGE_TEMPLATE };
                  setConfig(newConfig);
                  messageService.saveConfig(newConfig);
                  setShowSuccess(true);
                }}
                sx={{ mt: 1 }}
              >
                Restaurar Padrão
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="h6" sx={{ mt: 4 }} gutterBottom>
          Lembretes Automáticos
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Dias Antes do Vencimento</InputLabel>
              <Select
                value={config.daysBeforeDue}
                label="Dias Antes do Vencimento"
                onChange={handleChange('daysBeforeDue')}
              >
                {[1, 2, 3, 5, 7, 10].map((days) => (
                  <MenuItem key={days} value={days}>{days} dias</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Modelo de Mensagem"
              value={config.messageTemplate}
              onChange={handleChange('messageTemplate')}
              helperText="Use {nome}, {servico}, {dias}, {valor} como variáveis"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.sendReminder}
                  onChange={handleChange('sendReminder')}
                />
              }
              label="Enviar lembrete adicional"
            />
          </Grid>
          {config.sendReminder && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Dias do Lembrete</InputLabel>
                  <Select
                    value={config.reminderDays}
                    label="Dias do Lembrete"
                    onChange={handleChange('reminderDays')}
                  >
                    {[0, 1, 2].map((days) => (
                      <MenuItem key={days} value={days}>
                        {days === 0 ? 'No dia' : `${days} dia${days > 1 ? 's' : ''}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Mensagem do Lembrete"
                  value={config.reminderMessage}
                  onChange={handleChange('reminderMessage')}
                  helperText="Use {nome}, {servico}, {dias}, {valor} como variáveis"
                />
              </Grid>
            </>
          )}
        </Grid>
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
          >
            Salvar Configurações
          </Button>
          <Button
            variant="outlined"
            color="info"
            onClick={handleTest}
          >
            Testar Mensagens
          </Button>
        </Box>
      </Box>

      {testMessages && (
        <Paper sx={{ mt: 3, p: 2, bgcolor: 'grey.100' }}>
          <Typography variant="h6" gutterBottom>
            Prévia das Mensagens
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Mensagem Principal:
          </Typography>
          <Typography paragraph sx={{ whiteSpace: 'pre-wrap' }}>
            {testMessages.mainMessage}
          </Typography>
          
          {testMessages.reminderMessage && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Mensagem de Lembrete:
              </Typography>
              <Typography paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                {testMessages.reminderMessage}
              </Typography>
            </>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Enviar mensagem de teste:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                label="Número do WhatsApp"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="5511999999999"
                helperText="Digite o número com DDD e país"
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleSendTest}
                disabled={sending}
                sx={{ mt: 1 }}
              >
                {sending ? 'Enviando...' : 'Enviar Teste'}
              </Button>
            </Box>
            {sendResult && (
              <Alert 
                severity={sendResult.success ? 'success' : 'error'}
                sx={{ mt: 2 }}
              >
                {sendResult.success 
                  ? 'Mensagens enviadas com sucesso!' 
                  : `Erro: ${sendResult.error}`}
              </Alert>
            )}
          </Box>
        </Paper>
      )}

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Configurações salvas com sucesso!
        </Alert>
      </Snackbar>
    </Paper>
  );
}
