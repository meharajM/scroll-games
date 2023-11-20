import express from 'express';
import cors from 'cors';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

app.get('/api/getSignedUrls/:gameName', async (req, res) => {
  const gameName = req.params.gameName;
  
  const listParams = {
    Bucket: 'scroll-gmaes',
    Prefix: 'games-builds/Games/' + gameName
  };

  try {
    const data = await s3.send(new ListObjectsV2Command(listParams));
    const files = data.Contents.map(file => file.Key);

    const response = {
      unityLoaderJsPath: '',
      dataUrl: '',
      frameworkUrl: '',
      codeUrl: ''
    };

    for (const file of files) {
      const getParams = {
        Bucket: 'scroll-gmaes',
        Key: file,
        Expires: 60 * 60, // URL expiry time in seconds
      };

      const command = new GetObjectCommand(getParams);
      const url = await getSignedUrl(s3, command, { expiresIn: getParams.Expires });

      
      console.log("file", file)
      if (file.endsWith('Game3.data')) {
        response.dataUrl = url;
      } else if (file.endsWith('Game3.framework.js')) {
        response.frameworkUrl = url;
      } else if (file.endsWith('Game3.loader.js')) {
        response.unityLoaderJsPath = url;
      } else if (file.endsWith('Game3.wasm')) {
        response.codeUrl = url;
      }
    }

    res.json({ gameName, ...response });
  } catch (err) {
    console.log(err);
  }
});

app.use('/api/Games', async (req, res) => {
  console.log(req.url, "inside Games")
  
  const params = {
    Bucket: 'scroll-gmaes',
    Key: 'games-builds/Games' + req.url,
    Expires: 60 * 30
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
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3, command, {expiresIn: params.Expires})
    console.log("url", url)
    res.json({url})
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
