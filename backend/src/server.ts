import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes';

const app = express();

// Middlewares Globais
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(requestLogger);

// Montagem das Rotas Principais
app.use('/api', routes);

// Middleware Global de Tratamento de Erros
app.use(errorHandler);

// Inicialização do Servidor HTTP
app.listen(env.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 DNAutos Vistorias API rodando com sucesso!`);
  console.log(`📍 URL Local: http://localhost:${env.port}/api`);
  console.log(`🩺 Health Check: http://localhost:${env.port}/api/health`);
  console.log(`🚗 AnyCar integration: ${env.anycarApiUrl ? 'configured' : 'awaiting business credentials'}`);
  console.log(`====================================================`);
});

export default app;
