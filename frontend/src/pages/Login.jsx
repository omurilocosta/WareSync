import { useState } from 'react';
import { useNavigate } from 'react-router';

import { login } from '../services/authService';
import '../styles/login.css';

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    async function handleSubmit(event) {
        event.preventDefault();

        setErro('');

        if (!email.trim() || !senha) {
            setErro('Preencha e-mail e senha.');
            return;
        }

        try {
            setCarregando(true);

            await login(email.trim(), senha);

            navigate('/dashboard', {
                replace: true,
            });
        } catch (error) {
            setErro(error.message);
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <img className="icon" src="/assets/logo/waresync-icon.png" alt="WareSync"/>
                </div>

                <h1 className="auth-title"> Entrar na sua conta </h1>
                <p className="auth-subtitle">Acesse o painel do WareSync</p>

                <form onSubmit={handleSubmit}> {erro && (
                    <div className="auth-form-error">{erro}</div> )}
                    <div className="auth-field">
                        <label htmlFor="email">E-mail</label>

                        <input id="email" type="email" placeholder="voce@empresa.com" autoComplete="username" value={email} onChange={(event) =>
                            setEmail(event.target.value) }
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="senha">Senha</label>
                        <div className="auth-password-wrap">
                            <input id="senha" type={ mostrarSenha ? 'text' : 'password'} placeholder="Digite sua senha" 
                                autoComplete="current-password" value={senha} onChange={(event) => setSenha(event.target.value)}
                            />

                            <button type="button" className="auth-toggle-password" onClick={() => setMostrarSenha((valorAtual) => !valorAtual)}>
                                {mostrarSenha ? 'ocultar' : 'mostrar'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-submit" disabled={carregando}>
                        {carregando ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;