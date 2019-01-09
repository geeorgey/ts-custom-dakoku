//CONFIG===============================================

/* Uses the slack button feature to offer a real time bot to multiple teams */
var Botkit = require('botkit');
var botkit = require('./botkit');
var mongoUri = process.env.MONGODB_URI || 'mongodb://localhost/botkit_express_demo'
var botkit_mongo_storage = require('./botkit_mongo_storage')({mongoUri: mongoUri})
var VERIFICATION_TOKEN = process.env.VERIFICATION_TOKEN;
const cron = require('cron'),
      logger = require('heroku-logger');
let force = require("./modules/force"),
    auth = require("./modules/slack-salesforce-auth"),
    ts = require("./modules/ts"),
    request = require('request');

if (!process.env.SF_CLIENT_ID || !process.env.SF_CLIENT_SECRET || !process.env.PORT) {
  console.log('Error: Specify SF_CLIENT_ID SF_CLIENT_SECRET and PORT in environment');
  process.exit(1);
}

var controller = Botkit.slackbot({
  debug: process.env.BOTKIT_DEBUG_MODE_FLAG,
  storage: botkit_mongo_storage
})
exports.controller = controller

//CONNECTION FUNCTIONS=====================================================
exports.connect = function(team_config){
  var bot = controller.spawn(team_config);
  controller.trigger('create_bot', [bot, team_config]);
}

// just a simple way to make sure we don't
// connect to the RTM twice for the same team
var _bots = {};

function trackBot(bot) {
  _bots[bot.config.token] = bot;
}

controller.on('create_bot',function(bot,team) {

  if (_bots[bot.config.token]) {
    // already online! do nothing.
    console.log("already online! do nothing.")
  }
  else {
    bot.startRTM(function(err) {

      if (!err) {
        trackBot(bot);

        console.log("RTM ok")

        controller.saveTeam(team, function(err, id) {
          if (err) {
            console.log("Error saving team")
          }
          else {
            console.log("Team " + team.name + " saved")
          }
        })

      }

      else{
        console.log("RTM failed")
      }

      bot.startPrivateConversation({user: team.createdBy},function(err,convo) {
        if (err) {
          console.log(err);
        } else {
          convo.say('I am a bot that has just joined your team');
          convo.say('You must now /invite me to a channel so that I can be of use!');
        }
      });

    });
  }
});

//REACTIONS TO EVENTS==========================================================

// Handle events related to the websocket connection to Slack
controller.on('rtm_open',function(bot) {
  console.log('** The RTM api just connected!');
});

controller.on('rtm_close',function(bot) {
  console.log('** The RTM api just closed');
  // you may want to attempt to re-open
});

//DIALOG ======================================================================
controller.storage.teams.all(function(err,teams) {

  console.log(teams)

  if (err) {
    throw new Error(err);
  }

  // connect all teams with bots up to slack!
  for (var t  in teams) {
    if (teams[t].bot) {
      var bot = controller.spawn(teams[t]).startRTM(function(err) {
        if (err) {
          console.log('Error connecting bot to Slack:',err);
        } else {
          trackBot(bot);
        }
      });
    }
  }

});


//CRON JOB==========================================================
// debug mode を trueにすると、adminSlackUserID に入っているユーザにのみcronの通知が飛びます 
controller.spawn({
  token : process.env.SLACK_TOKEN
}).startRTM((err, bot, payload) => {
  new cron.CronJob({    
    cronTime: process.env.cronTimeMorning,
    onTick: () => {
      var switchparam = '0';
      //テスト用
      if(process.env.BOTKIT_DEBUG_MODE_FLAG == 'true'){//テスト用
        logger.info('[info]', { '■■■IS_SANDBOX■■■': 'true' });
        var dd = [process.env.adminSlackUserID]; 
        auth.getOAuthObject(process.env.adminSlackUserID).then((oauthObj) => getAttendance(oauthObj,switchparam,bot)).then((data) => sendDirectMassages(dd,bot,switchparam));
      }else{
        auth.getOAuthObject(process.env.adminSlackUserID).then((oauthObj) => getAttendance(oauthObj,switchparam,bot)).then((data) => sendDirectMassages(data,bot,switchparam));
      }
    },
    start: true,
    timeZone: 'Asia/Tokyo'
  });
  new cron.CronJob({    
      cronTime: process.env.cronTimeNight,
      onTick: () => {
        var switchparam = '1';
        if(process.env.BOTKIT_DEBUG_MODE_FLAG == 'true'){//テスト用
          var dd = [process.env.adminSlackUserID];
          auth.getOAuthObject(process.env.adminSlackUserID).then((oauthObj) => getAttendance(oauthObj,switchparam,bot)).then((data) => sendDirectMassages(dd,bot,switchparam));
        }else{
          auth.getOAuthObject(process.env.adminSlackUserID).then((oauthObj) => getAttendance(oauthObj,switchparam,bot)).then((data) => sendDirectMassages(data,bot,switchparam));
        }
      },
      start: true,
      timeZone: 'Asia/Tokyo'
  });
  new cron.CronJob({    
      cronTime: process.env.cronTimeMorningConfirmation,
      onTick: () => {
        var switchparam = '2';
        //テスト用
        if(process.env.BOTKIT_DEBUG_MODE_FLAG == 'true'){//テスト用
          var dd = [process.env.adminSlackUserID]; 
          auth.getOAuthObject(process.env.adminSlackUserID).then((oauthObj) => getAttendance(oauthObj,switchparam,bot)).then((data) => sendDirectMassages(dd,bot,switchparam));
        }else{
          auth.getOAuthObject(process.env.adminSlackUserID).then((oauthObj) => getAttendance(oauthObj,switchparam,bot)).then((data) => sendDirectMassages(data,bot,switchparam));
        }
      },
      start: true,
      timeZone: 'Asia/Tokyo'
  });
  new cron.CronJob({    
      cronTime: process.env.cronTimeNightConfirmation,
      onTick: () => {
        var switchparam = '3';
        //テスト用
        if(process.env.BOTKIT_DEBUG_MODE_FLAG == 'true'){//テスト用
          var dd = [process.env.adminSlackUserID]; 
          auth.getOAuthObject(process.env.adminSlackUserID).then((oauthObj) => getAttendance(oauthObj,switchparam,bot)).then((data) => sendDirectMassages(dd,bot,switchparam));
        }else{
          auth.getOAuthObject(process.env.adminSlackUserID).then((oauthObj) => getAttendance(oauthObj,switchparam,bot)).then((data) => sendDirectMassages(data,bot,switchparam));
        }
      },
      start: true,
      timeZone: 'Asia/Tokyo'
  });
});

//Apex の @HttpGetが呼ばれます
function getAttendance(oauthObjToGetAttendance,switchparam,bot){
  return new Promise(function (resolve, reject) {
    var params = {};
    var pathparam = '';
    if(switchparam == '0'){
      pathparam = 'slack?switchparam=0'
    }else if(switchparam == '1'){
      pathparam = 'slack?switchparam=1'
    }
    force.apexrest(oauthObjToGetAttendance,pathparam,params)
    .then(data => {
      logger.info('[info]', { '■■■data■■■': JSON.parse(data) });
      resolve(data);
    })
    .catch(error => {
      logger.error('[error]', { '■■■error■■■': error});
    });
  });
}


function sendDirectMassages(data,bot,num){
  var objectdata;
  if(process.env.BOTKIT_DEBUG_MODE_FLAG == 'true'){//テスト用
    objectdata = data;
  }else{
    objectdata = JSON.parse(data);
  }
  var i = 0;
  while(i < objectdata.length) {
    bot.api.im.open({
      user: objectdata[i]
      }, (err, res) => {
        if (err) {
          bot.botkit.log('Failed to open IM with user', err)
        }
        console.log(res);
        var txt = '';
        var buttontxt = '';
        var buttonname = '';
        if(num == '0'){
          txt = "おはようございます :sunny: 出勤打刻しませんか？",
          buttontxt = '出勤';
          buttonname = "attend";
        }else if(num == '1'){
          txt = "今日もお疲れ様でした :night_with_stars: そろそろ退勤打刻しませんか？",              
          buttontxt = '退勤';
          buttonname = "leave";
        }

        bot.startConversation({
            user: objectdata[i],
            channel: res.channel.id,
            text: 'WOWZA... 1....2'
        }, (err, convo) => {
          if(num == '0' || num == '1'){
            var msg = {
              "text": txt,
              "attachments": [{
                "fallback": "Couldn't send.",
                "callback_id": "ts1",
                "attachment_type": 'default',
                "actions": [
                  {name: buttonname,value: buttonname,text: buttontxt,type: "button",style: "primary"},
                  {name: "cancel",value: "cancel",text: "キャンセル",type: "button"}
                ]
              }]
            };
            convo.say(msg);
            convo.next();
          }else if(num == '2'){//auth周りは片付いているので実行するだけで良い
            convo.say("おはようございます :sunny: 出勤打刻がまだみたいです \n 出勤時間を登録する場合は、 ```出勤``` と入力してください。現在時刻で打刻する場合は ```/ts``` コマンドからどうぞ");

          }else if(num == '3'){//auth周りは片付いているので実行するだけで良い
            convo.say("お疲れ様です :night_with_stars: 出勤打刻がまだみたいです \n 退勤時間を登録する場合は、 ```退勤``` と入力してください。現在時刻で打刻する場合は ```/ts``` コマンドからどうぞ");
          }

        });
      })
      i=(i+1)|0;
      sleep(1000);
    }
}

function sleep(time) {
  const d1 = new Date();
  while (true) {
      const d2 = new Date();
      if (d2 - d1 > time) {
          return;
      }
  }
}

// 参照元：Slackbot_worker.js
function replyPrivateDelayed(src, resp, cb) {
    if (!src.response_url) {
        cb && cb('No response_url found');
    } else {
        var msg = {};

        if (typeof(resp) == 'string') {
            msg.text = resp;
        } else {
            msg = resp;
        }

        msg.channel = src.channel;
        msg.to = src.user;

        // if source message is in a thread, reply should also be in the thread
        if (src.thread_ts) {
            msg.thread_ts = src.thread_ts;
        }

        msg.response_type = 'ephemeral';

        var requestOptions = {
            uri: src.response_url,
            method: 'POST',
            json: msg
        };
        request(requestOptions, function(err) {
            /**
             * Do something?
             */
            if (err) {
                botkit.log.error('Error sending slash command response:', err);
                cb && cb(err);
            } else {
                cb && cb();
            }
        });
    }
};
exports.replyPrivateDelayed = replyPrivateDelayed;

//slash commandはすべてmodules/receive.jsで受ける

//出退勤コマンドの処理
controller.hears(['出勤'], 'direct_message,direct_mention,mention', function (bot, message) {
  
  // 会話を開始します。
  bot.startConversation(message, function (err, convo) {

    convo.ask('出勤時間を4桁の数字で教えてください(例：0805)',
    function(response, convo) {
      var params = {};
      params.method = 'PUT'; // @Httpputを呼び出すのでPUT
      var bodys = {}; //パラメータを渡す場合は連想配列にして渡す必要がある
      bodys.attendanceTime = response.text;
      bodys.attendance = 1; //出勤ボタンを押した場合は attendance: 1 として送信
      bodys.slackid = message.user;
      params.body = bodys; //bodyに作った連想配列を追加
      logger.info('[info]', { 'message ■■■': message });
      logger.info('[info]', { 'convo ■■■': convo });
      logger.info('[info]', { 'response ■■■': response });
      convo.say('打刻処理中...🍙🍚🍛🍘');
      ts.tsEdit(message.user,params,convo)
      convo.say('打刻完了');
      convo.next();
    });     
  });
});

controller.hears(['退勤'], 'direct_message,direct_mention,mention', function (bot, message) {
  
  // 会話を開始します。
  bot.startConversation(message, function (err, convo) {

    convo.ask('退勤時間を4桁の数字で教えてください(例：0805)',
    function(response, convo) {
      var params = {};
      params.method = 'PUT'; // @Httpputを呼び出すのでPUT
      var bodys = {}; //パラメータを渡す場合は連想配列にして渡す必要がある
      bodys.attendanceTime = response.text;
      bodys.attendance = 0; //退勤は attendance: 0 として送信
      bodys.slackid = message.user;
      params.body = bodys; //bodyに作った連想配列を追加
      logger.info('[info]', { 'message ■■■': message });
      logger.info('[info]', { 'convo ■■■': convo });
      logger.info('[info]', { 'response ■■■': response });
      convo.say('打刻処理中...🍙🍚🍛🍘');
      ts.tsEdit(message.user,params,convo)
      convo.say('打刻完了');
      convo.next();
    });     
  });
});


