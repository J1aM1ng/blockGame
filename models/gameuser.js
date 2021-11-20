"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class GameUser extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  GameUser.init(
    {
      username: DataTypes.STRING,
      password: DataTypes.STRING,
      telephone: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "GameUser",
    }
  );
  return GameUser;
};
