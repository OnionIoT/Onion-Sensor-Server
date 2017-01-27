// Dependencies
var express	= require ('express');
	fs		= require ('fs');
	https	= require ('https');

// Initialise server variables
var app					= express();
var onionRestHostname 	= 'api.onion.io';
	omegaDbFile = 'omegas.json';
	omegaDataList = [];

const EventEmitter = require('events');
class ResponseEmitter extends EventEmitter {}
const cloudResponse = new ResponseEmitter ();
const resCode = {
		404			: 'device not found',
		400			: 'invalid key',
		'undefined'	: 'temperature update'
}


// set up response handler
cloudResponse.on ('temperature update', (temp, deviceId) => {
	console.log ('cloudResponse on temp update');
	for (i = 0 ; i < omegaDataList.length ; i++) 
	{
		console.log (omegaList[i].deviceId + " :: " + deviceId);
		// check if existing device
		if (omegaDataList[i].deviceId == deviceId) {
			omegaDataList[i].temperature = temp;
			console.log ('00000000');
			console.log (omegaDataList);
			return;
		} 
	}

	// adds new device if not known
	let o = {};
		o.deviceId = deviceId;
		o.temperature = temp;
	omegaDataList.push (o);
});

cloudResponse.on ('invalid key', (message, deviceId) => {
	console.log ('key is invalid as hell');
});

cloudResponse.on ('device offline', (message, deviceId) => {
	console.log ('device offline as hell');
});

// utility
function knownDevices () { return omegaDataList.map (function(a){return a.deviceId;}); }

// Constructs an exec request header from known Omega attributes
function buildRequest (omega) 
{
	endpoint = '/v1/devices/' + omega.deviceId + '/file/exec';
	options = 
	{
		hostname: onionRestHostname,
		path	: endpoint,
		method	: 'POST',
		headers	: 
		{
			"X-API-KEY"	: omega.apiKey,
		}
	};

	// adding an element to temperature list for each device, matched by device ID
	

	return https.request (options, (res) => {
	//		console.log ('request ' + i + ' called back');
			let rawData = '';
			res.on ('data', (chunk) => rawData += chunk);
			res.on ('end', () => {
				console.log ('response ended ' + omega.deviceId);
				
				let parsedData = {};
				try { parsedData = JSON.parse(rawData);	}
				catch (e) { console.log ('try eeerrroorrrr.message ' + e.message); }
				
				console.log ('response code: ' + parsedData.statusCode + ' | raw: ' + rawData);
				cloudResponse.emit(resCode[parsedData.statusCode], rawData, omega.deviceId);

			});
		}).on ('error', (e) => {
			console.log('request ERROR ' + e.message);
		});
}


// TODO: figure out how to open connections and send multiple requests
function requestCloudTemp(clientResponse)
{
	omegaList = JSON.parse (fs.readFileSync (omegaDbFile));

//	console.log ('length = ' + omegaList.length);

	for (i = 0 ; i < omegaList.length ; i++)
	{
//		console.log("looping " + i);
		body = JSON.stringify({ 
			"command"	: omegaList[i].sensorCommand.command,
			"params"	: omegaList[i].sensorCommand.params
		});

		req = buildRequest (omegaList[i]);

		req.write(body);
		console.log('request wrote' + body);

		req.end();
		console.log('request ended');
	}
	// TODO: get a better way to wait it
	clientResponse.send(omegaDataList);
}


app.get('/data', function (req, res) {
	requestCloudTemp(res);
});

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
});
