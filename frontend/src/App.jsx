import { Navigate,Route,Routes } from 'react-router';
import AppLayout from './components/layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Produtos from './pages/Produto';
import Clientes from './pages/Clientes';
import NovaVenda from './pages/NovaVenda';
import Vendas from './pages/Vendas';
import Caixa from './pages/Caixa';

function App() {
  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route element={<ProtectedRoute/>}>
        <Route element={<AppLayout/>}>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/estoque/produtos" element={<Produtos/>}/>
          <Route path="/clientes" element={<Clientes/>}/>
          <Route path="/vendas" element={<Vendas/>}/>
          <Route path="/vendas/nova" element={<NovaVenda/>}/>
          <Route path="/financeiro/caixa" element={<Caixa/>}/>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;