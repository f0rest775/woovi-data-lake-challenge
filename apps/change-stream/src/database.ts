import mongoose from '@data-lake/mongodb'

import { config } from './config'

async function connectDatabase() {
	mongoose.connection.on('close', () =>
		console.log('Database connection closed.'),
	)

	mongoose.connection.on('error', (error) =>
		console.error('Database connection error:', error),
	)

	mongoose.connection.on('open', () =>
		console.log('Database connection established.'),
	)

	await mongoose.connect(config.MONGO_URL)
}

export { connectDatabase }
