# Sistema Web de Reservas de Salas e Ambientes (Projeto de Extensão)

## Apresentação do Projeto

Este é um **Sistema Web de Reservas de Salas e Ambientes** desenvolvido como um **Projeto de Extensão** para minha Graduação de Banco de dados no Instituto INFNET para o SENAI.

O objetivo principal do sistema é modernizar e otimizar a gestão de espaços físicos (salas, laboratórios, etc.) na filial do SENAI, oferecendo uma plataforma digital para solicitação, acompanhamento e gerenciamento de reservas.

## Funcionalidades Principais

A primeira versão do sistema web oferece as seguintes funcionalidades:

- **Gerenciamento de Usuários:** Cadastro, Login (com segurança JWT), controle de acesso baseado em níveis (Usuário Comum e Administrador), promoção e rebaixamento de administradores.
- **Gerenciamento de Ambientes:** Cadastro, listagem (com filtros), visualização de detalhes, edição e exclusão de ambientes físicos por administradores. Visualização de ambientes por usuários logados.
- **Gerenciamento de Reservas:**
    - Solicitação de novas reservas por usuários (para si) ou administradores (para si ou outros).
    - Verificação inteligente de disponibilidade de horários.
    - Visualização de reservas (pessoais e gerais para administradores).
    - Edição de detalhes e atualização de status (Cancelada, Confirmada, Finalizada) por usuários com permissão (dono se pendente, ou administrador sempre).
    - Movimentação automática de reservas canceladas ou finalizadas para o histórico.
- **Histórico de Reservas:** Visualização do histórico de reservas (pessoal e geral para administradores).
- **Dashboard:** Painel visual com as reservas do dia por turno.

## Tecnologias Utilizadas

O projeto foi construído utilizando um stack tecnológico moderno:

- **Backend:** Desenvolvido em **Python** utilizando o framework **FastAPI** para a API, **SQLModel** para interação com o banco de dados **PostgreSQL**. A segurança é garantida com JWT e hashing de senhas.
- **Frontend:** Construído com **React** e **TypeScript**, utilizando **Vite** como ferramenta de build. A interface é estilizada com a biblioteca **Material UI**.
- **Infraestrutura:** A aplicação é executada em contêineres **Docker** orquestrados por **Docker Compose**, com **Nginx** atuando como servidor web e proxy reverso.

## Configuração e Execução (Desenvolvimento)

Para executar o projeto em seu ambiente local, você precisará ter o Docker e Docker Compose instalados.

1.  Clone o repositório.
2.  Crie um arquivo `.env` na raiz do projeto e configure as variáveis de ambiente (consulte o arquivo `.env.example` se disponível).
3.  Execute `docker-compose up --build -d` no terminal na raiz do projeto.
4.  Acesse a aplicação em `http://localhost:[porta_nginx]` (a porta configurada no `.env`). A documentação da API (Swagger UI) estará disponível em `http://localhost:8000/docs`.

[Opcional: Adicionar uma ou duas screenshots da aplicação em funcionamento para visualização.]

## Status do Projeto

Atualmente, o projeto está em sua **primeira versão funcional**. As funcionalidades principais descritas acima foram implementadas e testadas.

[Opcional: Se houver planos para futuras versões ou melhorias, pode mencioná-los brevemente aqui.]

---

Substitua os placeholders `[ ... ]` pelas informações específicas do seu projeto e da faculdade/filial do SENAI. Este `README.md` é simples, direto e cumpre o objetivo de apresentar o projeto e suas tecnologias de forma clara. Parabéns novamente pelo projeto!
