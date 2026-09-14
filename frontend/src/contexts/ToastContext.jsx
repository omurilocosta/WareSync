import { createContext, useCallback, useContext, useState, } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removerToast = useCallback((id) => {
        setToasts((atuais) =>
        atuais.filter((toast) => toast.id !== id)
        );
    }, []);

    const adicionarToast = useCallback(
        (mensagem, tipo = 'info', duracao = 5000) => {
            const id = crypto.randomUUID();

            setToasts((atuais) => [
                ...atuais,
                { id, mensagem, tipo, },
            ]);

            setTimeout(() => {
                removerToast(id);
            }, duracao);
        }, [removerToast]
    );

    const toast = {
        success: (mensagem) => adicionarToast(mensagem, 'success'),
        error: (mensagem) => adicionarToast(mensagem, 'error'),
        warning: (mensagem) => adicionarToast(mensagem, 'warning'),
        info: (mensagem) => adicionarToast(mensagem, 'info'),
    };

    return (
        <ToastContext.Provider value={toast}> {children}

            <div className="toast-container">
                {toasts.map((item) => (
                    <div key={item.id} className={`toast toast--${item.tipo}`} >
                        <span>{item.mensagem}</span>
                        <button type="button" className="toast-close" onClick={() => removerToast(item.id)} > × </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast deve ser utilizado dentro de ToastProvider.');
    }
    return context;
}