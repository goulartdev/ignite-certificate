import { APIGatewayProxyHandler } from "aws-lambda"
import { document } from "src/utils/dynamodb-client"

export const handle: APIGatewayProxyHandler = async (event) => {
  const { id } = event.pathParameters;

  const response = await document.query({
    TableName: "certificates",
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": id
    }
  }).promise();

  const certificate = response.Items[0]

  if (certificate) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Valid certificate",
        name: certificate.name,
        url: `${process.env.CERTIFICATES_URL}/${id}.pdf`
      })
    }
  };

  return {
    statusCode: 400,
    body: JSON.stringify({
      message: "Invalid certificate"
    })
  };

}