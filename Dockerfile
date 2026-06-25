# syntax=docker/dockerfile:1

# ---- Build-Stage: SPA mit Vite bauen ----
FROM node:20-alpine AS build
WORKDIR /app

# Abhängigkeiten reproduzierbar installieren (nutzt den npm-Cache-Layer)
COPY package.json package-lock.json ./
RUN npm ci

# Quellcode kopieren und Produktionsbuild erzeugen
COPY . .
RUN npm run build

# ---- Runtime-Stage: statisches Ausliefern via nginx ----
FROM nginx:1.27-alpine AS runtime

# Eigene nginx-Konfiguration (Port 8080, gzip, Caching)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Gebautes SPA-Bundle übernehmen
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

# nginx als unprivilegierter Prozess auf Port 8080 (kein root nötig)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
