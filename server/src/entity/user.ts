// src/entity/user.ts 存放用户数据模型
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

// TypeORM 通过装饰器这种优雅的方式来将我们的 User 类映射到数据库中的表
// Entity 用于装饰整个类，使其变成一个数据库模型
// Column 用于装饰类的某个属性，使其对应于数据库表中的一列，可提供一系列选项参数，
// 例如我们给 password 设置了 select: false ，使得这个字段在查询时默认不被选中
// PrimaryGeneratedColumn 则是装饰主列，它的值将自动生成
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: Number

  @Column()
  name: string

  @Column({ select: false })
  password: string

  @Column()
  email: string
}
