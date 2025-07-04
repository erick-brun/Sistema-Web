// frontend/src/theme.ts

import { createTheme } from '@mui/material/styles';

// cores base 
const senaiAzulPrincipal = '#00529c'; // Azul vibrante para header, botões primários
const senaiBrancoPuro = '#FFFFFF'; // Branco puro para texto em fundos escuros, cards
const senaiCinzaClaro = '#F8F8F8'; // Fundo principal "não tão branco"
const senaiCinzaTextoPrincipal = '#333333'; // Cinza escuro para texto principal
const senaiCinzaTextoSecundario = '#666666'; // Cinza mais claro para texto secundário
const senaiVerde = '#8bc34a'; // Verde para sucesso
const senaiVermelhoErro = '#f44336'; // Vermelho para erros

// Crie seu tema customizado
const theme = createTheme({
  palette: {
    primary: {
      main: senaiAzulPrincipal,
      contrastText: senaiBrancoPuro,
    },
    error: {
        main: senaiVermelhoErro,
        contrastText: senaiBrancoPuro,
    },
    success: {
        main: senaiVerde,
        contrastText: senaiBrancoPuro,
    },
     background: {
      
      default: '#F0F0F0', // Exemplo: Um cinza bem, bem claro (ajustar valor)
      paper: senaiBrancoPuro, // Fundo para componentes como Paper, Card (branco puro)
      dashboardPanel: '#F2F2F2', // <--- Nova cor customizada para fundo de painel (cinza claro)
    },
    text: {
        primary: senaiCinzaTextoPrincipal,
        secondary: senaiCinzaTextoSecundario,
        light: senaiBrancoPuro, // Branco para texto em fundos escuros
        appBarLink: senaiCinzaTextoPrincipal, // Cor padrão dos links na barra branca
        pageTitle: '#00529c', 
    },
  },
  typography: { // Configuração de fontes e defaults para variações
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',

    // As definições de tamanho e peso base para cada variante estão aqui.
    // O espaçamento (margin) é geralmente feito nos styleOverrides dos componentes MU.
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 700, fontSize: '2rem' },
    h3: { fontWeight: 700, fontSize: '1.75rem' },
    h4: { fontWeight: 700, fontSize: '1.5rem' },
    h5: { fontWeight: 700, fontSize: '1.25rem' },
    h6: { fontWeight: 700, fontSize: '1rem' },
    body1: { fontWeight: 400, fontSize: '1rem' },
    body2: { fontWeight: 400, fontSize: '0.875rem' },
    button: { fontWeight: 700 },
  },
  spacing: 8, // Unidade de espaçamento base (8px)
  components: {
    MuiAppBar: { // Customizar o AppBar
          styleOverrides: {
              root: ({ theme }) => ({ // <--- FUNÇÃO AQUI para acessar theme
                  // **MODIFICADO:** Aumentar ainda mais a grossura/altura mínima da barra
                  minHeight: 60, // Exemplo: Aumentar para 88px (ajustar)
                  backgroundColor: theme.palette.background.paper, // Fundo branco
                  // boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', // Sombra inferior
              }),
          },
      },
    MuiToolbar: { // Customizar Toolbar
           styleOverrides: {
               root: ({ theme }) => ({
                   // Padding interno da Toolbar
                   paddingLeft: theme.spacing(3),
                   paddingRight: theme.spacing(3),
                   [theme.breakpoints.up('sm')]: {
                       paddingLeft: theme.spacing(2),
                       paddingRight: theme.spacing(2),
                   },
                   // **MODIFICADO:** Ajustar padding vertical na Toolbar para centralizar itens (ou em outros lugares)
                   // A altura da toolbar é controlada pelo minHeight do AppBar e conteúdo.
                   // Ajustar padding aqui pode refinar o alinhamento vertical.
                   paddingTop: theme.spacing(1), // Exemplo: adicionar um pouco de padding superior
                   paddingBottom: theme.spacing(1), // Exemplo: adicionar um pouco de padding inferior
                   // alignItems: 'center', // Deve ser padrão
               }),
           },
       },
   MuiButton: { // Customizar Botões
         styleOverrides: { // <--- styleOverrides AQUI
             root: ({ theme }) => ({
                 paddingLeft: theme.spacing(1.5),
                 paddingRight: theme.spacing(1.5),
                 fontWeight: 700,

                 // Cor padrão dos links (cinza escuro)
                 color: theme.palette.text.appBarLink,

                // Efeito de hover - Remover aumento de tamanho
                 transition: 'color 0.3s ease', // Apenas transição de cor
                  '&:hover': { // Estilos no hover
                      color: theme.palette.text.secondary,
                      // Removido: fontSize: '1.01rem', // Não aumentar tamanho
                      backgroundColor: 'transparent',
                  },
            }),

            // **CORREÇÃO:** Estilos para variant="contained" color="primary"
             containedPrimary: ({ theme }) => ({ // <--- ESTILO PARA BOTÕES AZUIS PREENCHIDOS
                // Fundo: primary.main (azul) - Padrão
                // **CORRIGIDO:** Forçar a cor do texto para branco
                 color: theme.palette.text.light, // <--- ADICIONADO: Forçar cor branca do texto
                // Alternativa: color: senaiBrancoPuro, // Usando a variável CSS/constante

                // Opcional: Efeito de hover (se quiser)
                 // '&:hover': { backgroundColor: theme.palette.primary.dark }, // Fundo mais escuro no hover
             }),

            // **CORRIGIDO:** Estilos para variant="outlined" color="primary"
             outlinedPrimary: ({ theme }) => ({ // <--- FUNÇÃO AQUI
                 color: theme.palette.primary.main, // Texto azul
                 borderColor: theme.palette.primary.main, // Borda azul
                 // Opcional: Estilo no hover
                  '&:hover': {
                      // Cor/borda mais escura no hover
                      borderColor: theme.palette.primary.dark,
                      color: theme.palette.primary.dark,
                      backgroundColor: 'transparent', // Manter transparente
                  },
            }),

            // **CORRIGIDO:** Estilos para variant="text" color="primary"
             textPrimary: ({ theme }) => ({ // <--- FUNÇÃO AQUI
                // Cor padrão para variant="text" color="primary"
                 color: theme.palette.primary.main,
                // Opcional: Estilo no hover
                  '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)', // Efeito de hover sutil (padrão)
                  },
            }),

            textError: ({ theme }) => ({ // <--- ESTILO PARA BOTÕES VERMELHOS SEM FUNDO NEM BORDA
                  // Cor do texto: error.main (vermelho)
                   color: theme.palette.error.main, // <--- Forçar cor vermelha

                 // Opcional: Efeito no hover
                  '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.04)', // Exemplo: fundo sutil no hover (usando RGBA do vermelho)
                  },
            }),

            outlinedError: ({ theme }) => ({ // <--- ESTILO PARA BOTÕES VERMELHOS CONTORNADOS
                  // Cor do texto e borda: error.main (vermelho)
                  color: theme.palette.error.main, // <--- Forçar cor vermelha do texto
                  borderColor: theme.palette.error.main, // <--- Forçar cor vermelha da borda

                  // Opcional: Estilo no hover
                   '&:hover': {
                       // Cor/borda mais escura no hover (usando error.dark)
                       borderColor: theme.palette.error.dark,
                       color: theme.palette.error.dark,
                       backgroundColor: 'transparent', // Manter transparente
                   },
             }),

            // **CORRIGIDO:** Estilos para variant="text" color="inherit" (usado nos links da AppBar)
            // Links na AppBar usam variant="text" e color="inherit".
            // A cor "inherit" pega a cor do texto do elemento pai (Toolbar/AppBar).
            // A cor do texto padrão do AppBar foi modificada no tema.palette.text.appBarLink.
            // Podemos customizar o estilo para textInherit aqui para aplicar os efeitos de hover.
            textInherit: ({ theme }) => ({ // Estilos para variant="text" color="inherit" (links na AppBar)
                  color: theme.palette.text.appBarLink, // Cor padrão (cinza escuro)
                 // Efeito de hover - Copiado do root, mas garante que se aplica a textInherit
                  transition: 'color 0.3s ease',
                   '&:hover': {
                       color: theme.palette.text.secondary,
                       backgroundColor: 'transparent',
                   },
            }),



            // Opcional: Customizar tamanhos (small, medium, large)
             sizeSmall: ({ theme }) => ({ padding: '4px 8px' }),
             sizeMedium: ({ theme }) => ({ padding: '8px 16px' }),
             sizeLarge: ({ theme }) => ({ padding: '10px 24px' }),

         },
     },
    MuiPaper: { // Customizar Paper (cards, painéis) - Usado nas caixinhas individuais do dashboard
         styleOverrides: {
             root: ({ theme }) => ({
                 boxShadow: 'var(--shadow-base)',
                 backgroundColor: theme.palette.background.paper, // Fundo branco para Paper
                 padding: theme.spacing(2), // Padding interno padrão
             }),
         },
     },
     // **ADICIONADO:** Customizar Box para usar a nova cor de fundo do painel
    //  MuiBox: {
    //      styleOverrides: {
    //          // Aplicar um style padrão para Boxes que servem como painéis
    //          // Você pode aplicar este estilo usando 'sx' no componente DashboardPanel
    //          // Mas definir uma variante customizada aqui pode ser mais robusto.
    //          // Ex: aplicar um estilo para Box com uma prop customizada, ou para o Box root de DashboardPanel.
    //          // Uma forma simples é usar a cor diretamente em sx no componente.
    //      }
    //  },
    MuiTextField: { // Customizar TextFields
        styleOverrides: {
            root: ({ theme }) => ({ // <--- FUNÇÃO AQUI
                marginBottom: theme.spacing(2), // <--- ACESSANDO theme.spacing DENTRO DA FUNÇÃO
            }),
        },
    },
     MuiFormControl: { // Customizar FormControl
         styleOverrides: {
             root: ({ theme }) => ({ // <--- FUNÇÃO AQUI
                 marginBottom: theme.spacing(2), // <--- ACESSANDO theme.spacing DENTRO DA FUNÇÃO
             })
         }
     },
     MuiTypography: { // Customizar Typography (margens e cor para títulos)
        styleOverrides: {
            // Margens e pesos já definidos.
            // **ADICIONADO:** Cor para os títulos (h1-h6)
            h1: ({ theme }) => ({ marginBottom: theme.spacing(4), color: theme.palette.text.pageTitle, important: true  }), // <--- ADICIONADO cor
            h2: ({ theme }) => ({ marginBottom: theme.spacing(3), color: theme.palette.text.pageTitle, important: true  }), // <--- ADICIONADO cor
            h3: ({ theme }) => ({ marginBottom: theme.spacing(2), color: theme.palette.text.pageTitle, important: true  }), // <--- ADICIONADO cor
            h4: ({ theme }) => ({ marginBottom: theme.spacing(2), color: theme.palette.text.pageTitle, important: true  }), // <--- ADICIONADO cor
            h5: ({ theme }) => ({ marginBottom: theme.spacing(2), color: theme.palette.text.pageTitle, important: true  }), // <--- ADICIONADO cor
            h6: ({ theme }) => ({ marginBottom: theme.spacing(2), color: theme.palette.text.pageTitle, important: true  }), // <--- ADICIONADO cor

            body1: ({ theme }) => ({ marginBottom: theme.spacing(1) }),
             body2: ({ theme }) => ({ marginBottom: theme.spacing(1) }),
        },
    },

  }, // FIM DA SEÇÃO COMPONENTS
  // Opcional: Adicionar configurações para breakpoints (responsividade)
   breakpoints: { // <--- ADICIONADO: Breakpoints
       values: {
           xs: 0,
           sm: 600,
           md: 900,
           lg: 1200,
           xl: 1536,
       },
   },
});

export default theme;