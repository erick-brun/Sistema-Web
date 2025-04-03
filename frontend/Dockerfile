# Usar a imagem oficial do Node.js
FROM node:18

# Definir o diretório de trabalho no container
WORKDIR /app

# Copiar os arquivos do package.json e package-lock.json
COPY package.json package-lock.json ./

# Instalar as dependências
RUN npm install

# Copiar todo o código para dentro do container
COPY . .

# Expor a porta 3000
EXPOSE 3000

# Rodar o servidor React
CMD ["npm", "start", "--", "--host", "0.0.0.0"]

