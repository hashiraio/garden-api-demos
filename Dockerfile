# builder
FROM oven/bun:latest AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y git python3 make g++ && rm -rf /var/lib/apt/lists/*
ARG GHPAT
ENV PYTHON=/usr/bin/python3
COPY package.json bun.lock* ./
RUN sed -i "s|git+ssh://git@github.com/hashiraio/|git+https://${GHPAT}@github.com/hashiraio/|g" package.json && \
    sed -i "s|git@github.com:hashiraio/|https://${GHPAT}@github.com/hashiraio/|g" package.json && \
    sed -i "s|git+https://github.com/hashiraio/|git+https://${GHPAT}@github.com/hashiraio/|g" package.json
RUN bun install
COPY . .
# no separate build step if running TS in runtime

# production
FROM oven/bun:latest AS production
WORKDIR /app
# Copy only runtime files + node_modules from builder
COPY --from=builder /app/package.json ./ 
COPY --from=builder /app/bun.lock* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
CMD ["bun", "src/index.ts"]