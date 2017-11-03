FROM node:8.1-slim
ENV NETWORK_TYPE DEFAULT_NETWORK_TYPE
ENV NPM_CONFIG_LOGLEVEL warn
RUN apt-get update -qq && \
    apt-get install -y -qq python make g++ git build-essential && \
    npm install -g --silent pm2@2.7.1 && \
    mkdir /app
WORKDIR /app
COPY . src/ 
RUN cd src && \
    npm install --unsafe-perm=true --silent && \
    node . middleware-bitcoin-blockprocessor && \
    node . middleware-bitcoin-rest && \
    node . middleware-bitcoin-balance-processor && \
    node . middleware-litecoin-blockprocessor
EXPOSE 8080
CMD pm2-docker start /mnt/config/${NETWORK_TYPE}/ecosystem.config.js
