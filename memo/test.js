const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();

exports.handler = async (event) => {
  let params = {
    FunctionName: `travel-lambda-dev-hello`,
    InvocationType: "RequestResponse",
    Payload: JSON.stringify({
      type: "lambda",
      path: "/travel",
      httpMethod: "POST",
      body: JSON.stringify( { 
        data: { groupId: "XXxxxxxX" }
          })
    }),
  };

  JSON.stringify();
  // 呼び出される側のLambda関数を実行する
  let result = await lambda.invoke(params).promise(); //おじさん呼びに行って返ってくるまで待つ

console.log(result)
};
