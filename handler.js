"use strict";
// モジュール呼び出し
const crypto = require("crypto");
const line = require("@line/bot-sdk");
const AWS = require("aws-sdk");

//メッセージ呼び出し
const join = require('messages/join.json')
const add = require('messages/add.json')
const site = require('messages/site.json')
const other = require('messages/other.json')
const contact = require('messages/contact.json')
const howToUse = require('messages/howToUse.json')
const travelMes = require('messages/travelMes.json')
const select = require('messages/select.json')
const see = require('messages/see.json')
// インスタンス生成
const client = new line.Client({
  channelAccessToken: process.env.ACCESSTOKEN
});

const lambda = new AWS.Lambda();

module.exports.hello = (event, context ) => {
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
          message = add;
          break;
          // ポストバックイベント
        case "postback":
          message = await postbackFunc(event);
          break;
        case 'join':
          let tld =  await createTravelId(event)
          tld = "@"+tld
        if(tld !== undefined){
          message = [join,{type:"text",text:"以下のtravelIdをメモしておいてください。"},{type:"text",text:tld}];
          break;
        }
          
      }
      // メッセージを返信
      if (message != undefined) {
        client
          .replyMessage(body.events[0].replyToken, message)
          .then((response) => {
            const lambdaResponse = {
              statusCode: 200,
              headers: {
                "X-Line-Status": "OK"
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
    console.log("署名認証エラー");
  }
};

const messageFunc = async function (event) {
  let userMes = event.message.text;
  // let test = '@0fc833feac864ff7a4dc80550b602517' 
  let message;
  var headMes = userMes.slice(0, 1);

 
  if(userMes === '@使い方'){
    message = howToUse
  }
  if(userMes === '@計画'){
    await getTravelId(event)
    message = select
  }

 if (userMes === '@ばいばい') {
    if(event.source.roomId !== undefined){
     return  client.leaveRoom(event.source.roomId)
    }
    if(event.source.groupId !== undefined){
     return client.leaveGroup(event.source.groupId)
    }
  }





  if (userMes === 'トラべる！') {
    message = travelMes
  }
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


  //travelIdが送られてきた時
  else if (headMes === '@') {

    var travelId = userMes.slice(1, 33); //traveldを取得
    //travelIdでイベント情報を取得する


    //そのデータをデータに埋め込んだメッセージを送る
    //ない場合はありませんでした。を返す
  }
  

  return message;
};



const postbackFunc = async function (event) {
  let data = event.postback.data
  let message;

  if(data === '見る'){
    message =see


  }
  if(data === '見る/自然景観'){

  }
  if(data === '見る/文化施設'){

  }
  if(data === '見る/神社仏閣'){

  }
  if(data === '見る/文化史跡'){

  }
  if(data === '見る/公園/庭園'){

  }
  if(data === '見る/動/植物'){

  }
  if(data === '見る/施設景観'){

  }
  if(data === '見る/その他'){

  }
  if(data === '見る/全部'){

  }
  if(data === '食べる'){
    
  }
  if(data === '遊ぶ/文化施設'){
    
  }
  if(data === '遊ぶ/温泉'){
    
  }
  if(data === '遊ぶ/その他'){
    
  }
  if(data === '遊ぶ/スポーツ/レジャー'){
    
  }
  if(data === '遊ぶ/全部'){
    
  }
  if(data === '乗り物'){
    
  }
  if(data === '買い物'){
    
  }
  if(data === 'ホテル'){
    
  }
  if(data === 'その他'){
    
  }
  if(data === '全部'){
    
  }

  return message;
};


const createTravelId = async function (event){
  let group = event.source.groupId
  let params = {
    FunctionName: `travel-lambda-dev-hello`,
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({
      type: "lambda",
      path: "/travel",
      httpMethod: "POST",
      body: JSON.stringify( { 
         groupId: group
          })
    }),
  };
  let result = await lambda.invoke(params).promise(); 
let res = JSON.parse(result.Payload).body
let  res2 = JSON.parse(res)
return res2.travelId
}

const getTravelId = async function (event){
  let params = {
    FunctionName: `travel-lambda-dev-hello`,
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({
    type: 'lambda',
    path: '/user', 
    httpMethod: 'GET',
    queryStringParameters: {
      userId: event.source.groupId
    }
}),
  };
  let result2 = await lambda.invoke(params).promise(); 
  let res = JSON.parse(result2.Payload);
  let res2= JSON.parse(res.body);
  return res2[0].travelId
}