import express, { Application } from 'express';
import cors from 'cors';
import session from 'express-session';
import { authRoutes } from './modules/auth/auth.routes';
import { clientesRoutes } from './modules/clientes/clientes.routes';
import { produtosRoutes } from './modules/produtos/produtos.routes';
import { categoriasRoutes } from './modules/categorias/categorias.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { vendasRoutes } from './modules/vendas/vendas.routes';
import { contasPagarRoutes } from './modules/financeiro/contas-pagar.routes';
import { contasReceberRoutes } from './modules/financeiro/contas-receber.routes';
import { caixaRoutes } from './modules/financeiro/caixa.routes';
import { fluxoCaixaRoutes } from './modules/financeiro/fluxo-caixa.routes';
import { inadimplenciaRoutes } from './modules/financeiro/inadimplencia.routes';
import { relatoriosRoutes } from './modules/relatorios/relatorios.routes';
import { devolucoesRoutes } from './modules/devolucoes/devolucoes.routes';
import { inventariosRoutes } from './modules/inventarios/inventarios.routes';
import { fornecedoresRoutes } from './modules/fornecedores/fornecedores.routes';
import { transferenciasRoutes } from './modules/transferencias/transferencias.routes';
import { fiscalRoutes } from './modules/fiscal/fiscal.routes';
import { estoqueMovimentacoesRoutes } from './modules/estoque/estoque-movimentacoes.routes';
import { errorMiddleware } from './middlewares/error.middleware';
import './types';

export function createApp(): Application {
  const app = express();

  // Em desenvolvimento local, o Live Server pode abrir em portas diferentes
  // a cada vez (5500, 5501...) e às vezes em "localhost", às vezes em
  // "127.0.0.1". Em vez de depender de um FRONTEND_URL fixo no .env (que
  // quebra toda vez que a porta muda), aceitamos qualquer origem cujo host
  // seja localhost ou 127.0.0.1, em qualquer porta. Isso resolve a maior
  // parte dos erros de "não foi possível conectar" / sessão que não gruda.
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          // Requisições sem cabeçalho Origin (ex: Postman, curl) — libera.
          callback(null, true);
          return;
        }
        try {
          const { hostname } = new URL(origin);
          if (hostname === 'localhost' || hostname === '127.0.0.1') {
            callback(null, true);
            return;
          }
        } catch {
          // origem malformada — cai no bloqueio abaixo
        }
        callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'troque-este-segredo-em-producao',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 8, // 8h
        sameSite: 'lax', // permite o cookie entre portas diferentes de localhost/127.0.0.1
        secure: false, // ambiente local é http, não https
      },
    })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/clientes', clientesRoutes);
  app.use('/api/produtos', produtosRoutes);
  app.use('/api/categorias', categoriasRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/vendas', vendasRoutes);
  app.use('/api/caixa', caixaRoutes);
  app.use('/api/financeiro/contas-pagar', contasPagarRoutes);
  app.use('/api/financeiro/contas-receber', contasReceberRoutes);
  app.use('/api/financeiro/caixa', caixaRoutes);
  app.use('/api/financeiro/fluxo-caixa', fluxoCaixaRoutes);
  app.use('/api/financeiro/inadimplencia', inadimplenciaRoutes);
  app.use('/api/relatorios', relatoriosRoutes);
  app.use('/api/devolucoes', devolucoesRoutes);
  app.use('/api/inventarios', inventariosRoutes);
  app.use('/api/fornecedores', fornecedoresRoutes);
  app.use('/api/transferencias', transferenciasRoutes);
  app.use('/api/fiscal', fiscalRoutes);
  app.use('/api/estoque/movimentacoes', estoqueMovimentacoesRoutes);

  app.use(errorMiddleware);

  return app;
}
