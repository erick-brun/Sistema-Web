#!/bin/sh
# Script de Entrypoint customizado para processar template Nginx e iniciar Nginx

# Define o caminho do arquivo de configuração final
NGINX_CONF_FILE="/etc/nginx/conf.d/default.conf"
# Define o caminho do arquivo template (vamos copiar para um local temporário no Dockerfile)
NGINX_TEMPLATE_SOURCE="/tmp/nginx.conf.template" # Local temporário onde será copiado pelo Dockerfile

echo "Executando Entrypoint customizado Nginx..."

# ==========================================================
# DEBUG: Imprimir variáveis de ambiente relevantes
# ==========================================================
echo "--- DEBUG: Variáveis de Ambiente ---"
echo "BACKEND_INTERNAL_PORT = $BACKEND_INTERNAL_PORT"
echo "FRONTEND_INTERNAL_PORT = $FRONTEND_INTERNAL_PORT"
env | grep -E 'PORT|BACKEND|FRONTEND|NGINX' # Imprime variáveis relevantes
echo "-----------------------------------"
# ==========================================================

echo "Processando template Nginx: ${NGINX_TEMPLATE_SOURCE} -> ${NGINX_CONF_FILE}"

# Verifica se as variáveis essenciais estão definidas
if [ -z "$BACKEND_INTERNAL_PORT" ] || [ -z "$FRONTEND_INTERNAL_PORT" ]; then
  echo "ERRO FATAL: Variáveis BACKEND_INTERNAL_PORT ou FRONTEND_INTERNAL_PORT NÃO estão definidas no ambiente!"
  echo "Verifique o .env na raiz e a seção 'environment' do serviço 'nginx' no docker-compose.yml."
  exit 1 # Sai com erro
fi

# ==========================================================
# Executa o envsubst: lê do template, substitui APENAS as variáveis de porta listadas,
# e escreve no arquivo .conf final.
# Usando a sintaxe que substitui somente as variáveis listadas.
# Note as aspas simples ao redor da lista de variáveis para envsubst.
cat ${NGINX_TEMPLATE_SOURCE} | envsubst '$BACKEND_INTERNAL_PORT,$FRONTEND_INTERNAL_PORT' > ${NGINX_CONF_FILE}
# ==========================================================


# Verifica se o arquivo de configuração final foi gerado
if [ ! -f ${NGINX_CONF_FILE} ]; then
  echo "ERRO: O arquivo de configuração do Nginx (${NGINX_CONF_FILE}) NÃO foi gerado a partir do template!"
  echo "Conteúdo do template:"
  cat ${NGINX_TEMPLATE_SOURCE} # Mostra o conteúdo do template que tentou processar
  # Opcional: Imprimir variáveis de ambiente para debug em caso de falha
  # echo "Variáveis de ambiente relevantes:"
  # env | grep -E 'BACKEND_INTERNAL_PORT|FRONTEND_INTERNAL_PORT'
  exit 1 # Sai com erro para que o contêiner não inicie
fi

echo "Arquivo de configuração Nginx gerado com sucesso:"
cat ${NGINX_CONF_FILE} # Exibe o conteúdo final gerado
echo "Iniciando Nginx..."

# Executa o comando principal do contêiner Nginx (CMD padrão)
exec "$@"