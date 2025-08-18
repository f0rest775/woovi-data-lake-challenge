import { TransactionModel } from '@data-lake/mongodb'
import { router } from '../router'

interface ITransactionBody {
	amount: number
	type: 'PIX_IN' | 'PIX_OUT'
}

router.post('/transaction', async (ctx, _next) => {
	const { amount, type } = <ITransactionBody>ctx.request.body

	if (!amount || amount <= 0) {
		ctx.status = 400
		ctx.body = { error: 'Amount must be greater than 0.' }
		return
	}

	if (!type || (type !== 'PIX_IN' && type !== 'PIX_OUT')) {
		ctx.status = 400
		ctx.body = { error: 'Invalid type.' }
		return
	}

	const transaction = await new TransactionModel({
		type,
		amount,
		status: 'PENDING',
	}).save()

	ctx.status = 201
	ctx.body = {
		transactionId: String(transaction._id),
	}
})

export default router
