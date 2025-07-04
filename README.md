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

## Status do Projeto

Atualmente, o projeto está em sua **primeira versão funcional**. As funcionalidades principais descritas acima foram implementadas e testadas.

