const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();


//GETでトラベルIDをつかって現在登録されている場所のIDを取得する




exports.handler = async (event) => {
    let params = {
    FunctionName: `travel-lambda-dev-hello`,
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({
    type: 'lambda',
    path: '/place', 
    httpMethod: 'GET',
    queryStringParameters: {
        travelId: "5ab5eb3424d34d3e8886b19b5993399b"
    }
}),
  };
  // 呼び出される側のLambda関数を実行する
  let result2 = await lambda.invoke(params).promise(); //おじさん呼びに行って返ってくるまで待つ

  
  let res = JSON.parse(result2.Payload);
 
  let res2= JSON.parse(res.body);
  console.dir(res2)
};
