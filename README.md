# ts-custom-dakoku
slackからチームスピリットに任意の時刻で打刻する

前回は[slackのスラッシュコマンドでチームスピリットの勤怠打刻を行う](https://qiita.com/geeorgey/items/4c2bc14d5d0f6a238820)を書きました。こちらのアップデートです。

<img width="430" alt="updateLe-bird.jpg" src="https://qiita-image-store.s3.amazonaws.com/0/22294/f74c8feb-6fcc-7619-f846-df903ea1af1a.jpeg">


## 処理の流れ
- botkit上でCronにより定時に勤怠打刻状態を取得する
- 打刻完了してない場合に、その旨をDMで伝え、出勤or退勤コマンドを使って処理を進めてもらう
- DM上で時刻を4桁の数字で入力して打刻完了

## なぜこんな設計になっているか
- 最初はスラッシュコマンド /出勤 みたいな実装を目指していたが、スラッシュコマンドの中から convo.ask で会話を始めると、対応の入力がうまく処理されないっぽい。
- どうせCronでDM送るのだから、そのDM上でやり取りすればスムーズで、わざわざスラッシュコマンドで呼び出す必要性が薄い

## 苦労したところ
- slackAPIがタイムアウトしないような設計
- response_urlが取れない

## コード
[geeorgey/ts-custom-dakoku](https://github.com/geeorgey/ts-custom-dakoku)

## 使い方
こちらからherokuにdeploy
[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)
各種変数を入力してからdeployしてください。

# 環境
- node.js
- botkit
- express //webサーバ
- mongodb //slackの認証情報の保存

node.js上で動きます。私の環境ではheroku上で可動しています。

# チームスピリットの打刻用Apexについて
/apex/以下のコードについては [ngs/ts-dakoku](https://github.com/ngs/ts-dakoku) を参考に使わせてもらっています(ngsさんに感謝)  
こちらの２つのクラスを本番環境にデプロイして使ってください
- TSTimeTableAPIController.cls	
- TSTimeTableAPIControllerTest.cls	
設定等についてはこちらを参照：https://ja.ngs.io/2018/02/14/ts-dakoku/

## カスタム打刻用のコードについて
上記と同様に、/apex/以下の2classをSalesforceの本番環境にデプロイしてください

# Salesforceで接続アプリケーションを作る
- アプリ名: 任意
- API Name: 任意
- Contact Email: 管理者のEmail
- OAuth 設定: チェックを入れてください
- コールバック URL: https://myapp.herokuapp.com/oauthcallback (これは後でherokuアプリを立ち上げたあとに書き換えます)
Selected OAuth Scopes: Full Access (full)
- 保存する

# herokuアプリを作る
heroku CLIをインストール  
$ heroku login  
// メアドとパス・二段階認証でログイン  
$ heroku create appName  
//appNameは任意  
//ここまでやるとアプリURLが発行されるので先程作ったSalesforceアプリのコールバックURL(https://myapp.herokuapp.com)部分を置き換えてください  
ここからはGUI。 https://dashboard.heroku.com にログインして先程作ったアプリの設定画面を開く  
Resources画面に行き、add-onにmLab MongoDBを追加  
Settings画面に行き、Reveal config varsボタンを押して環境変数を設定します

# slackアプリを作る
https://api.slack.com/apps  
Create new appする  
Basic Informationにある[Client ID][Client Secret][Verification Token]を以下で使います  
Interactive Componentsに移動してRequest URLに  
先程herokuで作ったアプリのURL/slack/receive を設定する

# スラッシュコマンドを作る
slackアプリのスラッシュコマンドページへ行き、Create New Commandを押す  
コマンド名： /ts  
Request URL: herokuアプリのURL/ts  
Short Description: チームスピリット打刻コマンド  

# herokuの環境変数
- MONGODB_URI herokuのadd onで mLab MongoDB :: Mongodb をインストールすると自動的に入ります
- SF_CLIENT_ID //先程Salesforceで作ったアプリのID
- SF_CLIENT_SECRET //先程Salesforceで作ったアプリのsecret
- SF_LOGIN_URL //自分のSalesforceのURL。https://[任意の文字列].my.salesforce.com
- SF_USER_NAME //管理者のメアド
- SF_PASSWORD //管理者のパス
- SLACK_ID // Slackアプリの[Client ID]
- SLACK_REDIRECT // herokuで作成したアプリのURL
- SLACK_SECRET // Slackアプリの[Client Secret]
- VERIFICATION_TOKEN // slackアプリの[Verification Token]

# mongoDBについて
herokuダッシュボードよりResourcesタブを開き、mLab MongoDB :: Mongodbをクリックすると、mongo dbの管理画面が開きます  
sfusers という名前のCollectionsが必要になるので、Add collectionボタンを押して追加してください。  
その中にSalesforceのアクセストークンが保存されます

# 使い方
slackで /ts と打つとslashコマンドが起動します  
最初はSalesforceへのログイン認証が必要なので、表示されるURLをクリックしてログイン情報を登録します  
(注意：こちらのデータもmongodbに入れるべきなのですが未実装です)  
ログインしたら再度 /ts と打つと、出勤/退勤/キャンセルボタンが表示されますのでボタンを押して打刻してください

# cronについて
- cronTimeMorning:あさイチで未打刻ユーザを検索して、打刻ボタンをDMで送りつける時間です
- cronTimeMorningConfirmation 上述のボタンを押さなかったユーザに、カスタム時刻での入力を促す時間です
- cronTimeNight: 帰宅時間に帰宅打刻を促すDMを送りつける時間です
- cronTimeNightConfirmation: 上述のボタンを押さなかったユーザに、カスタム時刻での入力を促す時間です

# botkitについて
botkit.jsでbotkitの基本的な機能の実装が可能です  
interactive_message_callbackについてはここで受けることが出来ません。  
エンドポイントは、 modules/receive.js で作成してあるのでそちらで定義してください

# server.jsについて
スラッシュコマンドを追加する場合はserver.jsに定義し、 mobules/ にファイルを設置しています。
