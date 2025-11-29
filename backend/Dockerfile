FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json jest.config.js ./
COPY src ./src
COPY tests ./tests
RUN npm install && npm run build
EXPOSE 8080
CMD ["npm", "run", "start"]
