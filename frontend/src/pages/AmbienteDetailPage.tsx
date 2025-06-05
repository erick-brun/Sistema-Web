// frontend/src/pages/AmbienteDetailPage.tsx

import React, { useEffect, useState } from 'react';
// Importe useParams para obter parâmetros da URL
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'; // Importe a instância axios configurada

interface AmbienteData {
  id: number; // ID do ambiente
  nome: string;
  capacidade: number;
  descricao: string;
  tipo_ambiente: string;
  ativo: boolean;
  tv: boolean;
  projetor: boolean;
  ar_condicionado: boolean;
  // ... outros campos ...
}


function AmbienteDetailPage() { // Renomeado
  // Use useParams para obter o ID do ambiente da URL (ex: /ambientes/5)
  const { ambienteId } = useParams<{ ambienteId: string }>(); // ambienteId virá como string

  // State para armazenar os detalhes do ambiente
  const [ambiente, setAmbiente] = useState<AmbienteData | null>(null);
  // State para lidar com estado de carregamento
  const [loading, setLoading] = useState<boolean>(true);
  // State para lidar com erros (ex: ambiente não encontrado - 404)
  const [error, setError] = useState<string | null>(null);

  // Hook de navegação para redirecionar em caso de erro 404 (opcional)
  const navigate = useNavigate();


  // useEffect para buscar os detalhes do ambiente quando o componente é montado OU quando ambienteId muda
  useEffect(() => {
    const fetchAmbienteDetails = async () => {
      try {
        setLoading(true); // Inicia o carregamento
        setError(null); // Limpa erros
        setAmbiente(null); // Limpa ambiente anterior

        // Verifica se ambienteId existe na URL
        if (!ambienteId) {
          setError("ID do ambiente não fornecido na URL.");
          setLoading(false);
          return;
        }

        // Chama o endpoint para obter detalhes de um ambiente específico por ID.
        // GET /ambientes/{ambiente_id} requer autenticação (logado). Interceptor adiciona token.
        // O ambienteId da URL é uma string, mas o backend espera um int (API FastAPI/Pydantic lida com a conversão).
        const response = await api.get(`/ambientes/${ambienteId}`);

        // Armazena os detalhes do ambiente no state
        setAmbiente(response.data);
        console.log(`Detalhes do ambiente ${ambienteId} obtidos:`, response.data); // Log para verificar

      } catch (err: any) {
        console.error(`Erro ao obter detalhes do ambiente ${ambienteId}:`, err);
        // O interceptor 401 redireciona para login.
        // Este catch lida com outros erros (ex: 404 Not Found).
        const errorMessage = err.response?.data?.detail || 'Erro ao carregar detalhes do ambiente.';
        setError(errorMessage);

        // Opcional: Redirecionar para a página de lista se o ambiente não for encontrado (404)
        if (err.response && err.response.status === 404) {
            console.log('Ambiente não encontrado. Redirecionando para lista...');
            // setTimeout(() => { // Redirecionar após um pequeno delay
                 navigate('/ambientes'); // Redireciona para a página de lista
            // }, 2000);
        }

      } finally {
        setLoading(false); // Finaliza o carregamento
      }
    };

    // Chama a função de busca quando ambienteId muda (ou ao montar)
    fetchAmbienteDetails();
  }, [ambienteId, navigate]); // Adiciona ambienteId e navigate como dependências do useEffect


  // Renderização condicional
  if (loading) {
    return <div>Carregando detalhes do ambiente...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!ambiente) {
      // Caso não haja erro nem carregamento, mas o ambiente ainda é null (ex: erro 404 tratado pelo redirecionamento)
      // Ou se o ID não foi fornecido na URL (tratado no if(!ambienteId)).
      // Se você redireciona para 404, este estado talvez não seja alcançado.
       return <div>Ambiente não encontrado ou ID inválido.</div>;
  }

  // Se não estiver carregando, não houver erro, e ambiente existir, exibe os detalhes.
  return (
    <div>
      <h1>Detalhes do Ambiente: {ambiente.nome}</h1>

      {/* Exibir os detalhes do ambiente */}
      <div>
        <p><strong>ID:</strong> {ambiente.id}</p>
        <p><strong>Tipo:</strong> {ambiente.tipo_ambiente}</p>
        <p><strong>Capacidade:</strong> {ambiente.capacidade}</p>
        <p><strong>Descrição:</strong> {ambiente.descricao}</p>
        <p><strong>Status:</strong> {ambiente.ativo ? 'Ativo' : 'Inativo'}</p>
        <p><strong>Comodidades:</strong></p>
        <ul>
          <li>TV: {ambiente.tv ? 'Sim' : 'Não'}</li>
          <li>Projetor: {ambiente.projetor ? 'Sim' : 'Não'}</li>
          <li>Ar Condicionado: {ambiente.ar_condicionado ? 'Sim' : 'Não'}</li>
        </ul>
      </div>

      {/* TODO: Adicionar botão ou link para voltar para a lista */}
      {/* TODO: Adicionar formulário para solicitar reserva deste ambiente */}
    </div>
  );
}

export default AmbienteDetailPage;