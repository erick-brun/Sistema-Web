// frontend/src/pages/AmbienteDetailPage.tsx

import React, { useEffect, useState, useCallback } from 'react'; // Importar useCallback
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

// Importar componentes de Material UI
import { Box, Typography, CircularProgress, Paper, Button } from '@mui/material';
import theme from '../theme';

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


  // Renderização condicional (loading/error)
  if (loading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}> {/* Centralizar spinner */}
            <CircularProgress />
            <Typography variant="h6" sx={{ marginLeft: 2 }}>Carregando detalhes do ambiente...</Typography>
        </Box>
    );
  }

  if (error) {
    return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">{error}</Typography></Box>;
  }

  if (!ambiente) {
       // Caso não haja erro nem carregamento, mas o ambiente ainda é null (ex: erro 404 tratado pelo redirecionamento)
       return <div>Ambiente não encontrado ou ID inválido.</div>; // Pode estilizar melhor esta mensagem
  }


  return (
    // **ADICIONADO:** Container principal da página (cinza claro)
    <Box sx={{ padding: 3, backgroundColor: theme.palette.background.default }}> {/* Padding e fundo cinza */}
      <Typography variant="h4" component="h1" gutterBottom>Detalhes do Ambiente: {ambiente.nome}</Typography> {/* Título */}

      {/* **MODIFICADO:** Usar Paper para envolver os detalhes */}
      <Paper elevation={2} sx={{ padding: 3 }}> {/* Paper com sombra e padding interno */}

         {/* Exibir os detalhes do ambiente */}
         <Box> {/* Usar Box para layout */}
            {/* Usar Typography para cada detalhe */}
           <Typography variant="body1" gutterBottom><strong>ID:</strong> {ambiente.id}</Typography> {/* **MODIFICADO:** Usar Typography */}
           <Typography variant="body1" gutterBottom><strong>Tipo:</strong> {ambiente.tipo_ambiente}</Typography> {/* **MODIFICADO:** Usar Typography */}
           <Typography variant="body1" gutterBottom><strong>Capacidade:</strong> {ambiente.capacidade}</Typography> {/* **MODIFICADO:** Usar Typography */}
           <Typography variant="body1" gutterBottom><strong>Descrição:</strong> {ambiente.descricao}</Typography> {/* **MODIFICADO:** Usar Typography */}
           <Typography variant="body1" gutterBottom><strong>Status:</strong> {ambiente.ativo ? 'Ativo' : 'Inativo'}</Typography> {/* **MODIFICADO:** Usar Typography */}
           <Typography variant="body1" gutterBottom><strong>Comodidades:</strong></Typography> {/* **MODIFICADO:** Título para comodidades */}
           <Box component="ul" sx={{ pl: 3 }}> {/* Usar Box como lista (ul), padding left */}
             <Typography component="li" variant="body1">TV: {ambiente.tv ? 'Sim' : 'Não'}</Typography> {/* **MODIFICADO:** Usar Typography como item de lista (li) */}
             <Typography component="li" variant="body1">Projetor: {ambiente.projetor ? 'Sim' : 'Não'}</Typography> {/* **MODIFICADO:** Usar Typography como item de lista (li) */}
             <Typography component="li" variant="body1">Ar Condicionado: {ambiente.ar_condicionado ? 'Sim' : 'Não'}</Typography> {/* **MODIFICADO:** Usar Typography como item de lista (li) */}
           </Box>
         </Box>

      </Paper> {/* Fim do Paper */}

      {/* TODO: Adicionar botão ou link para voltar para a lista */}
      {/* TODO: Adicionar formulário para solicitar reserva deste ambiente */}

       <Box mt={3}> {/* Espaço acima */}
         {/* Adicionar botão para voltar para a lista de ambientes */}
          <Button variant="outlined" onClick={() => navigate('/ambientes')}>Voltar para Lista</Button>
           {' '} {/* Espaço */}
          {/* Adicionar botão para solicitar reserva deste ambiente (passando ID) */}
           <Button variant="contained" onClick={() => navigate(`/solicitar-reserva?ambienteId=${ambiente.id}`)}>Solicitar Reserva</Button>
       </Box>
    </Box>
  );
}

export default AmbienteDetailPage;