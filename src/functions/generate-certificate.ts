import { S3 } from "aws-sdk";
import chromium from "chrome-aws-lambda";
import dayjs from "dayjs";
import fs from "fs";
import handlebars from "handlebars";
import path from "path";

import { document } from "src/utils/dynamodb-client"

interface CreateCertificateDTO {
  id: string;
  name: string;
  grade: string;
}

interface TemplateData {
  id: string;
  name: string;
  grade: string;
  date: string;
  medal: string;
}

const compile = async function (data: TemplateData) {
  const filePath = path.join(process.cwd(), 'src', 'templates', 'certificate.hbs');
  const html = fs.readFileSync(filePath, "utf-8")

  return handlebars.compile(html)(data);
}

const loadMedal = async function (): Promise<string> {
  const medalPath = path.join(process.cwd(), 'src', 'static', 'selo.png');
  const medal = fs.readFileSync(medalPath, "base64");

  return medal;
}

const toPDF = async function (content): Promise<Buffer> {
  const browser = await chromium.puppeteer.launch({
    headless: true,
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
  })

  const page = await browser.newPage();

  await page.setContent(content);

  const pdf = await page.pdf({
    format: "a4",
    landscape: true,
    path: process.env.IS_OFFLINE ? "tmp/certificate.pdf" : null,
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();

  return pdf;
}

const saveToS3 = async function (id: string, file: Buffer): Promise<string> {
  const s3 = new S3();

  await s3.putObject({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${id}.pdf`,
    ACL: "public-read",
    Body: file,
    ContentType: "application/pdf"
  }).promise();

  return `${process.env.CERTIFICATES_URL}/${id}.pdf`
}

const getExistingCertificate = async function (id: string) {
  const response = await document.query({
    TableName: "certificates",
    KeyConditionExpression: "id = :id",
    ExpressionAttributeValues: {
      ":id": id
    }
  }).promise();

  const certificate = response.Items[0];

  return certificate;
}

export const handle = async (event) => {
  const { id, name, grade } = JSON.parse(event.body) as CreateCertificateDTO;

  const existingCertificate = await getExistingCertificate(id);

  if (!existingCertificate) {
    await document.put({
      TableName: "certificates",
      Item: {
        id,
        name,
        grade,
      }
    }).promise();
  }

  const date = dayjs().format("DD/MM/YYYY");
  const medal = await loadMedal();

  const pdfContent = await compile({
    id,
    name,
    grade,
    date,
    medal
  })

  const pdf = await toPDF(pdfContent);

  const url = await saveToS3(id, pdf);

  return {
    statusCode: 201,
    body: JSON.stringify({
      message: "Certificate created",
      url
    }),
    headers: {
      "Content-Type": "application/json"
    }
  }
}