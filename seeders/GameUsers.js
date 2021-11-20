"use strict";

export async function up(queryInterface, Sequelize) {
  return queryInterface.bulkInsert("GameUsers", [
    {
      username: "czc",
      password: "czc31902009",
      telephone: 18157732377,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      username: "hyh",
      password: "hyh31902018",
      telephone: 11111111111,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}
export async function down(queryInterface, Sequelize) {
  return queryInterface.bulkDelete("GameUsers", null, {});
}
