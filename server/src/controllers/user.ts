// src/controllers/user.ts
import { Context } from 'koa'
import { getManager } from 'typeorm'

import { User } from '../entity/user'
import { NotFoundException, ForbiddenException } from '../exceptions'

// TypeORM 中操作数据模型主要是通过 Repository 实现的，
// 在 Controller 中，可以通过 getManager().getRepository(Model) 来获取到，
// 之后 Repository 的查询 API 就与其他的库很类似了。
export default class UserController {
  public static async listUsers(ctx: Context) {
    const userRepository = getManager().getRepository(User)
    const users = await userRepository.find()

    ctx.status = 200
    ctx.body = users
  }

  public static async showUserDetail(ctx: Context) {
    const userRepository = getManager().getRepository(User)
    const user = await userRepository.findOne(+ctx.params.id)

    if (user) {
      ctx.status = 200
      ctx.body = user
    } else {
      throw new NotFoundException()
    }
  }

  public static async updateUser(ctx: Context) {
    const userId = +ctx.params.id

    if (userId !== +ctx.state.user.id) {
      // 鉴权，需确认是用户本人在操作
      // 通过比较 ctx.params.id 和 ctx.state.user.id 是否相同，
      // 如果不相同则返回 403 Forbidden 错误，相同则继续执行相应的数据库操作
      throw new ForbiddenException()
    }

    const userRepository = getManager().getRepository(User)
    await userRepository.update(userId, ctx.request.body)
    const updatedUser = await userRepository.findOne(userId)

    if (updatedUser) {
      ctx.status = 200
      ctx.body = updatedUser
    } else {
      ctx.status = 404
    }
  }

  public static async deleteUser(ctx: Context) {
    const userId = +ctx.params.id

    if (userId !== +ctx.state.user.id) {
      // 鉴权，需确认是用户本人在操作
      // 通过比较 ctx.params.id 和 ctx.state.user.id 是否相同，
      // 如果不相同则返回 403 Forbidden 错误，相同则继续执行相应的数据库操作
      throw new ForbiddenException()
    }

    const userRepository = getManager().getRepository(User)
    await userRepository.delete(userId)

    ctx.status = 204
  }
}
