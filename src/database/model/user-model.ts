import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "users",
  modelName: "User",
  timestamps: true,
})
class User extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
  })
  declare username: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.ENUM("tourist", "super-admin", "organization", "guide"),
    defaultValue: "tourist",
  })
  declare role: string;
}

export default User;
