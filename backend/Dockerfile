# Build stage
FROM golang@sha256:3b2f2c1e5e5c4c7b5b3d5d8f8b8e2e4e5e6e7e8e9f0a1b2c3d4e5f6a7b8c9d0 AS builder
WORKDIR /app
COPY go.mod .
RUN go mod download
COPY . .
RUN go build -o ticket-app

# Run stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/ticket-app .
EXPOSE 8080
CMD ["./ticket-app"]