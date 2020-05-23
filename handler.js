'use strict';
// モジュール呼び出し
const crypto = require('crypto');
const line = require('@line/bot-sdk');

//メッセージ呼び出し
const add = require('messages/add.json');
const site = require('messages/site.json');
const other = require('messages/other.json');
const contact = require('messages/contact.json');
const howToUse = require('messages/howToUse.json');

// インスタンス生成
const client = new line.Client({
  channelAccessToken: process.env.ACCESSTOKEN
});

module.exports.hello = (event, context, ) => {
  // 署名検証
  const signature = crypto
    .createHmac('sha256', process.env.CHANNELSECRET)
    .update(event.body)
    .digest('base64');
  const checkHeader = (event.headers || {})['X-Line-Signature'];
  const body = JSON.parse(event.body);
  const events = body.events;
  console.log(events);

  // 署名検証が成功した場合
  if (signature === checkHeader) {
    events.forEach(async (event) => {
      let message;
      // イベントタイプごとに関数を分ける
      switch (event.type) {
        // メッセージイベント
        case 'message':
          message = await messageFunc(event);
          break;
          // フォローイベント
        case 'follow':
          message = add;
          break;
          // ポストバックイベント
        case 'postback':
          message = await postbackFunc(event);
          break;
      }
      // メッセージを返信
      if (message != undefined) {
        client
          .replyMessage(body.events[0].replyToken, message)
          .then((response) => {
            const lambdaResponse = {
              statusCode: 200,
              headers: {
                'X-Line-Status': 'OK'
              },
              body: '{"result":"completed"}',
            };
            context.succeed(lambdaResponse);
          })
          .catch((err) => console.log(err));
      }
    });
  }
  // 署名検証に失敗した場合
  else {
    console.log('署名認証エラー');
  }
};

const messageFunc = async function (event) {
  let userMes = event.message.text;
  let message;
  if (userMes === '県公式サイト') {
    message = site;
  }
  if (userMes === '使い方') {
    message = howToUse;
  }
  if (userMes === 'その他') {
    message = other;
  }
  if (userMes === '水平展開を提案する') {
    message = contact;
  }

  return message;
};



const postbackFunc = async function (event) {
  let message;
  message = {
    type: 'text',
    text: 'ポストバックイベントを受け付けました！'
  };
  return message;
};