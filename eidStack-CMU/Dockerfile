# syntax=docker/dockerfile:1
FROM node:18.17.1-bullseye

# Installer les dépendances système nécessaires pour les bibliothèques cryptographiques de Credo-TS / Hyperledger Aries Askar / Indy
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libssl-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Installer les dépendances
# L'option --legacy-peer-deps est souvent requise pour credo-ts
# Timeouts/retries augmentés : le registre npm coupe parfois les connexions
# inactives depuis le réseau Docker Desktop, ce qui déclenche ERR_SOCKET_TIMEOUT
# Cache pré-rempli (.npm-cache-host, copié depuis le cache npm de l'hôte où
# l'install a déjà réussi) : évite quasi tout appel réseau, --prefer-offline
# n'ira sur le registre que pour les binaires natifs spécifiques à Linux.
COPY .npm-cache-host /root/.npm
RUN npm config set fetch-timeout 300000 \
    && npm config set fetch-retries 8 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm install --legacy-peer-deps --prefer-offline

# Générer le client Prisma
RUN npx prisma generate

# Copier le reste du code
COPY . .

# Construire l'application NestJS
RUN npm run build

# Exposer les ports de l'API (4000) et de l'agent DIDComm (3021)
EXPOSE 4000 3021

# Script de démarrage qui lance les migrations puis l'application
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
