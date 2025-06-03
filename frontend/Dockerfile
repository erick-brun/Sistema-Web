# Usa imagem oficial com Node.js
FROM node:18

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependência
COPY package.json package-lock.json* ./


# Copia o restante dos arquivos para o container
COPY . .

# Instala as dependências do projeto
RUN npm install

# Expõe a porta padrão do Vite
EXPOSE 3000

# Comando para iniciar o Vite em modo desenvolvimento
CMD ["npm", "run", "dev"]
# Este é o comando padrão que o contêiner vai executar ao iniciar.
# No seu docker-compose.yml que revisamos, você definiu um 'command' para o serviço frontend:
# command: npm run dev -- --host 0.0.0.0
# Como há um 'command' definido no docker-compose.yml, este CMD no Dockerfile **é sobrescrito** e não será executado quando você usar 'docker-compose up'.
# Novamente, isso não é um problema, apenas uma observação de como o docker-compose interage com o Dockerfile.
# O comando 'npm run dev' por si só pode não configurar o servidor Vite para escutar em 0.0.0.0, o que é necessário para que outros contêineres (como o Nginx) 
# possam acessá-lo. Por isso, o 'command' no docker-compose.yml, que adiciona explicitamente '-- --host 0.0.0.0', é importante e correto para este setup.