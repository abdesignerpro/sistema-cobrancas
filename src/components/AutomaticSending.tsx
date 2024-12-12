import { useState, useEffect } from 'react';
import { messageService, defaultConfig } from '../services/messageService';
import { MessageConfig } from '../types';
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  SelectChangeEvent,
  Paper
} from '@mui/material';

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
  const [config, setConfig] = useState<MessageConfig>(defaultConfig);
  const [showSuccess, setShowSuccess] = useState(false);
  const [testMessages, setTestMessages] = useState<{ mainMessage: string; reminderMessage?: string } | null>(null);
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; error?: string } | null>(null);

  useEffect(() => {
    const savedConfig = messageService.getConfig();
    setConfig(savedConfig);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setConfig((prev: MessageConfig) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent<number>, field: keyof MessageConfig) => {
    setConfig((prev: MessageConfig) => ({
      ...prev,
      [field]: Number(event.target.value)
    }));
  };

  const handleSave = () => {
    messageService.saveConfig(config);
    setShowSuccess(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  const handleTest = async () => {
    try {
      const result = await messageService.testMessages(config);
      setTestMessages(result);
    } catch (error) {
      console.error('Erro ao testar mensagens:', error);
    }
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Configuração de Mensagens Automáticas
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Template da Mensagem Principal"
            name="messageTemplate"
            value={config.messageTemplate}
            onChange={handleInputChange}
            multiline
            rows={4}
            placeholder={defaultConfig.chargeTemplate}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={config.sendReminder}
                onChange={handleInputChange}
                name="sendReminder"
              />
            }
            label="Enviar Lembrete"
          />
        </Grid>

        {config.sendReminder && (
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template do Lembrete"
                name="reminderMessage"
                value={config.reminderMessage}
                onChange={handleInputChange}
                multiline
                rows={4}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Dias antes do vencimento"
                name="daysBeforeDue"
                value={config.daysBeforeDue}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Dias para lembrete"
                name="reminderDays"
                value={config.reminderDays}
                onChange={handleInputChange}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Hora do Envio</InputLabel>
            <Select<number>
              value={config.hour}
              onChange={(e) => handleSelectChange(e, 'hour')}
              label="Hora do Envio"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <MenuItem key={i} value={i}>{i.toString().padStart(2, '0')}:00</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Minuto do Envio</InputLabel>
            <Select<number>
              value={config.minute}
              onChange={(e) => handleSelectChange(e, 'minute')}
              label="Minuto do Envio"
            >
              {Array.from({ length: 60 }, (_, i) => (
                <MenuItem key={i} value={i}>{i.toString().padStart(2, '0')}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button variant="contained" onClick={handleSave}>
              Salvar Configurações
            </Button>
            <Button variant="outlined" onClick={handleTest}>
              Testar Mensagens
            </Button>
            <Button variant="outlined" onClick={handleResetTemplate}>
              Restaurar Padrão
            </Button>
          </Box>
        </Grid>

        {testMessages && (
          <Grid item xs={12}>
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
            </Paper>
          </Grid>
        )}

        <Grid item xs={12}>
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
        </Grid>
      </Grid>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          Configurações salvas com sucesso!
        </Alert>
      </Snackbar>
    </Box>
  );
}
