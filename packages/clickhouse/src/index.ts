import { createClient } from '@clickhouse/client'
import { config } from '@data-lake/env'

export const clickHouseClient = createClient({
	url: config.CLICKHOUSE_URL,
	username: config.CLICKHOUSE_USERNAME,
	password: config.CLICKHOUSE_PASSWORD,
	database: config.CLICKHOUSE_DB,
})

export async function createTables() {
	try {
		await clickHouseClient.exec({
			query: 'CREATE DATABASE IF NOT EXISTS pix_analytics',
		})

		await clickHouseClient.exec({
			query: `
        CREATE TABLE IF NOT EXISTS pix_analytics.transactions (
          id String,
          type Enum8('PIX_IN' = 1, 'PIX_OUT' = 2),
          amount Int64,
          status Enum8('PENDING' = 1, 'COMPLETED' = 2, 'FAILED' = 3),
          created_at DateTime64(3),
          operation_type Enum8('insert' = 1, 'update' = 2, 'delete' = 3),
          operation_timestamp DateTime64(3) DEFAULT now64(),
          _version UInt64
        ) ENGINE = ReplacingMergeTree(_version)
        ORDER BY (id)
        PARTITION BY toYYYYMM(created_at)
        SETTINGS index_granularity = 8192
      `,
		})

		console.log('ClickHouse tables created successfully')
	} catch (error) {
		console.error('Error creating ClickHouse tables:', error)
		throw error
	}
}
