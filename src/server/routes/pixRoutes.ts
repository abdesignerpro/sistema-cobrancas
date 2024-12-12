import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/generate-pix', async (req, res) => {
  try {
    const { nome, cidade, valor, chave, txid } = req.query;

    // Gera o BR Code
    const brCodeResponse = await axios.get(`https://gerarqrcodepix.com.br/api/v1`, {
      params: {
        nome,
        cidade,
        valor,
        chave,
        txid,
        saida: 'br'
      }
    });

    // Gera a URL do QR Code
    const qrCodeUrl = `https://gerarqrcodepix.com.br/api/v1?nome=${nome}&cidade=${cidade}&valor=${valor}&chave=${chave}&txid=${txid}&saida=qr`;

    res.json({
      qrcode: qrCodeUrl,
      qrCodeText: brCodeResponse.data.brcode || brCodeResponse.data
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code PIX:', error);
    res.status(500).json({ error: 'Erro ao gerar QR Code PIX' });
  }
});

export default router;
