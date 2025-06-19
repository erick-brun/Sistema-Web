// frontend/src/pages/AmbientesPage.tsx

import React, { useEffect, useState, useCallback } from 'react'; // Importar useCallback
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

// Importar componentes de Material UI para listas e layout
import { Box, Typography, CircularProgress, List, ListItem, ListItemText, Paper, Button } from '@mui/material';
import theme from '../theme';

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


  // Renderização condicional (loading/error)
  if (loading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}> {/* Centralizar spinner */}
            <CircularProgress />
            <Typography variant="h6" sx={{ marginLeft: 2 }}>Carregando ambientes...</Typography>
        </Box>
    );
  }

  if (error) {
    return <Box sx={{ padding: 3 }}><Typography variant="h6" color="error">{error}</Typography></Box>;
  }


  return (
    // **ADICIONADO:** Container principal da página (cinza claro)
    <Box sx={{ padding: 3, backgroundColor: theme.palette.background.default }}> {/* Padding e fundo cinza */}
      <Typography variant="h4" component="h1" gutterBottom>Lista de Ambientes</Typography> {/* Título */}

      {/* Exibir a lista de ambientes */}
      {ambientes.length > 0 ? (
        // **MODIFICADO:** Usar componentes List, ListItem, ListItemText
        <List component={Paper} elevation={2} sx={{ padding: 2 }}> {/* Lista dentro de um Paper com sombra */}
          {ambientes.map(ambiente => (
            // Cada item da lista
            <ListItem
               key={ambiente.id}
               component={Link} // Fazer o item inteiro clicável e linkar
               to={`/ambientes/${ambiente.id}`}
               divider // Adicionar um divisor entre os itens
               sx={{ '&:hover': { backgroundColor: '#f0f0f0' } }} // Efeito hover sutil
            >
              <ListItemText // Texto principal e secundário do item
                 primary={
                    // Conteúdo principal: Nome e Capacidade
                    <Typography variant="h6">
                       {ambiente.nome} (Cap: {ambiente.capacidade})
                    </Typography>
                 }
                 secondary={
                    // Conteúdo secundário: Descrição e Comodidades
                    <> {/* Fragmento para agrupar */}
                       <Typography variant="body2" color="textSecondary">{ambiente.descricao}</Typography>
                       <Typography variant="body2" color="textSecondary">
                         Ativo: {ambiente.ativo ? 'Sim' : 'Não'} |
                         TV: {ambiente.tv ? 'Sim' : 'Não'} |
                         Projetor: {ambiente.projetor ? 'Sim' : 'Não'} |
                         Ar Condicionado: {ambiente.ar_condicionado ? 'Sim' : 'Não'}
                       </Typography>
                    </>
                 }
              />
              {/* Opcional: Adicionar link ou botão para solicitar reserva aqui */}
               {/* Ex: <Button variant="outlined" size="small" onClick={() => navigate(`/solicitar-reserva?ambienteId=${ambiente.id}`)}>Solicitar</Button> */}
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body1">Nenhum ambiente encontrado.</Typography> // Mensagem se lista vazia
      )}

      {/* TODO: Adicionar funcionalidade de paginação ou filtros aqui */}
       <Box mt={3}> {/* Espaço acima */}
          {/* Links ou botões de paginação/filtros */}
       </Box>


       <Box mt={3}> {/* Espaço acima */}
         {/* Link para voltar (já no Layout, mas pode adicionar aqui também) */}
         {/* <Link to="/home">Voltar para o início</Link> */}
       </Box>
    </Box>
  );
}

export default AmbientesPage;