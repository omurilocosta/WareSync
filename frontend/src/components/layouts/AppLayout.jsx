import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';

import { getSessao, logout } from '../../services/authService';

const MENU = [
    {
        label: 'Painel',
        icon: '📊',
        path: '/dashboard',
    },
    {
        label: 'Vendas',
        icon: '🛒',
        children: [
            { label: 'Nova venda (PDV)', path: '/vendas/nova' },
            { label: 'Consultar vendas', path: '/vendas' },
        ],
    },
    {
        label: 'Estoque',
        icon: '📦',
        children: [
            { label: 'Produtos', path: '/estoque/produtos' },
            { label: 'Movimentações', path: '/estoque/movimentacoes' },
            { label: 'Inventário', path: '/estoque/inventario' },
        ],
    },
    {
        label: 'Financeiro',
        icon: '💰',
        children: [
            { label: 'Contas a pagar', path: '/financeiro?aba=pagar' },
            { label: 'Contas a receber', path: '/financeiro?aba=receber' },
            { label: 'Caixa', path: '/financeiro/caixa' },
            { label: 'Inadimplência', path: '/financeiro?aba=inadimplencia' },
            { label: 'Fluxo de caixa', path: '/financeiro?aba=fluxo' },
        ],
    },
    {
        label: 'Clientes',
        icon: '👥',
        children: [
            { label: 'Cadastro e consulta', path: '/clientes' },
        ],
    },
    {
        label: 'Fiscal',
        icon: '📄',
        children: [
            { label: 'Documentos fiscais', path: '/fiscal' },
        ],
    },
    {
        label: 'Relatórios',
        icon: '📈',
        children: [
            { label: 'Vendas', path: '/relatorios?aba=vendas' },
            { label: 'Estoque', path: '/relatorios?aba=estoque' },
            { label: 'Financeiro', path: '/relatorios?aba=financeiro' },
        ],
    },
    {
        label: 'Configurações',
        icon: '⚙️',
        children: [
            { label: 'Empresa', path: '/configuracoes?aba=empresa' },
            { label: 'Usuários', path: '/configuracoes?aba=usuarios' },
            { label: 'Caixa', path: '/configuracoes?aba=caixa' },
        ],
    },
    ];

function AppLayout() {
    const location = useLocation();

    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(null);
    const [perfilAberto, setPerfilAberto] = useState(false);

    const [openGroup, setOpenGroup] = useState(() => {
        const group = MENU.find((item) =>
        item.children?.some((child) =>
            child.path.startsWith(location.pathname)
        )
        );

        return group?.label || null;
    });

    useEffect(() => {
        async function carregarUsuario() {
            try {
                const response = await getSessao();

                if (!response?.data?.id) {
                    navigate('/login', {
                        replace: true,
                    })
                    return;
                }

                setUsuario(response.data);
            } catch {
                navigate('/login', {
                    replace: true,
                });
            }
        }

        carregarUsuario();
    }, [navigate]);

    function toggleGroup(label) {
        setOpenGroup((current) =>
        current === label ? null : label
        );
    }

    async function handleLogout() {
        try {
            await logout();
        } finally {
            navigate('/login', {
                replace: true,
            });
        }
    }

    const iniciais = usuario?.nome
        ? usuario.nome
            .split(' ')
            .filter(Boolean)
            .map((nome) => nome[0])
            .slice(0,2)
            .join('')
            .toUpperCase()
        : '--'

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar__header">
                    <img src="/assets/logo/waresync-icon.png" alt="WareSync"/>

                    <span className="sidebar__logo">Waresync</span>
                </div>

                <nav className="sidebar__nav">
                    {MENU.map((item) => {
                        const hasChildren = Boolean(item.children?.length);

                        const isGroupActive = hasChildren
                            ? item.children.some((child) =>
                                child.path.startsWith(location.pathname)
                            )
                            : location.pathname === item.path;

                        if (!hasChildren) {
                            return (
                                <NavLink
                                key={item.label}
                                to={item.path}
                                className={({ isActive }) =>
                                    `sidebar__item${isActive ? ' active' : ''}`
                                }
                                >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                                </NavLink>
                            );
                        }

                        const isOpen = openGroup === item.label;

                        return (
                            <div className="sidebar__group" key={item.label}>
                                <button type="button" 
                                    className={`sidebar__item sidebar__item--toggle${
                                        isGroupActive ? ' active' : ''
                                    }${isOpen ? ' open' : ''}`}
                                    onClick={() => toggleGroup(item.label)}
                                >
                                    <span>{item.icon}</span>

                                    <span style={{flex: 1, textAlign: 'left'}}> {item.label} </span>

                                    <span className="sidebar__chevron"> ⌄ </span>
                                </button>

                                <div className={`sidebar__submenu${ isOpen ? ' open' : '' }`}>
                                    {item.children.map((child) => (
                                        <NavLink key={child.label} to={child.path} className={() => 
                                            `sidebar__subitem${ location.pathname === child.path.split('?')[0]
                                                ? ' active'
                                                : ''
                                            }`
                                        }>
                                            {child.label}
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>

            <div className="app-main">
                <header className="topbar">
                    <label className="topbar__search">
                        <span>⌕</span>
                        <input type="text" placeholder="Buscar..." />
                    </label>

                    <div className='profile'>
                        <button type='button' className='profile__button' onClick={() => setPerfilAberto((aberto) => !aberto)}>
                            <div className="avatar">{iniciais}</div>
                            <span className="profile__name">
                                {usuario?.nome || 'Carregando...'}
                            </span>
                        </button>
                        {perfilAberto && (
                            <div className="profile__menu">
                                <div className="profile__info">
                                    <span className="profile__role">{usuario?.cargo || ''}</span>
                                </div>
                                <button type='button' className='profile__logout' onClick={handleLogout}>Sair</button>
                            </div>
                        )}
                    </div>
                </header>

                <main className="app-content"> <Outlet /> </main>
            </div>
        </div>
    );
}

export default AppLayout; 