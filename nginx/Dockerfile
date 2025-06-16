# Usa a imagem oficial estável do Nginx baseada em Alpine Linux (menor)
FROM nginx:stable-alpine

# Remove o arquivo de configuração padrão da imagem base, para evitar conflitos.
RUN rm /etc/nginx/conf.d/default.conf

# Copia o script de entrypoint customizado para o contêiner
COPY docker-entrypoint.sh /usr/local/bin/

# Concede permissão de execução ao script
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copia o arquivo template de configuração para um local temporário dentro do contêiner.
# O script de entrypoint irá ler daqui.
COPY nginx.conf.template /tmp/nginx.conf.template 
# Copia para /tmp/

# Configura nosso script customizado como o ponto de entrada do contêiner.
# Isso garante que o script seja executado ANTES do CMD padrão.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Mantém o CMD padrão do Nginx. Ele será passado como argumento para o nosso ENTRYPOINT.
CMD ["nginx", "-g", "daemon off;"]

# Expõe a porta 80 (já está no template, mas é bom ter aqui por documentação)
EXPOSE 80
