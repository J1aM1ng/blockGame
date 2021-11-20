import { Router } from "express";
let router = Router();
import { GameUser, GameMsg } from "../models";
import { fn, col } from "sequelize";
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

//新增/更新数据
router.post("/", async function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  const { usernamedata, level, scoredata, timedata } = req.body;
  console.log(usernamedata);
  if (usernamedata == "")
    return res.send({ msg: "请登陆后游戏数据才能记录!", resultCode: 300 });

  const model1 = await GameUser.findOne({
    where: { username: usernamedata },
  });

  const model2 = await GameMsg.findOne({
    where: { userId: model1.id, level },
  });
  if (model2) {
    if (scoredata > model2.score)
      model2.update({
        userId: model1.id,
        level,
        score: scoredata,
        time: timedata,
      });
    else if (scoredata == model2.score && timedata < model2.time) {
      model2.update({
        userId: model1.id,
        level,
        score: scoredata,
        time: timedata,
      });
    }
    // res.json({model2: model2});
    return res.send({ msg: "更新成功!", resultCode: 200 });
  } else {
    let gameMsgs = await GameMsg.create({
      userId: model1.id,
      level,
      score: scoredata,
      time: timedata,
    });
    // res.json({gameMsgs: gameMsgs})
    return res.send({ msg: "新增成功!", resultCode: 200 });
  }
});

//查询自己的游戏记录
router.post("/rank/user", async function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  const { username } = req.body;

  const model1 = await GameUser.findOne({
    where: { username: username },
  });

  const model2 = await GameMsg.findAll({
    where: { userId: model1.id },
    order: [["level", "ASC"]],
  });

  return res.json({ model2: model2 });
});

//查询前八的记录
router.get("/rank", async function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  //表进行关联
  GameMsg.belongsTo(GameUser, {
    foreignKey: "userId",
    targetKey: "id",
  });

  const model3 = await GameMsg.findAll({
    group: "userId",
    attributes: [
      [fn("SUM", col("score")), "sum_score"],
      [fn("SUM", col("time")), "sum_time"],
    ],
    include: [
      {
        attributes: ["username"],
        model: GameUser,
      },
    ],
    // order: [['sum_score', 'DESC'],['sum_time']],
  });
  //对表按照key1字段降序，当key1字段相同时，key2字段升序排序
  function sortByKey(array, key1, key2) {
    return array.sort(function (a, b) {
      let x = Number(a.get(key1));
      let y = Number(b.get(key1));
      // console.log(x+";"+y)
      return x > y ? -1 : x < y ? 1 : a.get(key2) < b.get(key2) ? -1 : 1;
    });
  }
  const model4 = sortByKey(model3, "sum_score", "sum_time");

  return res.json({ model4: model4 });
});

export default router;
