import express from 'express';
import cors from 'cors';
import pixRoutes from './routes/pixRoutes';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/pix', pixRoutes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
