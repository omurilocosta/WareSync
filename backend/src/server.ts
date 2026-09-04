import { createApp } from './app';
import { testConnection } from './config/database';

const PORT = process.env.PORT || 3000;

async function start(): Promise<void> {
  try {
    await testConnection();
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`[Waresync] Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Waresync] Falha ao iniciar o servidor:', err);
    process.exit(1);
  }
}

start();
