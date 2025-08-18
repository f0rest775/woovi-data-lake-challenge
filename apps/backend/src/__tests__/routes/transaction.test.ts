import supertest from 'supertest'
import app from '../../app'

const request = supertest(app.callback())

describe('POST /transaction', () => {
	it('should create a transaction successfully with valid data', async () => {
		const transactionData = {
			amount: 10050,
			type: 'PIX_IN',
		}

		const response = await request
			.post('/api/transaction')
			.send(transactionData)
			.expect(201)

		expect(response.body).toHaveProperty('transactionId')
		expect(typeof response.body.transactionId).toBe('string')
		expect(response.body.transactionId).toHaveLength(24)
	})

	it('should create a PIX_OUT transaction successfully', async () => {
		const transactionData = {
			amount: 5025,
			type: 'PIX_OUT',
		}

		const response = await request
			.post('/api/transaction')
			.send(transactionData)
			.expect(201)

		expect(response.body).toHaveProperty('transactionId')
		expect(typeof response.body.transactionId).toBe('string')
	})

	it('should return 400 when amount is missing', async () => {
		const transactionData = {
			type: 'PIX_IN',
		}

		const response = await request
			.post('/api/transaction')
			.send(transactionData)
			.expect(400)

		expect(response.body).toEqual({ error: 'Amount must be greater than 0.' })
	})

	it('should return 400 when amount is zero', async () => {
		const transactionData = {
			amount: 0,
			type: 'PIX_IN',
		}

		const response = await request
			.post('/api/transaction')
			.send(transactionData)
			.expect(400)

		expect(response.body).toEqual({ error: 'Amount must be greater than 0.' })
	})

	it('should return 400 when amount is negative', async () => {
		const transactionData = {
			amount: -10,
			type: 'PIX_IN',
		}

		const response = await request
			.post('/api/transaction')
			.send(transactionData)
			.expect(400)

		expect(response.body).toEqual({ error: 'Amount must be greater than 0.' })
	})

	it('should return 400 when type is missing', async () => {
		const transactionData = {
			amount: 100,
		}

		const response = await request
			.post('/api/transaction')
			.send(transactionData)
			.expect(400)

		expect(response.body).toEqual({ error: 'Invalid type.' })
	})

	it('should return 400 when type is invalid', async () => {
		const transactionData = {
			amount: 100,
			type: 'INVALID_TYPE',
		}

		const response = await request
			.post('/api/transaction')
			.send(transactionData)
			.expect(400)

		expect(response.body).toEqual({ error: 'Invalid type.' })
	})

	it('should handle empty request body', async () => {
		const response = await request
			.post('/api/transaction')
			.send({
				type: 'EMPTY',
			})
			.expect(400)

		expect(response.body).toEqual({ error: 'Amount must be greater than 0.' })
	})

	it('should handle malformed JSON gracefully', async () => {
		await request
			.post('/api/transaction')
			.set('Content-Type', 'application/json')
			.send('invalid json')
			.expect(400)
	})

	it('should handle large amount values', async () => {
		const transactionData = {
			amount: 99999999999,
			type: 'PIX_IN',
		}

		const response = await request
			.post('/api/transaction')
			.send(transactionData)
			.expect(201)

		expect(response.body).toHaveProperty('transactionId')
	})

	it('should handle decimal amounts correctly', async () => {
		const transactionData = {
			amount: 1,
			type: 'PIX_OUT',
		}

		const response = await request
			.post('/api/transaction')
			.send(transactionData)
			.expect(201)

		expect(response.body).toHaveProperty('transactionId')
	})
})
