import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve gamesMeta.json file
app.get('/api/gamesMeta', (req, res) => {
    console.log("inside gamesMeta ")
    // res.sendFile(path.join(__dirname, '../Games/gamesMeta.json'));
});
app.use('/Games', (req, res) => {
    console.log(req.url, "inside Games")
    const gameDirectory = path.join(__dirname, '/Games', req.url);
    res.sendFile(gameDirectory);
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
