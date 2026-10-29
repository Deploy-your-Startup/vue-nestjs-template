FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci && npx playwright install --with-deps chromium && mkdir /reports
COPY . .
CMD ["npm", "test"]
