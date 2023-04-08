const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('server.maxHeaderSize', '100000000');

// Serve the static files from the Games directory
app.use('/games/:game_id', (req, res, next) => {
    console.log("serving game");
    const game_id = req.params.game_id;
    const game_path = path.join(__dirname, 'Games', game_id, 'Build');
    
    // Check if the requested game directory exists
    if (fs.existsSync(game_path)) {
      // Serve the contents of the requested game directory
      express.static(game_path)(req, res, next);
    } else {
      // If the game directory does not exist, send a 404 error
      res.status(404).send('Game not found');
    }
});  

// Serve the React code from the client directory
app.use('/', express.static(path.join(__dirname, 'client')));

// If the requested resource is not found in the client directory, send the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/public', 'index.html'));
});

// Start the server
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

// Set maxHeaderSize to 1MB
server.maxHeadersCount = 1000;
server.maxHeaderSize = '1000000';
