"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class GameMsg extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  GameMsg.init(
    {
      userId: DataTypes.STRING,
      level: DataTypes.INTEGER,
      score: DataTypes.INTEGER,
      time: DataTypes.TIME,
    },
    {
      sequelize,
      modelName: "GameMsg",
    }
  );
  return GameMsg;
};
