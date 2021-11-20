//简单关卡地形图
let simpleLevelPlan = `
......................
..#................#..
..#..............=.#..
..#.........o.o....#..
..#.@......#####...#..
..#####............#..
......#++++++++++++#..
......##############..
......................`;
let hp = 100; //血量
let scoremaxArr = [1025, 130, 135, 240, 135, 185, 165];
let levelglobal; // 当前关卡
let globalID; // 动画任务id
//显示当前时间、当前血量、各个关卡的通关时间以及通关血量
let nowtime = new Date();
function format_time(sec) {
  return [parseInt(sec / 3600), parseInt((sec / 60) % 60), sec % 60]
    .join(":")
    .replace(/\b(\d)\b/g, "0$1");
}

function showtime() {
  let elt = document.getElementById("timeConsuming");
  // console.log(elt);
  let now = new Date() - nowtime;
  elt.innerHTML = format_time(Math.ceil(now / 1000));
  setTimeout(showtime, 1000); // 在1秒后再次执行
}
function showhp(level) {
  let HP = document.getElementById("HP");
  // console.log(HP);
  HP.children[0].innerHTML = `HP:${hp}`;
  HP.children[1].style.width = `${(hp / scoremaxArr[level]) * 100}%`;
  // console.log(hp/scoremaxArr[level]*100);
}
function delay() {
  //放置堆栈爆掉就这么写了
  showhp(levelglobal);
  setTimeout(delay, 1000);
}

window.onload = function () {
  // 当onload事件发生时开始显示时间和实时更新血量
  showtime();
  delay();
};

//存储关卡对象
let Level = class Level {
  constructor(plan) {
    let rows = plan
      .trim()
      .split("\n")
      .map((l) => [...l]); //地形图的行
    this.height = rows.length;
    this.width = rows[0].length;
    this.startActors = [];

    //将背景网格与可移动元素actor分离开来
    this.rows = rows.map((row, y) => {
      return row.map((ch, x) => {
        let type = levelChars[ch];
        if (typeof type == "string") return type;
        this.startActors.push(type.create(new Vec(x, y), ch));
        return "empty";
      });
    });
  }
};

//记录游戏的状态
let State = class State {
  constructor(level, actors, status) {
    this.level = level;
    this.actors = actors;
    this.status = status; //游戏结束后，status将切换为lost或won
  }

  static start(level) {
    return new State(level, level.startActors, "playing");
  }

  get player() {
    return this.actors.find((a) => a.type == "player");
  }
};

let Vec = class Vec {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  plus(other) {
    return new Vec(this.x + other.x, this.y + other.y);
  }
  times(factor) {
    //速度矢量乘以时间间隔获得在此期间的行进距离
    return new Vec(this.x * factor, this.y * factor);
  }
};

//玩家对象
let Player = class Player {
  constructor(pos, speed) {
    this.pos = pos; //保存相对于元素左上角的坐标
    this.speed = speed; //存储速度以模拟动量和重力
  }

  get type() {
    return "player";
  }

  static create(pos) {
    return new Player(pos.plus(new Vec(0, -0.5)), new Vec(0, 0));
  }
};

Player.prototype.size = new Vec(0.8, 1.5);

//岩浆对象
let Lava = class Lava {
  constructor(pos, speed, reset) {
    this.pos = pos; //保存相对于元素左上角的坐标
    this.speed = speed; //存储速度以模拟动量和重力
    this.reset = reset; //有则遇到障碍物重置位置 无则遇到障碍物反转速度向另一个方向移动
  }

  get type() {
    return "lava";
  }

  static create(pos, ch) {
    if (ch == "=") {
      //左右移动的岩浆
      return new Lava(pos, new Vec(2, 0));
    } else if (ch == "|") {
      //上下移动的岩浆
      return new Lava(pos, new Vec(0, 2));
    } else if (ch == "v") {
      //上下移动遇到障碍物重置位置的岩浆
      return new Lava(pos, new Vec(0, 3), pos);
    }
  }
};

Lava.prototype.size = new Vec(1, 1); //岩浆大小1x1

//金币对象
let Coin = class Coin {
  constructor(pos, basePos, wobble) {
    this.pos = pos;
    this.basePos = basePos;
    this.wobble = wobble; //轻微垂直往复运动
  }

  get type() {
    return "coin";
  }

  static create(pos) {
    let basePos = pos.plus(new Vec(0.2, 0.1));
    return new Coin(basePos, basePos, Math.random() * Math.PI * 2); //为了避免所有硬币都同步上下移动的情况，起始阶段随机
  }
};

Coin.prototype.size = new Vec(0.6, 0.6);

// //怪兽对象
// let Monster = class Monster {
//   constructor(pos, speed) {
//     this.pos = pos;//保存相对于元素左上角的坐标
//     this.speed = speed;//存储速度以模拟动量和重力
//   }

//   get type() { return "Monster"; }

//   static create(pos) {
//     return new Monster(pos, new Vec(4, 0));
//   }
// }

// Monster.prototype.size = new Vec(1, 4)

let levelChars = {
  ".": "empty",
  "#": "wall",
  "+": "lava", //空 墙 不动的岩浆
  "@": Player,
  o: Coin, //玩家 金币
  "=": Lava,
  "|": Lava,
  v: Lava, //左右 上下 上下(重置)
  // "M": Monster
};

let simpleLevel = new Level(simpleLevelPlan);

function elt(name, attrs, ...children) {
  let dom = document.createElement(name);
  for (let attr of Object.keys(attrs)) {
    dom.setAttribute(attr, attrs[attr]);
  }
  for (let child of children) {
    dom.appendChild(child);
  }
  return dom;
}

let DOMDisplay = class DOMDisplay {
  constructor(parent, level) {
    this.dom = elt("div", { class: "game" }, drawGrid(level));
    this.actorLayer = null;
    parent.appendChild(this.dom);
  }

  clear() {
    this.dom.remove();
  }
};

let scale = 20; //单个单位在屏幕上占用的像素数

//背景网格
function drawGrid(level) {
  return elt(
    "table",
    {
      class: "background",
      style: `width: ${level.width * scale}px`,
    },
    ...level.rows.map((row) =>
      elt(
        "tr",
        { style: `height: ${scale}px` },
        ...row.map((type) => elt("td", { class: type }))
      )
    )
  );
}

//可移动对象
function drawActors(actors) {
  return elt(
    "div",
    {},
    ...actors.map((actor) => {
      let rect = elt("div", { class: `actor ${actor.type}` });
      rect.style.width = `${actor.size.x * scale}px`;
      rect.style.height = `${actor.size.y * scale}px`;
      rect.style.left = `${actor.pos.x * scale}px`;
      rect.style.top = `${actor.pos.y * scale}px`;
      return rect;
    })
  );
}

DOMDisplay.prototype.syncState = function (state) {
  //syncState用于使显示器展开给定的状态，删除旧演员图形，重绘新演员图形
  if (this.actorLayer) this.actorLayer.remove();
  this.actorLayer = drawActors(state.actors);
  this.dom.appendChild(this.actorLayer);
  this.dom.className = `game ${state.status}`;
  this.scrollPlayerIntoView(state);
};

DOMDisplay.prototype.scrollPlayerIntoView = function (state) {
  //确保如果关卡延伸到视口外会滚动此视口以确保玩家位于中心位置
  let width = this.dom.clientWidth;
  let height = this.dom.clientHeight;
  let margin = width / 3;

  // The viewport
  let left = this.dom.scrollLeft,
    right = left + width;
  let top = this.dom.scrollTop,
    bottom = top + height;

  let player = state.player;
  let center = player.pos.plus(player.size.times(0.5)).times(scale);
  //当玩家太位于视口边缘时通过操作此元素的scrollleft和scrolltop属性来更改滚动位置
  if (center.x < left + margin) {
    this.dom.scrollLeft = center.x - margin;
  } else if (center.x > right - margin) {
    this.dom.scrollLeft = center.x + margin - width;
  }
  if (center.y < top + margin) {
    this.dom.scrollTop = center.y - margin;
  } else if (center.y > bottom - margin) {
    this.dom.scrollTop = center.y + margin - height;
  }
};

Level.prototype.touches = function (pos, size, type) {
  let xStart = Math.floor(pos.x);
  let xEnd = Math.ceil(pos.x + size.x);
  let yStart = Math.floor(pos.y);
  let yEnd = Math.ceil(pos.y + size.y);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = xStart; x < xEnd; x++) {
      let isOutside = x < 0 || x >= this.width || y < 0 || y >= this.height;
      let here = isOutside ? "wall" : this.rows[y][x];
      if (here == type) return true;
    }
  }
  return false;
};

//用于计算给定时间步后的新状态和位置
State.prototype.update = function (time, keys) {
  let actors = this.actors.map((actor) => actor.update(time, this, keys));
  let newState = new State(this.level, actors, this.status);

  if (newState.status != "playing") return newState;

  let player = newState.player;
  if (this.level.touches(player.pos, player.size, "lava")) {
    return new State(this.level, actors, "lost");
  }

  for (let actor of actors) {
    if (actor != player && overlap(actor, player)) {
      newState = actor.collide(newState);
    }
  }
  return newState;
};

//检测演员之间是否重叠,重叠返回true
function overlap(actor1, actor2) {
  return (
    actor1.pos.x + actor1.size.x > actor2.pos.x &&
    actor1.pos.x < actor2.pos.x + actor2.size.x &&
    actor1.pos.y + actor1.size.y > actor2.pos.y &&
    actor1.pos.y < actor2.pos.y + actor2.size.y
  );
}

//碰到岩浆扣血
Lava.prototype.collide = function (state) {
  hp--;
  if (hp <= 0) {
    // setTimeout(function(){for(let i=1;i<=100;i++){setTimeout(function(){hp++},100)}},600)

    // Delayer(hp=100,1000);
    return new State(state.level, state.actors, "lost");
  } else return new State(state.level, state.actors, "playing");
};

//实现在一定时间段内相同请求之执行一次
function Delayer(callback, delayTime) {
  this.callback = callback;
  this.count = 0;
  this.delayTime = delayTime;
}
Delayer.prototype.delay = function () {
  if (++this.count == 1) {
    let self = this;
    setTimeout(function () {
      try {
        self.callback();
      } catch (err) {
      } finally {
        //执行完后将值清空，保证下次还能执行
        self.count = 0;
      }
    }, this.delayTime);
  }
};
//碰到金币金币就消失,并加血，如果碰到的是最后一块金币则赢了
Coin.prototype.collide = function (state) {
  hp += 5;
  let filtered = state.actors.filter((a) => a != this);
  let status = state.status;
  if (!filtered.some((a) => a.type == "coin")) status = "won";
  return new State(state.level, filtered, status);
};

// //碰到怪兽头部怪兽消失，碰到怪兽其他位置玩家输了
// Monster.prototype.collide = function(state) {

//   return new State(state.level, state.actors, "lost");
// };

//岩浆移动的实现
Lava.prototype.update = function (time, state) {
  let newPos = this.pos.plus(this.speed.times(time));
  if (!state.level.touches(newPos, this.size, "wall")) {
    return new Lava(newPos, this.speed, this.reset);
  } else if (this.reset) {
    return new Lava(this.reset, this.speed, this.reset);
  } else {
    return new Lava(this.pos, this.speed.times(-1));
  }
};

// //怪兽移动的实现
// Monster.prototype.update = function(time, state) {
//   let newPos = this.pos.plus(this.speed.times(time));
//   if (!state.level.touches(newPos, this.size, "wall")) {
//     return new Monster(newPos, this.speed);
//   } else {
//     return new Monster(this.pos, this.speed.times(-1));
//   }
// };

//硬币震动的实现
let wobbleSpeed = 8,
  wobbleDist = 0.07;

Coin.prototype.update = function (time) {
  let wobble = this.wobble + time * wobbleSpeed;
  let wobblePos = Math.sin(wobble) * wobbleDist;
  return new Coin(
    this.basePos.plus(new Vec(0, wobblePos)),
    this.basePos,
    wobble
  );
};

//玩家碰撞移动的实现
let playerXSpeed = 7;
let gravity = 30;
let jumpSpeed = 17;

Player.prototype.update = function (time, state, keys) {
  let xSpeed = 0;
  if (keys.ArrowLeft) xSpeed -= playerXSpeed;
  if (keys.ArrowRight) xSpeed += playerXSpeed;
  let pos = this.pos;
  let movedX = pos.plus(new Vec(xSpeed * time, 0));
  if (!state.level.touches(movedX, this.size, "wall")) {
    pos = movedX;
  }

  let ySpeed = this.speed.y + time * gravity;
  let movedY = pos.plus(new Vec(0, ySpeed * time));
  if (!state.level.touches(movedY, this.size, "wall")) {
    pos = movedY;
  } else if (keys.ArrowUp && ySpeed > 0) {
    ySpeed = -jumpSpeed;
  } else {
    ySpeed = 0;
  }
  return new Player(pos, new Vec(xSpeed, ySpeed));
};

//跟踪按键
function trackKeys(keys) {
  let down = Object.create(null);
  function track(event) {
    if (keys.includes(event.key)) {
      down[event.key] = event.type == "keydown";
      event.preventDefault();
    }
  }

  window.addEventListener("keydown", track);
  window.addEventListener("keyup", track);

  return down;
}

let arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);

function runAnimation(frameFunc) {
  let lastTime = null;
  function frame(time) {
    if (lastTime != null) {
      let timeStep = Math.min(time - lastTime, 100) / 1000;
      if (frameFunc(timeStep) === false) return;
    }
    lastTime = time;
    globalID = requestAnimationFrame(frame);
  }
  globalID = requestAnimationFrame(frame);
}

function runLevel(level, Display) {
  let display = new Display(document.body, level);
  let state = State.start(level);
  let ending = 1;

  return new Promise((resolve) => {
    runAnimation((time) => {
      let designMapClick = document.getElementById("designMapClick");
      designMapClick.addEventListener("click", function () {
        if (isUserDesignedMap == true) {
          display.clear(); // 清除幕布
          resolve("end"); // 结束动画
        }
      });
      // console.log("f:",f);
      // console.log("flag:",flag);
      // if(f!==flag) { // 倘若动画终止了
      //   console.log("清除了");
      //   display.clear(); // 清除幕布
      //   resolve("end"); // 结束动画
      // }

      state = state.update(time, arrowKeys);
      let back = document.getElementById("back");
      let restart = document.getElementById("restart");
      let next = document.getElementById("next");

      restart.addEventListener("click", function () {
        state.status = "lost";
      });

      back.addEventListener("click", function () {
        if (level !== 0) {
          level--;
          state.status = "lost";
        }
      });

      next.addEventListener("click", function () {
        state.status = "lost";
      });

      display.syncState(state);
      if (state.status == "playing") {
        return true;
      }
      // else if (state.status == "pause") {
      //   return false;
      // }
      else if (ending > 0) {
        ending -= time;
        return true;
      } else {
        display.clear();
        nowtime = new Date();
        hp = 100;
        resolve(state.status);
        return false;
      }
    });
  });
}

async function runGame(plans, Display) {
  for (let level = 0; level < plans.length; ) {
    let back = document.getElementById("back");
    let next = document.getElementById("next");
    let rank = document.getElementById("rank");
    let login = document.getElementById("login");
    let register = document.getElementById("register");
    let btn_rank = document.getElementById("btn_rank");
    let btn_login = document.getElementById("btn_login");
    let btn_register = document.getElementById("btn_register");
    let btn_copyMap = document.getElementById("btn_copyMap");

    let islogin = document.getElementById("islogin");
    let zhuce = document.getElementById("zhuce");
    let denglu = document.getElementById("denglu");
    let myrank = document.getElementById("myrank");
    let rankbox = document.getElementById("rankbox");
    let shuaxin = document.getElementById("shuaxin");
    let tiaozhuandaozhuce = document.getElementById("tiaozhuandaozhuce");
    let chongzhi = document.getElementById("chongzhi");
    levelglobal = level;

    zhuce.addEventListener("click", function () {
      //处理因为短时间内连续点击登录按钮而多次调用接口
      let time = 0;
      if (time == 0) {
        time = 10; //设定间隔时间（秒）
        //启动计时器，倒计时time秒后自动关闭计时器。
        let index = setInterval(function () {
          time--;
          if (time == 0) {
            clearInterval(index);
          }
        }, 200);
        $.ajax({
          type: "POST",
          dataType: "json",
          url: "http://czc.jokeryang.site:55555/GameUsers",
          data: $("#register1").serialize(), //提交的数据
          success: function (result) {
            console.log(result); //打印服务端返回的数据(调试用)
            if (result.resultCode == 200) {
              register.className = "hide";
            }
            console.log(result.msg);
            alert(result.msg);
          },
          error: function () {
            alert("提交失败");
          },
        });
      }
    });

    denglu.addEventListener("click", function () {
      //处理因为短时间内连续点击登录按钮而多次调用接口
      let time = 0;
      if (time == 0) {
        time = 10; //设定间隔时间（秒）
        //启动计时器，倒计时time秒后自动关闭计时器。
        let index = setInterval(function () {
          time--;
          if (time == 0) {
            clearInterval(index);
          }
        }, 200);

        $.ajax({
          type: "POST",
          dataType: "json",
          url: "http://czc.jokeryang.site:55555/GameUsers/login",
          data: $("#login1").serialize(), //提交的数据
          success: function (result) {
            // console.log(result);       //打印服务端返回的数据(调试用)
            if (result.resultCode == 200) {
              islogin.innerHTML = `hi,${result.username}`;
              login.className = "hide";
            }
            // console.log(result.msg);
            alert(result.msg);
          },
          error: function () {
            alert("提交失败");
          },
        });
      }
    });

    // shuaxin.addEventListener("click", function () {
    //   //处理因为短时间内连续点击登录按钮而多次调用接口
    //   let time = 0;
    //   if (time == 0) {
    //     time = 10; //设定间隔时间（秒）
    //     //启动计时器，倒计时time秒后自动关闭计时器。
    //     let index = setInterval(function () {
    //       time--;
    //       if (time == 0) {
    //         clearInterval(index);
    //       }
    //     }, 200);

    //     $.ajax({
    //       type: "GET",
    //       dataType: "json",
    //       url: "http://czc.jokeryang.site:55555/GameMsgs/rank",
    //       data: null,
    //       success: function (result) {
    //         let { model4 } = result;
    //         for (let i = 0; i < model4.length; i++) {
    //           if (i > 7) break;
    //           if (i % 2 == 0) {
    //             rank.children[3].children[0].children[
    //               Math.floor(i / 2) + 1
    //             ].children[1].innerHTML = model4[i].GameUser.username;
    //             rank.children[3].children[0].children[
    //               Math.floor(i / 2) + 1
    //             ].children[2].innerHTML = model4[i].sum_score;
    //             rank.children[3].children[0].children[
    //               Math.floor(i / 2) + 1
    //             ].children[3].innerHTML = format_time(model4[i].sum_time);
    //           } else {
    //             rank.children[3].children[0].children[
    //               Math.floor(i / 2) + 1
    //             ].children[5].innerHTML = model4[i].GameUser.username;
    //             rank.children[3].children[0].children[
    //               Math.floor(i / 2) + 1
    //             ].children[6].innerHTML = model4[i].sum_score;
    //             rank.children[3].children[0].children[
    //               Math.floor(i / 2) + 1
    //             ].children[7].innerHTML = format_time(model4[i].sum_time);
    //           }
    //         }
    //       },
    //       error: function () {
    //         alert("提交失败");
    //       },
    //     });
    //     alert("刷新成功！");
    //   }
    // });

    back.addEventListener("click", function () {
      if (level !== 0) level--;
    });

    next.addEventListener("click", function () {
      if (level + 1 !== plans.length) level++;
    });

    btn_login.onclick = function () {
      rank.className = "hide";
      if (login.className === "") login.className = "hide";
      else login.className = "";
      register.className = "hide";
    };

    btn_rank.onclick = function () {
      if (rank.className === "") rank.className = "hide";
      else rank.className = "";
      login.className = "hide";
      register.className = "hide";

      $.ajax({
        type: "GET",
        dataType: "json",
        url: "http://czc.jokeryang.site:55555/GameMsgs/rank",
        data: null,
        success: function (result) {
          let { model4 } = result;
          // console.log(rank)
          for (let i = 0; i < model4.length; i++) {
            if (i >= 8) break;
            if (i % 2 == 0) {
              rank.children[3].children[0].children[
                Math.floor(i / 2) + 1
              ].children[1].innerHTML = model4[i].GameUser.username;
              rank.children[3].children[0].children[
                Math.floor(i / 2) + 1
              ].children[2].innerHTML = model4[i].sum_score;
              rank.children[3].children[0].children[
                Math.floor(i / 2) + 1
              ].children[3].innerHTML = format_time(model4[i].sum_time);
            } else {
              rank.children[3].children[0].children[
                Math.floor(i / 2) + 1
              ].children[5].innerHTML = model4[i].GameUser.username;
              rank.children[3].children[0].children[
                Math.floor(i / 2) + 1
              ].children[6].innerHTML = model4[i].sum_score;
              rank.children[3].children[0].children[
                Math.floor(i / 2) + 1
              ].children[7].innerHTML = format_time(model4[i].sum_time);
            }
          }
        },
        error: function () {
          alert("提交失败");
        },
      });
    };

    btn_register.onclick = function () {
      rank.className = "hide";
      login.className = "hide";
      if (register.className === "") register.className = "hide";
      else register.className = "";
    };

    // 点击复制地图按钮复制当前地图
    let clipboard = new ClipboardJS("#btn_copyMap");
    clipboard.on("success", function (e) {
      e.clearSelection();
    });
    btn_copyMap.onclick = function () {
      this.setAttribute("data-clipboard-text", plans[level]);
    };

    myrank.onclick = function () {
      let username = document
        .getElementById("islogin")
        .innerHTML.trim()
        .substring(3);
      if (username === "") alert("请登录！");
      else {
        rankbox.className = "";
        rank.className = "hide";

        $.ajax({
          type: "POST",
          dataType: "json",
          url: "http://czc.jokeryang.site:55555/GameMsgs/rank/user",
          data: { username }, //提交的数据
          success: function (result) {
            // console.log(result);       //打印服务端返回的数据(调试用)
            let { model2 } = result;
            for (let i = 0; i < model2.length; i++) {
              // console.log(model2[i].score+";"+model2[i].level+";"+model2[i].time);
              // console.log(rankbox);
              // console.log(rankbox.children[0].children[0].children[1]);
              if (i == 0) {
                rankbox.children[0].children[0].children[1].children[0].innerHTML =
                  model2[i].level;
                rankbox.children[0].children[0].children[1].children[1].innerHTML =
                  model2[i].score;
                rankbox.children[0].children[0].children[1].children[2].innerHTML =
                  model2[i].time;
              } else if (i == 1) {
                rankbox.children[0].children[0].children[1].children[3].innerHTML =
                  model2[i].level;
                rankbox.children[0].children[0].children[1].children[4].innerHTML =
                  model2[i].score;
                rankbox.children[0].children[0].children[1].children[5].innerHTML =
                  model2[i].time;
              } else if (i == 2) {
                rankbox.children[0].children[0].children[2].children[0].innerHTML =
                  model2[i].level;
                rankbox.children[0].children[0].children[2].children[1].innerHTML =
                  model2[i].score;
                rankbox.children[0].children[0].children[2].children[2].innerHTML =
                  model2[i].time;
              } else if (i == 3) {
                rankbox.children[0].children[0].children[2].children[3].innerHTML =
                  model2[i].level;
                rankbox.children[0].children[0].children[2].children[4].innerHTML =
                  model2[i].score;
                rankbox.children[0].children[0].children[2].children[5].innerHTML =
                  model2[i].time;
              } else if (i == 4) {
                rankbox.children[0].children[0].children[3].children[0].innerHTML =
                  model2[i].level;
                rankbox.children[0].children[0].children[3].children[1].innerHTML =
                  model2[i].score;
                rankbox.children[0].children[0].children[3].children[2].innerHTML =
                  model2[i].time;
              } else if (i == 5) {
                rankbox.children[0].children[0].children[3].children[3].innerHTML =
                  model2[i].level;
                rankbox.children[0].children[0].children[3].children[4].innerHTML =
                  model2[i].score;
                rankbox.children[0].children[0].children[3].children[5].innerHTML =
                  model2[i].time;
              } else if (i == 6) {
                rankbox.children[0].children[0].children[4].children[0].innerHTML =
                  model2[i].level;
                rankbox.children[0].children[0].children[4].children[1].innerHTML =
                  model2[i].score;
                rankbox.children[0].children[0].children[4].children[2].innerHTML =
                  model2[i].time;
              } else if (i == 7) {
                rankbox.children[0].children[0].children[4].children[3].innerHTML =
                  model2[i].level;
                rankbox.children[0].children[0].children[4].children[4].innerHTML =
                  model2[i].score;
                rankbox.children[0].children[0].children[4].children[5].innerHTML =
                  model2[i].time;
              }
            }
          },
          error: function () {
            alert("提交失败");
          },
        });

        setTimeout(() => {
          rankbox.className = "hide";
          rank.className = "";
        }, 3000);
      }
    };

    tiaozhuandaozhuce.onclick = function () {
      // console.log()
      rank.className = "hide";
      login.className = "hide";
      register.className = "";
    };

    chongzhi.onclick = function () {
      // console.log(register.children[0].children[1].children[1].value);
      register.children[0].children[1].children[1].value = "";
      register.children[0].children[2].children[1].value = "";
      register.children[0].children[3].children[1].value = "";
    };

    let status = await runLevel(new Level(plans[level]), Display);
    if (status === "end") {
      // 动画终止 退出循环
      break;
    }

    if (status == "won") {
      let record = document.getElementById("record");
      let elt = document.getElementById("timeConsuming");
      let HP = document.getElementById("HP");

      let usernamedata = document
        .getElementById("islogin")
        .innerHTML.trim()
        .substring(3);
      let scoredata = Number(HP.children[0].innerHTML.substring(3));
      let timedata = elt.innerHTML;

      let data = { usernamedata, level: level + 1, scoredata, timedata };
      console.log(usernamedata);
      if (!isUserDesignedMap) {
        // 若当前地图是用户自定义地图闯关数据不录入数据库中
        $.ajax({
          type: "POST",
          dataType: "json",
          url: "http://czc.jokeryang.site:55555/GameMsgs",
          data: data,
          success: function (result) {
            // console.log(result);       //打印服务端返回的数据(调试用)
            if (result.resultCode == 200) {
              // console.log("good");
            } else {
              alert(result.msg);
            }
          },
          error: function () {
            alert("提交失败！");
          },
        });
      }

      nowtime = new Date();
      hp = 100;
      level++;
      if (level === plans.length) {
        alert("恭喜您通关了!");
        level = 0;
      }
    }
  }
}
