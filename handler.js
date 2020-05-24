'use strict';
// モジュール呼び出し
const crypto = require('crypto');
const line = require('@line/bot-sdk');
const AWS = require('aws-sdk');

//メッセージ呼び出し
const join = require('messages/join.json');
const add = require('messages/add.json');
const site = require('messages/site.json');
const other = require('messages/other.json');
const contact = require('messages/contact.json');
const howToUse = require('messages/howToUse.json');
const travelMes = require('messages/travelMes.json');
const select = require('messages/select.json');
const see = require('messages/see.json');
const play = require('messages/play.json');
const map = require('messages/map.json');
const rate = require('messages/rate.json');
const rateBase = require('messages/rateBase.json');
const view = require('messages/view.json')
// インスタンス生成
const client = new line.Client({
  channelAccessToken: process.env.ACCESSTOKEN
});

const lambda = new AWS.Lambda();


const url = 'https://travel.sugokunaritai.dev';


module.exports.hello = (event, context) => {
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
        case 'join':
          let tld = await createTravelId(event);
          // tld = '@' + tld;
          if (tld !== undefined) {
            message = [join, {
              type: 'text',
              text: '以下のtravelIdをメモしておいてください。'
            }, {
              type: 'text',
              text: tld
            }];
            break;
          }
          case 'leave':
            await DelTravelId(event);

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
  // let test = '@0fc833feac864ff7a4dc80550b602517' 
  let message;
  var headMes = userMes.slice(0, 1);

  if (userMes.length === 32 && message.match(/^[A-Za-z0-9]*$/)) {
    let idParams = {
      FunctionName: 'travel-lambda-dev-hello',
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify({
        type: 'lambda',
        path: '/user',
        httpMethod: 'GET',
        queryStringParameters: {
          userId: event.source.groupId
        }
      }),
    };
    let result2 = await lambda.invoke(idParams).promise();
    let res = JSON.parse(result2.Payload);
    let res2 = JSON.parse(res.body);
    let travelId = res2[0].travelId;
    await postUser(event, travelId);
    message = {
      type: 'text',
      text: '紐付けが完了しました！\n「トラべる！」を押すと行程表が確認できます。'
    };
  }

  switch (userMes) {
    case '@閲覧':
      let idParams = {
        FunctionName: 'travel-lambda-dev-hello',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          type: 'lambda',
          path: '/user',
          httpMethod: 'GET',
          queryStringParameters: {
            userId: event.source.groupId
          }
        }),
      };
      let result2 = await lambda.invoke(idParams).promise();
      let res12 = JSON.parse(result2.Payload);
      let res23 = JSON.parse(res12.body);
      let travelId = res23[0].travelId;
      message = view;
      message.contents.footer.contents[0].action.uri = `https://travel.sugokunaritai.dev/view?travelId=${travelId}`
      break;
    case '@使い方':
      message = howToUse;
      break;
    case '@計画':
      await getGroupTravelId(event);
      message = select;
      break;
    case '@ばいばい':
      client.leaveGroup(event.source.groupId);
      break;
    case '@評価':
      /*const place = await getPlace(event, travelId);

      for (const property in place) {
        const placeId = place[property]['placeId'];
      }

      break;*/
    case 'トラべる！':
      const res = await getTravelId(event);
      console.log(typeof (res));
      if (res === '[]') {
        message = {
          type: 'text',
          text: `行程表はこちらです\n${url}?travelId=${res.travelId}`
        };
      } else {
        message = travelMes;
      }
      break;
    case '県公式サイト':
      message = site;
      break;
    case '使い方':
      message = howToUse;
      break;
    case 'その他':
      message = other;
      break;
    case '水平展開を提案する':
      message = contact;
      break;

    default:
      break;
  }

  return message;
};

const postbackFunc = async function (event) {
  let message;

  let idParams = {
    FunctionName: 'travel-lambda-dev-hello',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      type: 'lambda',
      path: '/user',
      httpMethod: 'GET',
      queryStringParameters: {
        userId: event.source.groupId
      }
    }),
  };
  let result2 = await lambda.invoke(idParams).promise();
  let res = JSON.parse(result2.Payload);
  let res2 = JSON.parse(res.body);
  let travelId = res2[0].travelId;

  const data = event.postback.data;

  switch (data) {
    case '見る':
      message = see;
      break;
    case '遊ぶ':
      message = play;
      break;
    default:
      message = map;
      message.contents.body.contents[0].action.uri = `${url}?type=${encodeURI(data)}&lat=34.385273&lng=132.455050&travelId=${travelId}`;
      message.contents.body.contents[1].action.uri = `${url}?type=${encodeURI(data)}&lat=34.409314&lng=133.205692&travelId=${travelId}`;
      message.contents.body.contents[2].action.uri = `${url}?type=${encodeURI(data)}&lat=34.348144&lng=132.332069&travelId=${travelId}`;
      message.contents.body.contents[3].action.uri = `${url}?type=${encodeURI(data)}&lat=34.402934&lng=132.456019&travelId=${travelId}`;
      break;
  }
  return message;
};

const createTravelId = async function (event) {
  let group = event.source.groupId;
  let params = {
    FunctionName: 'travel-lambda-dev-hello',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      type: 'lambda',
      path: '/travel',
      httpMethod: 'POST',
      body: JSON.stringify({
        groupId: group
      })
    }),
  };
  let result = await lambda.invoke(params).promise();
  let res = JSON.parse(result.Payload).body;
  let res2 = JSON.parse(res);
  return res2.travelId;
};

const DelTravelId = async function (event) {
  let params = {
    FunctionName: 'travel-lambda-dev-hello',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      type: 'lambda',
      path: '/',
      httpMethod: 'DELETE',
      queryStringParameters: {
        travelId: 'eb7bd2ecdab647509a0bd3647d076b4d'
      }
    }),
  };
  let result2 = await lambda.invoke(params).promise();
  let res = JSON.parse(result2.Payload);
  let res2 = JSON.parse(res.body);
  return res2[0].travelId;
};


const getGroupTravelId = async function (event) {
  let idParams = {
    FunctionName: 'travel-lambda-dev-hello',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      type: 'lambda',
      path: '/user',
      httpMethod: 'GET',
      queryStringParameters: {
        userId: event.source.groupId
      }
    }),
  };
  let result2 = await lambda.invoke(idParams).promise();
  let res = JSON.parse(result2.Payload);
  console.log(res);
  let res2 = JSON.parse(res.body);
  return res2[0].travelId;
};

const getTravelId = async function (event) {
  let idParams = {
    FunctionName: 'travel-lambda-dev-hello',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      type: 'lambda',
      path: '/user',
      httpMethod: 'GET',
      queryStringParameters: {
        userId: event.source.userId
      }
    }),
  };
  let result2 = await lambda.invoke(idParams).promise();
  let res = JSON.parse(result2.Payload);
  console.log(res);
  let res2 = JSON.parse(res.body);
  return res2;
};

const getPlace = async function (event, travelId) {
  let idParams = {
    FunctionName: 'travel-lambda-dev-hello',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      type: 'lambda',
      path: '/place',
      httpMethod: 'GET',
      queryStringParameters: {
        travelId: event.source.travelId
      }
    }),
  };
  let result2 = await lambda.invoke(idParams).promise();
  let res = JSON.parse(result2.Payload);
  let res2 = JSON.parse(res.body);
  return res2[0].travelId;
};

const postUser = async function (event, travelId) {
  let userId = event.source.userId;
  let params = {
    FunctionName: 'travel-lambda-dev-hello',
    InvocationType: 'RequestResponse',
    Payload: JSON.stringify({
      type: 'lambda',
      path: '/user',
      httpMethod: 'POST',
      body: JSON.stringify({
        travelId: travelId,
        userId: userId
      })
    }),
  };
  let result = await lambda.invoke(params).promise();
  let res = JSON.parse(result.Payload).body;
  let res2 = JSON.parse(res);
  return res2.travelId;
};