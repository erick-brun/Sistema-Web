// frontend/src/pages/AmbientesPage.tsx

import React, { useEffect, useState } from 'react';
import api from '../services/api'; // Importe a instância axios configurada

// Importa o componente Link de react-router-dom
import { Link } from 'react-router-dom';

// Baseado no schema AmbienteRead do backend
interface AmbienteData {
  id: number; // ID do ambiente (int)
  nome: string;
  capacidade: number;
  descricao: string;
  tipo_ambiente: string; // O Enum TipoAmbiente vem como string
  ativo: boolean;
  tv: boolean;
  projetor: boolean;
  ar_condicionado: boolean;
  // Adicione outros campos do AmbienteRead se precisar
}


function AmbientesPage() { // Renomeado para maior clareza
  // State para armazenar a lista de ambientes
  const [ambientes, setAmbientes] = useState<AmbienteData[]>([]);
  // State para lidar com estado de carregamento
  const [loading, setLoading] = useState<boolean>(true);
  // State para lidar com erros na busca dos dados
  const [error, setError] = useState<string | null>(null);

  // useEffect para buscar a lista de ambientes quando o componente é montado
  useEffect(() => {
    const fetchAmbientes = async () => {
      try {
        setLoading(true); // Inicia o carregamento
        setError(null); // Limpa erros

        // Chama o endpoint para listar ambientes.
        // GET /ambientes/ requer autenticação (logado). O interceptor do axios adicionará o token.
        // Opcional: adicionar query parameters para filtros ou paginação aqui:
        // const response = await api.get('/ambientes/', { params: { skip: 0, limit: 100, ativo: true } });
        const response = await api.get('/ambientes/');

        // Armazena a lista de ambientes no state
        setAmbientes(response.data);
        console.log('Lista de ambientes obtida:', response.data); // Log para verificar

      } catch (err: any) {
        console.error('Erro ao obter lista de ambientes:', err);
        // O interceptor 401 já redireciona para login.
        // Este catch lidaria com outros erros (ex: 500).
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar lista de ambientes.';
        setError(errorMessage);
      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    };

    fetchAmbientes();
  }, []); // O array vazio [] garante que roda apenas uma vez ao montar


  // Renderização condicional baseada no estado de carregamento e erro
  if (loading) {
    return <div>Carregando ambientes...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  // Se não estiver carregando e não houver erro, exibe a lista.
  return (
    <div>
      <h1>Lista de Ambientes</h1>

      {/* Exibir a lista de ambientes */}
      {ambientes.length > 0 ? (
        <ul>
          {ambientes.map(ambiente => (
            <li key={ambiente.id}>
              {/* Adicionado Link para a página de detalhes */}
              {/* O caminho inclui o ID do ambiente */}
              <Link to={`/ambientes/${ambiente.id}`}>
                 <strong>{ambiente.nome}</strong> (Tipo: {ambiente.tipo_ambiente}, Cap: {ambiente.capacidade})
              </Link>
              <p>{ambiente.descricao}</p>
              {/* Opcional: Mostrar status ativo e comodidades */}
              <small>
                Ativo: {ambiente.ativo ? 'Sim' : 'Não'} |
                TV: {ambiente.tv ? 'Sim' : 'Não'} |
                Projetor: {ambiente.projetor ? 'Sim' : 'Não'} |
                Ar Condicionado: {ambiente.ar_condicionado ? 'Sim' : 'Não'}
              </small>
              <p></p>
              {/* TODO: Adicionar link ou botão para solicitar reserva aqui (usando o ID do ambiente) */}
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum ambiente encontrado.</p>
      )}

      {/* TODO: Adicionar funcionalidade de paginação ou filtros aqui */}
    </div>
  );
}

export default AmbientesPage;