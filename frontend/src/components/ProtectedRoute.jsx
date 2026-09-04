import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';

import { getSessao } from '../services/authService';

function ProtectedRoute() {
    const [status, setStatus] = useState('verificando');

    useEffect(() => {
        let ativo = true;

        async function verificarSessao() {
            try {
                const response = await getSessao();
                const usuario = response?.data;
                const sessaoValida = response?.success === true && Boolean(usuario?.id);

                if (ativo) {
                    setStatus(sessaoValida ? 'autenticado' : 'nao-autenticado');
                }
            } catch {
                if (ativo) {
                    setStatus('nao-autenticado');
                }
            }
        }

        verificarSessao();

        return () => {
            ativo = false;
        };
    }, []);

    if (status === 'verificando') {
        return (
            <div className="empty-state">
                Verificando sessão...
            </div>
        );
    }

    if (status === 'nao-autenticado') {
        return (
            <Navigate to="/login" replace/>
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;