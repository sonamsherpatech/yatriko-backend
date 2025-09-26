import { Table, Column, Model, DataType, HasMany } from "sequelize-typescript";
import UserProvider from "../../../../extra/user-providers-model";

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
    allowNull: true,
  })
  declare password: string;

  @Column({
    type: DataType.ENUM("tourist", "super-admin", "organization", "guide"),
    defaultValue: "tourist",
  })
  declare role: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare currentOrganizationNumber: string;

  // @HasMany(() => UserProvider)
  // declare providers: UserProvider[];
}

export default User;
