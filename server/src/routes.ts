// src/routes.ts
import Router from '@koa/router'

import AuthController from './controllers/auth'
import UserController from './controllers/user'

// 不需要保护的路由
const unprotectedRouter = new Router()

// auth 相关的路由
// 登录（获取 JWT Token）
unprotectedRouter.post('/auth/login', AuthController.login)
// 注册用户
unprotectedRouter.post('/auth/register', AuthController.register)

// JWT 中间件保护的路由
const protectedRouter = new Router()

// users 相关的路由
// 查询所有的用户
protectedRouter.get('/users', UserController.listUsers)
// 查询单个用户（对应id的用户）
protectedRouter.get('/users/:id', UserController.showUserDetail)
// 更新单个用户（对应id的用户）
protectedRouter.put('/users/:id', UserController.updateUser)
// 删除单个用户（对应id的用户）
protectedRouter.delete('/users/:id', UserController.deleteUser)
// 由于需要注册为中间件，故需导出
export { unprotectedRouter, protectedRouter }
