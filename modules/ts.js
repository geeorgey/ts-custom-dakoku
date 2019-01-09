"use strict";

let auth = require("./slack-salesforce-auth"),
    force = require("./force"),
    botkit = require("../botkit"),
    VERIFICATION_TOKEN = process.env.VERIFICATION_TOKEN,
    SF_LOGIN_URL = process.env.SF_LOGIN_URL,
    SF_CLIENT_ID = process.env.SF_CLIENT_ID,
    SF_CLIENT_SECRET = process.env.SF_CLIENT_SECRET;
const logger = require('heroku-logger');

exports.execute = (req, res) => {
    // respond to Slack that the webhook has been received.
    res.status(200);

    if (req.body.token != VERIFICATION_TOKEN) {
        console.log("Invalid token");
        res.send("Invalid token");
        return;
    }

    let slackUserId = req.body.user_id;
    var params = {};
    params.method = 'GET';
    botkit.replyPrivateDelayed(//非同期処理にしないと3000msの壁にぶつかってtimeoutする
        req.body,
        '打刻状態確認中...🍙🍚🍛🍘(数秒で何も起きない場合はもう一度 /ts コマンドを使ってください)',
        ts(slackUserId,params,req,res)
    );    
};

function ts(slackUserId,params,req,res){
    auth.getOAuthObject(slackUserId).then((oauthObj) => getButtons(oauthObj,params,req,res,slackUserId));
}

function getButtons(oauthObj,params,req,res,slackUserId){
    return new Promise(resolve => {
    //ログインセッションがない場合はoauthObjは空
    force.apexrest(oauthObj,'Dakoku',params) //apexrest を GETで叩くと @HttpGetメソッドが呼び出される https://github.com/ngs/ts-dakoku/blob/8582bff49165692f7a4a0979b20bf62449662c88/apex/src/classes/TSTimeTableAPIController.cls#L17
        .then(data => {
            let timetable = JSON.parse(data);
            let attachments = [];
            let actions = [];
            let texts = '';
            texts += ":alarm_clock: チームスピリット打刻メニュー\n";

            if(timetable.isHoliday == false){//休暇設定になってない場合はこちら
                var from = 0;
                var to = 0;
                if(timetable.timeTable == undefined || !timetable.timeTable[0].from){
                    logger.info('[info]', { '出勤': '表示' });
                    from = 1;
                    actions.push({name: "attend",value: "attend",text: "出勤",type: "button",style: "primary"});
                }
                if(timetable.timeTable == undefined || !timetable.timeTable[0].to){
                    logger.info('[info]', { '退勤': '表示' });
                    to = 1;
                    actions.push({name: "leave",value: "leave",text: "退勤",type: "button",style: "primary"});
                }
                if(from == 0 && to == 0){
                    texts += '本日の打刻は完了しています。変更する場合は<' + process.env.SF_LOGIN_URL + '/lightning/n/teamspirit__AtkWorkTimeTab|こちらから修正してください>';
                }else{
                    actions.push({name: "cancel",value: "cancel",text: "キャンセル",type: "button"});
                    attachments.push({callback_id: "ts1",attachment_type: "default",actions: actions});    
                }
            }else{ //休暇申請がされている場合はすでに申請済みの件を表示して終了
                texts += '休暇申請がされています。変更する場合は<' + process.env.SF_LOGIN_URL + '/lightning/n/teamspirit__AtkWorkTimeTab|こちらから修正してください>';
            }

            res.json({text: texts, attachments: attachments});            
        })
        .catch(error => {
            if (error.code == 401) {
                res.send(`Salesforceにログインしてからこちらをクリックしてください / Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            } else {
                // modules/slack-salesforce-auth.js getOAuthObject内でRefresh token取得するように変更したので以下は存在し得ない
                
                //res.send("An error as occurred");

                //ユーザがある場合はこちらに落ちる
                // error は空

                // slack-salesforce-auth.js より
                // exports.oauthCallback 部分を利用
                // refresh tokenを使ってaccess tokenを取得する
                // https://developer.salesforce.com/docs/atlas.ja-jp.api_rest.meta/api_rest/intro_understanding_refresh_token_oauth.htm
                let optionsRefresh = {
                    url: `${SF_LOGIN_URL}/services/oauth2/token`,
                    qs: {
                        grant_type: "refresh_token",
                        client_id: SF_CLIENT_ID,
                        client_secret: SF_CLIENT_SECRET,
                        refresh_token: oauthObj.refresh_token,
                    }
                };
                auth.getNewAccessToken(optionsRefresh,slackUserId).then((oauthObjRefresh) => getButtonsRefreshed(oauthObjRefresh,params,req,res,slackUserId));
            }
        });
        resolve(oauthObj);
    });    
}
exports.getButtons = getButtons;



function getButtonsRefreshed(oauthObj,params,req,res,slackUserId){
    logger.info('[info]', { '■■■■■■oauthObj■■■■■': oauthObj });
    return new Promise(resolve => {
    //ログインセッションがない場合はoauthObjは空
    force.apexrest(oauthObj,'Dakoku',params) //apexrest を GETで叩くと @HttpGetメソッドが呼び出される https://github.com/ngs/ts-dakoku/blob/8582bff49165692f7a4a0979b20bf62449662c88/apex/src/classes/TSTimeTableAPIController.cls#L17
        .then(data => {
            let timetable = JSON.parse(data);
            let attachments = [];
            let fields = [];
            let actions = [];
            let texts = '';
            texts += ":alarm_clock: チームスピリット打刻メニュー\n";

            logger.info('[info]', { 'timetable:::': timetable });
            logger.info('[info]', { 'timetable.timeTable[0]:::': timetable.timeTable[0] });
            logger.info('[info]', { 'timetable.timeTable[0].from:::': timetable.timeTable[0].from });
            logger.info('[info]', { 'timetable:::': timetable.isHoliday });
            if(timetable.isHoliday == false){//休暇設定になってない場合はこちら
                var from = 0;
                var to = 0;
                if(timetable.timeTable == undefined || !timetable.timeTable[0].from){
                    logger.info('[info]', { '出勤': '表示' });
                    from = 1;
                    actions.push({name: "attend",value: "attend",text: "出勤",type: "button",style: "primary"});
                }
                if(timetable.timeTable == undefined || !timetable.timeTable[0].to){
                    logger.info('[info]', { '退勤': '表示' });
                    to = 1;
                    actions.push({name: "leave",value: "leave",text: "退勤",type: "button",style: "primary"});
                }
                if(from == 0 && to == 0){
                    texts += '本日の打刻は完了しています。変更する場合は<' + process.env.SF_LOGIN_URL + '/lightning/n/teamspirit__AtkWorkTimeTab|こちらから修正してください>';
                }else{
                    actions.push({name: "cancel",value: "cancel",text: "キャンセル",type: "button"});
                    attachments.push({callback_id: "ts1",attachment_type: "default",actions: actions});    
                }
            }else{ //休暇申請がされている場合はすでに申請済みの件を表示して終了
                texts += '休暇申請がされています。変更する場合は<' + process.env.SF_LOGIN_URL + '/lightning/n/teamspirit__AtkWorkTimeTab|こちらから修正してください>';
            }

            res.json({text: texts, attachments: attachments});            
        })
        .catch(error => {
            if (error.code == 401) {
                res.send(`Salesforceにログインしてからこちらをクリックしてください / Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId);
            }
        });
        resolve(oauthObj);
    });    
}
exports.getButtonsRefreshed = getButtonsRefreshed;

function tsEdit(slackUserId,params,convo){
    auth.getOAuthObject(slackUserId).then((oauthObj) => dakokuAndUpdateTime(oauthObj,params,slackUserId,convo));
}
exports.tsEdit = tsEdit;
function dakokuAndUpdateTime(oauthObj,params,slackUserId,convo){
    return new Promise(resolve => {
        force.apexrest(oauthObj,'slack',params)
        .then(data => {
            if(data == 'OK'){ // dataにこちらのレスポンス( OK or NG)が入る https://github.com/ngs/ts-dakoku/blob/8582bff49165692f7a4a0979b20bf62449662c88/apex/src/classes/TSTimeTableAPIController.cls#L32                
                resolve(convo.say(params.body.attendanceTime + 'に出勤で打刻しました :smile:'));
            }else{
                resolve(convo.say('打刻失敗 :scream: もう一度 /test コマンドを打ってやり直してください'));
            }
        })
        .catch(error => {
            if (error.code == 401) {
                resolve(convo.say(`Visit this URL to login to Salesforce: https://${req.hostname}/login/` + slackUserId));
            } else {
                resolve(convo.say("An error as occurred"));
            }
        });
    });
}
exports.dakokuAndUpdateTime = dakokuAndUpdateTime;