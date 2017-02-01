// Dependencies
var express	= require ('express');
	fs		= require ('fs');
	https	= require ('https');


// Initialise variables for server
var app		= express();

// Initialise variables for api handling
var onionRestHostname 	= 'api.onion.io';
	omegaDbFile = 'omegas.json';
	omegaConfigList = [];
	safeOmegaDataList = [];

const EventEmitter = require('events');
class ResponseEmitter extends EventEmitter {}
const omegaUpdateResponse = new ResponseEmitter ();

// set up response handlers 
omegaUpdateResponse.on ('success', (deviceId, data) => {
	console.log ('omegaUpdateResponse emit temp update');
	temp = data.stdout.replace('\n','');
	updateOmega (deviceId, temp, data.code);
});

omegaUpdateResponse.on ('failure', (deviceId, data) => {
	console.log ('omegaUpdateResponse emit error ' + data.statusCode);
	updateOmega (deviceId, data.message, data.statusCode);
});


// Checks for existing omega to update, does nothing if no omega found with given ID
function updateOmega (deviceId, message, statusCode)
{
	// check if existing device
	safeOmegaDataList.forEach (function (omega) {
		if (omega.deviceId == deviceId) {
			omega.statusCode = statusCode;
			if (statusCode == 0) 	{omega.temp = message; }
			else 					{omega.message = message; }
			omega.temp = message;
			omega.time =  new Date();
			console.log ('Updating omega with ID: ' + deviceId + '| Code ' + statusCode + ': ' + omega.message);
			return;
		}
	});
}

// for future use
function addOmega () {}
function initOmegaList () { 
	omegaConfigList = JSON.parse (fs.readFileSync (omegaDbFile)); 
	omegaConfigList.forEach ( function (omegaConfig) {
		safeOmega = (JSON.parse (JSON.stringify (omegaConfig)));
		delete safeOmega.apiKey;
		delete safeOmega.sensorCommand;
		safeOmegaDataList.push(safeOmega);
	});
}

// Constructs an exec request header from a given Omega
function onionCloudDevRequest (omega, ep) 
{
	endpoint = '/v1/devices/' + omega.deviceId + ep;
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

	// actual requesting
	return https.request (options, (res) => {
	//		console.log ('request ' + i + ' called back');
			let rawData = '';

			res.on ('data', (chunk) => rawData += chunk);
			res.on ('end', () => {
				console.log ('response ended ' + omega.deviceId);
				
				let parsedData = {};
				
				try			{ parsedData = JSON.parse(rawData);	}
				catch (e)	{ 
					console.log ('Unable to parse rawData: ' + e.message); 
					parsedData.message = 'Cloud response unreadable: ' + e.message;
					parsedData.statusCode = -1;
				}
				
				let responseEvent = 'failure';
				
				if (parsedData.code == 0)	
				{ responseEvent = 'success'; }

				console.log ('response code: ' + parsedData.statusCode + ' | raw: ' + rawData);
				omegaUpdateResponse.emit (responseEvent, omega.deviceId, parsedData);

			});
		}).on ('error', (e) => {
			console.log('request ERROR ' + e.message);
		});
}

// Goes through the list of known Omegas and updates each one
function omegaTempUpdate(frontendResponse)
{
	console.log (omegaConfigList);

	// Interatively updating omegas
	omegaConfigList.forEach(function (omegaConfig) {
		body = JSON.stringify (
				{ 
					"command"	: omegaConfig.sensorCommand.command,
					"params"	: omegaConfig.sensorCommand.params
				});
		// pass in the config, updates the safe list when the call returns
		req = onionCloudDevRequest (omegaConfig, '/file/exec');
		console.log(req.getHeader('X-API-KEY'));

		req.write(body);
		console.log('request wrote' + body);

		req.end();
		console.log('request ended');
		if (frontendResponse != undefined) { frontendResponse.json(safeOmegaDataList); }
	});
}

// SERVER SETUP
app.use ('/', express.static('static'));

app.get('/data', function (req, res) {
	omegaTempUpdate(res);
});

// TODO FIGURE THIS OUT
var port = process.env.PORT || 8080;
var updateInterval = 5000;

app.listen(port, function () {
	// Loading the config list once
	console.log('Example app listening on port ' + port);
	initOmegaList();
	omegaTempUpdate();
	setInterval(function(){	omegaTempUpdate(); }, updateInterval);
});
