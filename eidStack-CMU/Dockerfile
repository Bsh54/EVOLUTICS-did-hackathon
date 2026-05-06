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
RUN npm install --legacy-peer-deps

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
