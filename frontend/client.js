
const ws = new WebSocket('ws://' + window.location.hostname + ':' + window.location.port);

ws.onmessage = message =>{

    const info = JSON.parse(message.data)
    
    switch (info.cmd){
        case 'response-id':
            document.querySelector('#client-id').innerText = info.id;
            break
        case 'request-file':
            const download = document.querySelector('#download-url');
	    const oldHref = download.href;
            download.href += "/" + info.transaction_id;
            download.click();
	    download.href = oldHref;
            //window.open(document.querySelector("#download-url") + '/' + info.transaction_id, "_blank");
            //window.open(document.querySelector("#download-url") + '/' + info.transaction_id, "_blank");
	    //windoa.location.href = document.querySelector("#download-url") + '/';
            break
        case 'send-file-now':
            const form = document.querySelector('form');
            form.action += '/' + info.transaction_id;
            form.submit();
            break
    }

}


document.querySelector('#send-file-button').onclick = (event) => {
    if(document.querySelector('#friend-id').value){
        ws.send(JSON.stringify({
            cmd: 'can-send-file',
            to_client_id: document.querySelector('#friend-id').value
        }))
    }
}

