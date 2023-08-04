// DISCLAIMER
// PS: The website was not designed first only for a Proof of Concept, it is NOT secure: the implementations of the most basic secure procedures are yet to be made.

/*
THE PROTOCOl
------------

The server will mediate the messages between the two peers

1. The sender will tell the server to start a file transaction using 'can-send-file':
{
    'cmd': 'can-send-file',
    'to_cliend_id': RECEIVER_ID
} -> 2.


2. The server (after recieveing a 'can-send-file') will make the receiver ask for the file using 'request-for-file':
{
    'cmd': 'request-for-file',
    'transaction_id': RANDOM_GENERATED_ID_FOR_FILE_TRANSACTION
}

3. The receiver will send a File Request via http GET request at '/download_file:transaction_id': -> 4.

4. The server will tell the sender to Upload File via http POST request at '/upload_file:transaction_id'

*/

const { WebSocketServer } = require('ws');
const formidable = require('formidable');
const express = require('express');
const crypto = require("crypto");
const http = require('http');
const fs = require('fs');
const app = express();

const server = http.createServer(app);

// Saves the clients who are connected to the server
const connectedClients = {}

// Saves the file transactions information
const transactions = {}

function generateClientId(){
    do{
        clientId = crypto.randomBytes(16).toString("hex").substring(0,4);
    }while(connectedClients[clientId]);
    return clientId;
}
function generateTransactionId(){
    do{
        transactionId = crypto.randomBytes(16).toString("hex");
    }while(transactions[transactionId])
    return transactionId;
}

wsServer = new WebSocketServer({ server });

wsServer.on('connection', connection => {

    // Generate client id
    const clientId = generateClientId();
    connectedClients[clientId] = connection;

    // Send the client id to the peer
    connection.send(JSON.stringify({
        cmd: 'response-id',
        id: clientId
    }));

    connection.on('message', data => {        

        const info = JSON.parse(data);

        switch(info.cmd){

            case 'can-send-file':
                // Generate uuid
                
		// If the client doesn't exist, get out of function
		if(!connectedClients[info.to_client_id]){return;}

                const transactionId = generateTransactionId();
                
                transactions[transactionId] = {
                    from: connection,
                    filename: info.filename
                }


                // info.to_client_id -> BOB

                // Tells BOB to request the file

                connectedClients[info.to_client_id].send(JSON.stringify({
                    cmd: 'request-file',
                    transaction_id: transactionId
                }));
                break;
            

        }

    });

    //https://oieduardorabelo.medium.com/node-js-usando-websockets-5d642456d1f3
    connection.on('close', closedConnection => {
        delete connectedClients[clientId];
    })

});

// This is a crime sorry
app.use('/', express.static('../frontend'));


// Download file
app.get('/api/download_file/:transaction_id', (req, res) => {

    const transactionId = req.params.transaction_id;
    
    const transaction = transactions[req.params.transaction_id]
    
    // Saving BOB
    transactions[transactionId].to = res;
    
    alice = transaction.from
    // Tells Alice she can send the file
    alice.send(JSON.stringify({
        cmd: 'send-file-now',
        transaction_id: req.params.transaction_id
    }))

})

// Upload file
app.post('/api/upload_file/:transaction_id', (req, res) => {

    const transactionId = req.params.transaction_id;

    const form = formidable({
            // Allows any file size
            maxFileSize:Infinity,

            // Pipes file data to -> /dev/null
            fileWriteStreamHandler:

                (volatileFile) => {
                    
                    // Getting BOB
                    recieverStream = transactions[transactionId].to;

                    if (!recieverStream) {return fs.createWriteStream('/dev/null')}
                    
                    recieverStream.writeHead(200, {
                        "Content-Type": "application/octet-stream",
                        "Content-Disposition": "attachment; filename=" + volatileFile.originalFilename,
                    })
                    return recieverStream;
                            
            }})

    
    form.parse(req, (err, fields, files) => {

        // After transaction remove IDs from dictionaries
        res.send(err ? "didn't work =(": "worked :))")
        delete transactions[transactionId];
    })

})

server.listen(8000);
