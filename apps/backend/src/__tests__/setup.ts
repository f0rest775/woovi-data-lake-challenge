import mongoose from '@data-lake/mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoServer: MongoMemoryServer

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create()
	const mongoUri = mongoServer.getUri()

	await mongoose.connect(mongoUri)
})

afterAll(async () => {
	await mongoose.connection.dropDatabase()
	await mongoose.connection.close()
	await mongoServer.stop()
})

afterEach(async () => {
	const collections = mongoose.connection.collections
	for (const key in collections) {
		const collection = collections[key]
		await collection.deleteMany({})
	}
})
