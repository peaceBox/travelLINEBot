"use strict";
// モジュール呼び出し
const crypto = require("crypto");
const line = require("@line/bot-sdk");
const site = require('messages/site.json')

// インスタンス生成
const client = new line.Client({ channelAccessToken: process.env.ACCESSTOKEN });

exports.handler = (event, context,) => {
  // 署名検証
  const signature = crypto
    .createHmac("sha256", process.env.CHANNELSECRET)
    .update(event.body)
    .digest("base64");
  const checkHeader = (event.headers || {})["X-Line-Signature"];
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
        case "message":
          message = await messageFunc(event);
          break;
        // フォローイベント
        case "follow":
          message ={ "type": "text", "text": "友達登録ありがとうございます。「トラべる！」広島県版です。広島県の旅を「広島県観光地オープンデータ」を基に開発し、実際にその場所に行ってみた人からの安心して観光できたかの評価によって成り立っていく旅行計画を立ててくれる公式アカウントです。グループLINEに招待して使います。"
          };
          break;
        // ポストバックイベント
        case "postback":
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
              headers: { "X-Line-Status": "OK" },
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
    console.log("署名認証エラー");
  }
};

const messageFunc = async function (event) {
  let userMes = event.message.text;
  let message;
  if(userMes ==='県公式サイト'){

    message =site;
  }
  return message;
};



const postbackFunc = async function (event) {
  let message;
  message = { type: "text", text: "ポストバックイベントを受け付けました！" };
  return message;
};