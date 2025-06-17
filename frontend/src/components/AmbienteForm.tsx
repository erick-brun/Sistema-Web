// frontend/src/components/AmbienteForm.tsx

import React, { useEffect, useState } from 'react';
// Importar Link (se necessário para links dentro do form)
// import { Link } from 'react-router-dom';

// Opcional: Importar componentes de UI (ex: Material UI TextField, Button, Select, Checkbox, FormControlLabel, etc.)
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Checkbox, FormControlLabel, Typography, Box } from '@mui/material'; // <--- Importar componentes MU

// Reutilizar as interfaces AmbienteFormData e AmbienteData (para props e estado)
import { AmbienteFormData, AmbienteData } from '../pages/ManageAmbientesPage'; // <--- Importar interfaces de ManageAmbientesPage


// TODO: Reutilizar ou definir a lista de Tipos de Ambiente (já definida antes)
// Para o dropdown de tipo de ambiente.
const tipoAmbienteOptions: string[] = [ // Baseado no Enum TipoAmbiente do backend
    "sala", "ead", "reuniao_fablab", "sala_oficina", "auditorio", "biblioteca",
    "ti", "elet_predial", "elet_industrial", "elet_comandos", "eletrotecnica",
    "auto", "auto_instrumentacao", "auto_eletronica", "auto_ind",
    "mec_hidraulica", "mec_pneumatica", "mec_metrologia", "quimica",
    "ofic_solda", "ofic_calderaria", "ofic_marcenaria", "ofic_usinagem",
    "ofic_manutencao", "ofic_polimeros", "fablab", "confec_costura", "confec_model",
    "energ_lab", "energ_fotovoltaica", "energ_lab_sala", "energ_preacelera", "logistica"
];


// Interface para as props do componente AmbienteForm (já definida)
interface AmbienteFormProps {
  // initialData: Dados iniciais para pré-popular o formulário (se for edição). Null para criação.
  initialData: AmbienteData | null;
  // onSubmit: Função a ser chamada quando o formulário for submetido.
  // Recebe os dados do formulário e opcionalmente o ID do ambiente (se for edição).
  onSubmit: (formData: AmbienteFormData, ambienteId?: number) => Promise<void>; // Retorna uma Promise para lidar com assincronismo
  // onCancel: Função a ser chamada quando o formulário for cancelado (fechar modal, etc.).
  onCancel: () => void;
  // Opcional: isSubmitting (indica que a submissão está em andamento)
  isSubmitting?: boolean;
  // Opcional: submitError (mensagem de erro de submissão vinda da página pai)
  submitError?: string | null;
}


// Componente de Formulário para Criação/Edição de Ambiente
const AmbienteForm: React.FC<AmbienteFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting = false, submitError = null }) => {

  // Use state para gerenciar os valores do formulário
  // Inicializa com initialData (para edição) ou valores padrão (para criação)
  const [formData, setFormData] = useState<AmbienteFormData>({
    nome: initialData?.nome || '',
    capacidade: initialData?.capacidade || '', // Inicia como '' para placeholder em input text/number
    descricao: initialData?.descricao || '',
    tipo_ambiente: initialData?.tipo_ambiente || '', // Pode começar vazio para select
    ativo: initialData?.ativo ?? true, // Default para true na criação, usa valor existente na edição
    tv: initialData?.tv ?? false, // Default para false
    projetor: initialData?.projetor ?? false, // Default para false
    ar_condicionado: initialData?.ar_condicionado ?? false, // Default para false
  });

  // Use state para gerenciar mensagens de erro no formulário (validação frontend)
  const [formErrors, setFormErrors] = useState<{[key: string]: string | undefined}>({}); // Usar undefined para indicar sem erro


  // useEffect para pré-popular o formulário quando initialData muda (útil se o formulário for reutilizado sem ser desmontado)
  // Este useEffect garante que o formulário é resetado/pré-populado corretamente.
  useEffect(() => {
    setFormData({
       nome: initialData?.nome || '',
       capacidade: initialData?.capacidade || '',
       descricao: initialData?.descricao || '',
       tipo_ambiente: initialData?.tipo_ambiente || '',
       ativo: initialData?.ativo ?? true,
       tv: initialData?.tv ?? false,
       projetor: initialData?.projetor ?? false,
       ar_condicionado: initialData?.ar_condicionado ?? false,
    });
    // Limpar erros de validação do formulário ao resetar
    setFormErrors({});
  }, [initialData]); // Roda quando initialData muda


  // Função para lidar com a mudança nos inputs do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    // Lida com inputs checkbox (boolean)
    if (type === 'checkbox') {
       const checked = (e.target as HTMLInputElement).checked;
       setFormData({
           ...formData,
           [name]: checked,
       });
    } else {
       // Lida com inputs de texto, número, select, textarea
       setFormData({
           ...formData,
           // Converter capacidade para number apenas se o campo for 'capacidade' e o value não for vazio
           // Usar parseInt para garantir que é um número inteiro
           [name]: name === 'capacidade' && value !== '' ? parseInt(value, 10) : value, // <--- Usar parseInt
       });
    }
     // Limpar erro de validação frontend para este campo ao digitar
     setFormErrors({...formErrors, [name]: undefined}); // Limpa erro para o campo modificado
  };


  // Função para validar o formulário no frontend (opcional, mas boa prática)
  const validateForm = (): boolean => {
     const errors: {[key: string]: string | undefined} = {}; // Usar undefined

     if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório.';
     // Checa se capacidade é '', <= 0, OU NaN após conversão
     if (formData.capacidade === '' || typeof formData.capacidade !== 'number' || formData.capacidade <= 0 || isNaN(formData.capacidade)) {
          errors.capacidade = 'Capacidade deve ser um número inteiro positivo.';
     }
     if (!formData.descricao.trim()) errors.descricao = 'Descrição é obrigatória.';
     if (!formData.tipo_ambiente) errors.tipo_ambiente = 'Tipo de ambiente é obrigatório.';

     setFormErrors(errors);
     // Retorna true se não houver erros (todos os valores no objeto de erros são undefined), false caso contrário.
     return Object.values(errors).every(error => error === undefined); // Verifica se *todos* os valores de erro são undefined.
  };


  // Função para lidar com submissão do formulário
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Limpa erros de submissão anteriores (vindos da API via props)
    // Nota: successMessage é gerenciado na página pai
    // setError(null); // Este erro é gerenciado pela página pai que passa submitError

    // Validação frontend antes de submeter
    if (!validateForm()) {
        console.log("Validação frontend falhou.");
        return; // Para a submissão se a validação falhar
    }
     console.log("Validação frontend bem-sucedida.");

    // Chama a função onSubmit passada pelas props
    // Passa os dados do formulário E o ID do ambiente se estiver em modo edição
    // A função onSubmit (na página pai) lidará com a chamada API (POST ou PATCH)
    // initialData?.id será undefined para criação
    await onSubmit(formData, initialData?.id);

    // Nota: Limpar o formulário após submissão bem-sucedida (se for criação) e fechar o formulário
    // deve ser feito na função onSubmit na página pai, após o sucesso da API call.
    // A página pai também lidará com a exibição de mensagens de sucesso/erro de submissão (submitError).
  };


  // Determinar o título do formulário (já nas props da página pai)
  // const formTitle = initialData ? 'Editar Ambiente' : 'Novo Ambiente';


  return (
    // **ADICIONADO:** Container para o formulário (opcional)
    <Box> {/* Ou um <div> */}
      {/* **ADICIONADO:** Título do formulário - Passado pela página pai ou definido aqui */}
      {/* Opcional: Exibir título aqui se preferir, ou na página pai */}
      {/* <Typography variant="h6" component="h2">{formTitle}</Typography> */}

      {/* Exibe mensagem de erro de submissão (vindo da página pai via props) */}
      {submitError && <p style={{ color: 'red' }}>{submitError}</p>}

      {/* Formulário */}
      <form onSubmit={handleSubmit}>
        {/* Campo Nome */}
        <Box mb={2}> {/* mb={2} para margem inferior se usar Box/Material UI */}
          <TextField // Exemplo com Material UI TextField
             label="Nome" // Label flutuante
             fullWidth // Ocupa a largura total
             id="nome"
             name="nome"
             value={formData.nome}
             onChange={handleChange}
             required
             error={!!formErrors.nome} // Marca como erro se houver mensagem de erro para este campo
             helperText={formErrors.nome} // Exibe a mensagem de erro
          />
           {/* Se não usar Material UI: */}
           {/* <div>
              <label htmlFor="nome">Nome:</label>
              <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
              {formErrors.nome && <p style={{ color: 'red" }}>{formErrors.nome}</p>}
           </div> */}
        </Box>

        {/* Campo Capacidade */}
         <Box mb={2}>
            <TextField
               label="Capacidade"
               fullWidth
               id="capacidade"
               name="capacidade"
               type="number"
               value={formData.capacidade} // Note que o estado pode ser number ou ''. TextField lida bem com isso.
               onChange={handleChange}
               required
               error={!!formErrors.capacidade}
               helperText={formErrors.capacidade}
               inputProps={{ min: 1 }} // Propriedade HTML5 para input type="number"
            />
         </Box>

        {/* Campo Descrição */}
         <Box mb={2}>
            <TextField
               label="Descrição"
               fullWidth
               id="descricao"
               name="descricao"
               value={formData.descricao}
               onChange={handleChange}
               required
               multiline // Para textarea
               rows={3}
               error={!!formErrors.descricao}
               helperText={formErrors.descricao}
            />
         </Box>

        {/* Campo Tipo de Ambiente (Select) */}
         <Box mb={2}>
            <FormControl fullWidth required error={!!formErrors.tipo_ambiente}> {/* FormControl envolve Select, InputLabel */}
               <InputLabel id="tipo-ambiente-label">Tipo</InputLabel> {/* Label para o Select */}
               <Select
                 labelId="tipo-ambiente-label" // ID do InputLabel
                 id="tipo_ambiente"
                 name="tipo_ambiente"
                 value={formData.tipo_ambiente}
                 label="Tipo" // Repete o label para o Select com label flutuante
                 onChange={handleChange}
               >
                 <MenuItem value="">-- Selecione o Tipo --</MenuItem> {/* Opção vazia */}
                 {tipoAmbienteOptions.map(tipo => (
                     <MenuItem key={tipo} value={tipo}>{tipo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</MenuItem>
                 ))}
               </Select>
               {formErrors.tipo_ambiente && <p style={{ color: 'red' }}>{formErrors.tipo_ambiente}</p>}
            </FormControl>
         </Box>


        {/* Campo Ativo (Checkbox) */}
         <Box mb={2}>
            {/* Usando FormControlLabel para o checkbox */}
            <FormControlLabel
               control={
                 <Checkbox
                    id="ativo"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                  />
               }
               label="Ativo"
            />
         </Box>

        {/* Campos de Comodidades (Checkboxes) */}
        <Box mb={2}>
           <Typography variant="body1">Comodidades:</Typography> {/* Título para o grupo de checkboxes */}
           <Box> {/* Box para agrupar os checkboxes */}
              <FormControlLabel
                 control={<Checkbox id="tv" name="tv" checked={formData.tv} onChange={handleChange} />}
                 label="TV"
              />
              <FormControlLabel
                 control={<Checkbox id="projetor" name="projetor" checked={formData.projetor} onChange={handleChange} />}
                 label="Projetor"
              />
              <FormControlLabel
                 control={<Checkbox id="ar_condicionado" name="ar_condicionado" checked={formData.ar_condicionado} onChange={handleChange} />}
                 label="Ar Condicionado"
              />
           </Box>
        </Box>


        {/* Botões de Ação (Submit e Cancelar) */}
        <Box mt={3}> {/* mt={3} para margem superior */}
          <Button // Exemplo com Material UI Button
             type="submit"
             variant="contained" // Estilo preenchido
             color="primary" // Cor primária
             disabled={isSubmitting} // Desabilita durante a submissão
          >
            {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar Ambiente' : 'Criar Ambiente')}
          </Button>
          {' '} {/* Espaço */}
          <Button
             type="button"
             variant="outlined" // Estilo contornado
             onClick={onCancel} // Chama a função de cancelamento passada pelas props
             disabled={isSubmitting}
          >
            Cancelar
          </Button>
        </Box>
      </form>
    </Box> // Fim do Box container
  );
}

export default AmbienteForm;