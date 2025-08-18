import { config } from '@data-lake/env'
import app from './app'
import { connectDatabase } from './database'

;(async () => {
	await connectDatabase()

	app.listen(config.PORT, () => {
		console.log(`HTTP Server running on port ${config.PORT}`)
		console.log('All routes registered successfully.')
	})
})()
