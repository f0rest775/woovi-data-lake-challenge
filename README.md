# Sistema de Processamento de Transações PIX

## Visão Geral

Um sistema de processamento de dados em tempo real projetado para capturar, transformar e analisar transações PIX. O sistema utiliza uma arquitetura orientada a eventos que garante alta performance, escalabilidade e processamento em tempo real de grandes volumes de transações financeiras.

### Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │    │                 │
│   HTTP Client   │───▶│   Backend API   │───▶│     MongoDB     │───▶│  Change Stream  │
│   (Requests)    │    │   (Koa.js)      │    │   (Primary)     │    │   (Pipeline)    │
│                 │    │                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                                                   │
                                                                                   ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │    │                 │
│   Dashboard     │◀───│   ClickHouse    │◀───│   Data Sink     │◀───│  Transformer    │
│(ClickHousePlay) │    │   (OLAP DB)     │    │   (Batch)       │    │   (Stream)      │
│                 │    │                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘

Fluxo de Dados:
1. Cliente envia requisição HTTP → Backend API
2. API valida e salva transação → MongoDB
3. MongoDB Change Stream detecta mudanças → Pipeline
4. Pipeline processa dados em batches → ClickHouse
5. ClickHouse disponibiliza dados → Analytics/Dashboard (ClickHouse Play)
```

## Funcionalidades Principais

### 1. **API de Transações**
- **Endpoint**: `POST /api/transaction`
- **Validação**: Campos obrigatórios e tipos de dados
- **Performance**: Suporta alta concorrência (testado com 1000+ RPS)
- **Monitoramento**: Logs estruturados e métricas de performance

### 2. **Processamento em Tempo Real**
- **Change Streams**: Captura mudanças no MongoDB instantaneamente
- **Pipeline de Transformação**: Processa dados em batches configuráveis
- **Resiliência**: Sistema de retry automático com backoff exponencial
- **State Management**: Controle de estado para recuperação de falhas

### 3. **Analytics OLAP**
- **ClickHouse**: Banco de dados colunar otimizado para consultas analíticas
- **Agregações**: Contadores por tipo de transação, período temporal
- **Performance**: Consultas sub-segundo em milhões de registros
- **Escalabilidade**: Suporte a sharding e clustering

## Casos de Uso

### 1. **Processamento de Transações PIX**
```typescript
// Exemplo de transação PIX_IN
{
  "type": "PIX_IN",
  "amount": 15000,
  "status": "PENDING"
}

// Exemplo de transação PIX_OUT
{
  "type": "PIX_OUT", 
  "amount": 8500,
  "status": "COMPLETED"
}
```

### 2. **Analytics em Tempo Real**
```sql
-- Transações do dia atual
SELECT 
    countIf(type = 'PIX_IN') as pix_in_count,
    countIf(type = 'PIX_OUT') as pix_out_count,
    count() as total_transactions
FROM pix_analytics.transactions
WHERE toDate(created_at) = today()

-- Transações da semana atual
SELECT 
    countIf(type = 'PIX_IN') as pix_in_count,
    countIf(type = 'PIX_OUT') as pix_out_count,
    count() as total_transactions
FROM pix_analytics.transactions
WHERE toStartOfWeek(created_at) = toStartOfWeek(today())

-- Transações do mês atual
SELECT 
    countIf(type = 'PIX_IN') as pix_in_count,
    countIf(type = 'PIX_OUT') as pix_out_count,
    count() as total_transactions
FROM pix_analytics.transactions
WHERE toStartOfMonth(created_at) = toStartOfMonth(today())

-- Volume financeiro por dia (últimos 30 dias)
SELECT 
    toDate(created_at) as day,
    sumIf(amount, type = 'PIX_IN') / 100 as inbound_volume_reais,
    sumIf(amount, type = 'PIX_OUT') / 100 as outbound_volume_reais,
    count() as total_transactions
FROM pix_analytics.transactions
WHERE created_at >= today() - 30
GROUP BY day
ORDER BY day
```

### 3. **Testes de Carga**
```bash
# Teste de carga com K6
k6 run --env API_URL=http://localhost:3333/api k6.js
```

## Como Utilizar

### Pré-requisitos
- **Node.js** >= 18
- **Docker** e **Docker Compose**
- **pnpm** (gerenciador de pacotes)

### 1. **Configuração do Ambiente**

```bash
# Clonar o repositório
git clone <repository-url>
cd data-lake

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
```

### 2. **Inicializar Infraestrutura**

```bash
# Subir serviços (MongoDB, Redis, ClickHouse)
pnpm compose:up

# Aguardar inicialização (30-60 segundos)
# MongoDB: http://localhost:27017
# ClickHouse: http://localhost:8123
# ClickHouse Play UI: http://localhost:8123/play (user: clickhouse, senha: clickhouse123)
# Redis: http://localhost:6379
```

### 3. **Executar Aplicações**

```bash
# Modo desenvolvimento (watch mode)
pnpm dev

# Ou executar individualmente:
# Backend API
cd apps/backend && pnpm dev

# Change Stream Pipeline  
cd apps/change-stream && pnpm dev
```

### 4. **Testar API**

```bash
# Criar transação PIX
curl -X POST http://localhost:3333/api/transaction \
  -H "Content-Type: application/json" \
  -d '{"type": "PIX_IN", "amount": 10000}'

# Resposta esperada:
# {"transactionId": "507f1f77bcf86cd799439011"}
```

### 5. **Consultar Analytics**

```bash
# Opção 1: ClickHouse Play UI (Recomendado)
# Acesse: http://localhost:8123/play
# Usuário: clickhouse
# Senha: clickhouse123
# Cole as consultas SQL diretamente na interface

# Opção 2: Linha de comando
docker exec -it pix-clickhouse clickhouse-client

# Verificar dados
SELECT count() FROM pix_analytics.transactions;
```

## Arquitetura Técnica

### **Backend API (Koa.js)**
- **Framework**: Koa.js com TypeScript
- **Middleware**: CORS, body parser, logging
- **Testes**: Jest

### **Change Stream Pipeline** 
- **Tecnologia**: Node.js Streams + MongoDB Change Streams
- **Processamento**: Batches configuráveis (1000 registros/2s)
- **Concorrência**: Limitador de concorrência (p-limit)
- **Resiliência**: Retry automático com jitter

### **Bancos de Dados**

#### **MongoDB (OLTP)**
- **Versão**: 7.0 com Replica Set
- **Índices**: Otimizados para consultas por data e tipo
- **Change Streams**: Habilitados para captura de eventos

#### **ClickHouse (OLAP)**
- **Versão**: Latest
- **Engine**: MergeTree otimizado para séries temporais
- **Particionamento**: Por data para consultas eficientes
- **Compressão**: LZ4 para economia de espaço

#### **Redis (Cache/Estado)**
- **Versão**: 7.2 Alpine
- **Uso**: Cache de estado do pipeline

## Idempotência e Deduplicação

### **ReplacingMergeTree Engine**
O sistema implementa idempotência através do **ReplacingMergeTree** do ClickHouse:

- **Chave única**: ID do MongoDB (`ORDER BY (id)`)
- **Versioning**: Campo `_version` com timestamp único
- **Deduplicação automática**: ClickHouse remove duplicatas em background
- **Performance**: Sem overhead nas inserções

### **Como Funciona**
```sql
-- Schema com ReplacingMergeTree
CREATE TABLE transactions (
  id String,              -- ID único do MongoDB (chave primária)
  type Enum8,
  amount Int64,           -- Valores em centavos
  status Enum8,
  created_at DateTime64(3),
  operation_type Enum8,
  operation_timestamp DateTime64(3),
  _version UInt64         -- Versão para controle de duplicatas
) ENGINE = ReplacingMergeTree(_version)
ORDER BY (id)             -- Idempotência pelo ID
```


## Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev                # Executar em modo desenvolvimento
pnpm build             # Build de produção
pnpm test              # Executar testes
pnpm format            # Formatação de código

# Infraestrutura
pnpm compose:up        # Subir containers
pnpm compose:down      # Parar containers

# Testes de carga
k6 run k6.js           # Executar testes de performance
```
