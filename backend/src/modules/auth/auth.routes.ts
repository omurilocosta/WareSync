import { Router } from 'express';
import { login, forgotPassword, resetPassword, logout, sessaoAtual } from './auth.controller';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/forgot-password', forgotPassword);
authRoutes.post('/reset-password', resetPassword);
authRoutes.post('/logout', logout);
authRoutes.get('/sessao', sessaoAtual);
