FROM golang:1.25-alpine AS builder

WORKDIR /app
COPY . .
WORKDIR /app/network-graph-api

RUN go mod download

RUN go build -o main .

FROM alpine:latest
WORKDIR /root/

COPY --from=builder /app/network-graph-api/main .

EXPOSE 8080

CMD ["./main"]