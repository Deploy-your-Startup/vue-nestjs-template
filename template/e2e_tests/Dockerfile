FROM node:24-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci && npx playwright install --with-deps --only-shell chromium && rm -rf /var/lib/apt/lists/* /root/.npm/_cacache && mkdir /reports
COPY . .
CMD ["npm", "test"]
