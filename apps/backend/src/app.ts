import cors from 'kcors'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import logger from 'koa-logger'
import { router } from './router'
import './routes'

const app = new Koa()

app.use(cors({ origin: '*' }))

app.use(logger())
app.use(bodyParser())

app.use(router.routes())
app.use(router.allowedMethods())

export default app
