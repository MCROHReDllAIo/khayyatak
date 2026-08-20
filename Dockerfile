FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json .npmrc* ./
RUN npm ci --include=dev

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["npm", "run", "start"]
