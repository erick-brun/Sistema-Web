# Usar uma imagem oficial do Python
FROM python:3.11

# Definir o diretório de trabalho dentro do container
WORKDIR /app

# Copiar o arquivo de dependências primeiro
COPY requirements.txt .

# Instalar as dependências (esta camada será cached se requirements.txt não mudar)
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o restante dos arquivos do backend
COPY . .

# Expor a porta da API
EXPOSE 8000

# Comando para rodar o FastAPI (mantido para desenvolvimento com hot-reloading)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
