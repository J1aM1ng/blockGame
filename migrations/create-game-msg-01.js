"use strict";
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("GameMsgs", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    userId: {
      type: Sequelize.STRING,
    },
    level: {
      type: Sequelize.INTEGER,
    },
    score: {
      type: Sequelize.INTEGER,
    },
    time: {
      type: Sequelize.TIME,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  });
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("GameMsgs");
}
