FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN ./node_modules/.bin/tsc --version && chmod +x ./node_modules/.bin/tsc && npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]