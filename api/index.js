import express from 'express';
import cors from 'cors';
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from 'stream';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
import dotenv from 'dotenv';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

dotenv.config();
// Enable CORS for all routes
app.use(cors());
console.log("process.env.AWS_ACCESS_KEY_ID,", process.env.AWS_ACCESS_KEY_ID)
console.log("process.env.AWS_SECRET_ACCESS_KEY", process.env.AWS_SECRET_ACCESS_KEY)
// Configure AWS SDK
const s3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

app.get('/api/gamesMeta', async (req, res) => {
  console.log("inside gamesMeta ")
  
  const params = {
    Bucket: 'scroll-gmaes',
    Key: 'games-builds/Games/gamesMeta.json'
  };

  try {
    const data = await s3.send(new GetObjectCommand(params));
    data.Body.pipe(res)
  } catch (err) {
    console.log(err);
  }
});

app.use('/api/Games', async (req, res) => {
  console.log(req.url, "inside Games")
  
  const params = {
    Bucket: 'scroll-gmaes',
    Key: 'games-builds/Games' + req.url
  };

  // Set the correct MIME type for Unity WebGL files
  if (req.url.endsWith('.data')) {
    res.type('application/octet-stream');
  } else if (req.url.endsWith('.mem')) {
    res.type('application/octet-stream');
  } else if (req.url.endsWith('.unityweb')) {
    res.type('application/octet-stream');
  }

  try {
    const data = await s3.send(new GetObjectCommand(params));
    data.Body.pipe(res);
  } catch (err) {
    console.log(err);
  }
});

// Check if the code is running on Vercel
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Export your app
export default app;
