// ============================================================
// Waresync — Cria (ou corrige) o usuário administrador de teste
// com uma senha corretamente hasheada, gerada em tempo real.
//
// Uso: dentro da pasta backend, rode:
//   node scripts/seed-admin.js
// ============================================================

require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const EMAIL = 'admin@waresync.com';
const SENHA = 'senha123';

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'waresync',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    const hash = await bcrypt.hash(SENHA, 10);

    const existente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [EMAIL]);

    if (existente.rows[0]) {
      await pool.query(
        `UPDATE usuarios SET nome = $1, senha_hash = $2, cargo = $3, ativo = TRUE WHERE email = $4`, 
        [
          'Usuário Waresync',
          hash,
          'administrador',
          EMAIL,
        ]
      );
      console.log(`[Waresync] Senha do usuário ${EMAIL} atualizada com sucesso.`);
    } else {
      await pool.query(
        'INSERT INTO usuarios (nome, email, senha_hash, cargo) VALUES ($1, $2, $3, $4)',
        ['Usuário Waresync', EMAIL, hash, 'administrador']
      );
      console.log(`[Waresync] Usuário ${EMAIL} criado com sucesso.`);
    }

    console.log(`[Waresync] Login de teste -> e-mail: ${EMAIL} | senha: ${SENHA}`);
  } catch (err) {
    console.error('[Waresync] Erro ao criar/atualizar o usuário administrador:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
