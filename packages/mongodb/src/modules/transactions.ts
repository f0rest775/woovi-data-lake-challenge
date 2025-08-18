import mongoose, { type Document, type Model } from 'mongoose'

const transactionSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			enum: ['PIX_IN', 'PIX_OUT'],
			required: true,
		},
		amount: {
			type: Number,
			required: true,
			min: 0,
		},
		status: {
			type: String,
			enum: ['PENDING', 'COMPLETED', 'FAILED'],
			default: 'PENDING',
		},
		createdAt: {
			type: Date,
			default: Date.now,
			immutable: true,
		},
	},
	{
		timestamps: false,
	},
)

transactionSchema.index({ createdAt: -1 })
transactionSchema.index({ type: 1, status: 1 })

export interface ITransaction extends Document {
	type: 'PIX_IN' | 'PIX_OUT'
	amount: number
	status: 'PENDING' | 'COMPLETED' | 'FAILED'
	createdAt: Date
}

export const TransactionModel: Model<ITransaction> =
	mongoose.models.Transaction ||
	mongoose.model('Transaction', transactionSchema)
