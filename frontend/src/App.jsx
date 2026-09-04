import { Navigate,Route,Routes } from 'react-router';
import AppLayout from './components/layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Produtos from './pages/Produto';

function App() {
  return (
    <Routes>
      <Route path='/login' element={<Login />} />
      <Route element={<ProtectedRoute />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={ <Navigate to="/dashboard" replace/> }/>
        <Route path='/estoque/produtos' element={<Produtos />}/>

        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

export default App;