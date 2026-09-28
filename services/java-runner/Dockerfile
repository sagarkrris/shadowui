FROM node:20-alpine
RUN apk add --no-cache docker-cli
WORKDIR /app
COPY server.mjs executor.mjs ./
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
