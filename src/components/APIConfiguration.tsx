import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import { checkConnection } from '../services/api';

interface APIConfig {
  apiUrl: string;
  instanceName: string;
  apiKey: string;
}

interface PIXConfig {
  nome: string;
  cidade: string;
  chave: string;
  txid: string;
}

export default function APIConfiguration() {
  const [config, setConfig] = useState<APIConfig>({
    apiUrl: localStorage.getItem('apiUrl') || 'http://localhost:8080',
    instanceName: localStorage.getItem('instanceName') || '123',
    apiKey: localStorage.getItem('apiKey') || '',
  });

  const [pixConfig, setPixConfig] = useState<PIXConfig>({
    nome: localStorage.getItem('pixNome') || 'AndersonBarbosa',
    cidade: localStorage.getItem('pixCidade') || 'CampinaGrande',
    chave: localStorage.getItem('pixChave') || '70408834498',
    txid: localStorage.getItem('pixTxid') || 'abdesignerpro',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const handleChange = (field: keyof APIConfig) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setConfig({ ...config, [field]: newValue });
    localStorage.setItem(field, newValue);
  };

  const handlePixChange = (field: keyof PIXConfig) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setPixConfig({ ...pixConfig, [field]: newValue });
    localStorage.setItem(`pix${field.charAt(0).toUpperCase() + field.slice(1)}`, newValue);
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await checkConnection();
      if (response?.instance?.state === 'open') {
        setMessage({
          text: 'Conexão com o WhatsApp estabelecida com sucesso!',
          type: 'success'
        });
      } else {
        throw new Error('WhatsApp não está conectado');
      }
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Erro ao testar conexão',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseMessage = () => {
    setMessage(null);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Configuração da API do WhatsApp
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="URL da API"
              value={config.apiUrl}
              onChange={handleChange('apiUrl')}
              placeholder="Ex: http://localhost:8080"
              helperText="URL base da Evolution API"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Nome da Instância"
              value={config.instanceName}
              onChange={handleChange('instanceName')}
              helperText="Nome da instância no Evolution API"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="API Key"
              type="password"
              value={config.apiKey}
              onChange={handleChange('apiKey')}
              helperText="Chave de API do Evolution API"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleTest}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              {loading ? 'Verificando...' : 'Verificar Conexão'}
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" gutterBottom>
          Configuração do PIX
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Nome do Beneficiário"
              value={pixConfig.nome}
              onChange={handlePixChange('nome')}
              helperText="Nome completo do recebedor do PIX"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Cidade"
              value={pixConfig.cidade}
              onChange={handlePixChange('cidade')}
              helperText="Cidade do beneficiário"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Chave PIX"
              value={pixConfig.chave}
              onChange={handlePixChange('chave')}
              helperText="Sua chave PIX (CPF, email, telefone ou chave aleatória)"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Identificador da Transação (txid)"
              value={pixConfig.txid}
              onChange={handlePixChange('txid')}
              helperText="Identificador único para suas transações PIX"
            />
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={message !== null}
        autoHideDuration={6000}
        onClose={handleCloseMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseMessage}
          severity={message?.type}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
