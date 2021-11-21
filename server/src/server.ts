import Koa from 'koa'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import { createConnection } from 'typeorm'
import 'reflect-metadata'
import jwt from 'koa-jwt'

import { logger } from './logger'
import { protectedRouter, unprotectedRouter } from './routes'
import { JWT_SECRET } from './constants'

createConnection()
  .then(() => {
    // 初始化 Koa 应用实例
    const app = new Koa()

    // 注册中间件(跨域中间件和请求体解析中间件及其他中间件)
    app.use(logger())
    app.use(cors())
    app.use(bodyParser())

    // 错误处理中间件
    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        // 只返回 JSON 格式的响应
        ctx.status = err.status || 500
        ctx.body = { message: err.message }
      }
    })

    // 响应用户请求
    // 调用 router 对象的 routes 方法获取到对应的 Koa 中间件，
    // 还调用了 allowedMethods 方法注册了 HTTP 方法检测的中间件，
    // 这样当用户通过不正确的 HTTP 方法访问 API 时，就会自动返回 405 Method Not Allowed 状态码

    // 无需 JWT Token 即可访问
    app.use(unprotectedRouter.routes()).use(unprotectedRouter.allowedMethods())

    // 注册 JWT 中间件
    app.use(jwt({ secret: JWT_SECRET }).unless({ method: 'GET' }))

    // 需要 JWT Token 才可访问
    app.use(protectedRouter.routes()).use(protectedRouter.allowedMethods())

    // 在 JWT 中间件注册完毕后，如果用户请求携带了有效的 Token，
    // 后面的 protectedRouter 就可以通过 ctx.state.user 获取到 Token 的内容
    //（更精确的说法是 Payload，负载，一般是用户的关键信息，例如 ID）了；反之，如果 Token 缺失或无效，
    // 那么 JWT 中间件会直接自动返回 401 错误

    // 运行服务器
    app.listen(3000, () => console.log('----------Server Started----------'))
  })
  .catch((err: string) => console.log('TypeORM connection error:', err))
