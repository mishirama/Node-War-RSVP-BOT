FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.js ./index.js
COPY --from=builder /app/config.json ./config.json
COPY --from=builder /app/rsvp_data.json ./rsvp_data.json
COPY --from=builder /app/siege_data.json ./siege_data.json

EXPOSE 3000

CMD ["node", "index.js"]
