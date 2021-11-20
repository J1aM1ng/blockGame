let express = require("express");
let router = express.Router();
let models = require("../models");

//注册
router.post("/", async function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  const { telephone, username, password } = req.body;

  let checktelephone = /^[0-9]{11}$/;
  let checkusername = /^[a-zA-Z0-9]{3,9}$/;

  if (checktelephone.test(telephone) === false)
    return res.send({ msg: "输入的手机号不符合规范!", resultCode: 400 });
  if (checkusername.test(username) === false)
    return res.send({ msg: "输入的用户名不符合规范!", resultCode: 400 });

  const model = await models.GameUser.findOne({ where: { username } });
  console.log(model);
  if (model) {
    return res.send({ msg: "用户名已经存在已存在！", resultCode: 300 });
  } else {
    let gameusers = await models.GameUser.create(req.body);
    return res.send({ msg: "注册成功!请登录开始游戏！", resultCode: 200 });
  }
});

//登录
router.post("/login", async function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  const { username, password } = req.body;
  const model = await models.GameUser.findOne({
    where: { username, password },
  });
  if (!model) {
    return res.send({ msg: "用户名或密码错误!", resultCode: 400 });
  }

  return res.send({ msg: "登录成功!", resultCode: 200, username });
});

module.exports = router;
