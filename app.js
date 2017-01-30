// Dependencies
var express	= require ('express');
	fs		= require ('fs');
	https	= require ('https');

// Initialise variables for server
var app					= express();

// Initialise variables for api handling
var onionRestHostname 	= 'api.onion.io';
	omegaDbFile = 'omegas.json';
	omegaDataList = {};
	omegaList = {};
	safeOmegaList = {};
	updateFlag = 0;

const EventEmitter = require('events');
class ResponseEmitter extends EventEmitter {}
const omegaUpdateResponse = new ResponseEmitter ();

// set up response handlers 
omegaUpdateResponse.on ('success', (deviceId, data) => {
	console.log ('omegaUpdateResponse emit temp update');
	updateOmega (deviceId, data.stdout, data.code);
});

omegaUpdateResponse.on ('failure', (deviceId, data) => {
	console.log ('omegaUpdateResponse emit invalid key');
	updateOmega (deviceId, data.message, data.statusCode);
});


// Checks for existing omega to update, does nothing if no omega found with given ID
function updateOmega (deviceId, message, statusCode)
{
	// check if existing device
	
	if (omegaDataList[deviceId] != undefined) {
		omegaDataList[deviceId].statusCode = statusCode;
		omegaDataList[deviceId].message = message;
		console.log ('Updating omega with ID: ' + deviceId + '| Code ' + statusCode + ': ' + omegaDataList[deviceId].message);
		return;
	} 
}

// for future use
function addOmega (){}

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
function omegaTempUpdate()
{
	omegaDataList = JSON.parse (fs.readFileSync (omegaDbFile));
	console.log (omegaDataList);

	omegaIdList = Object.keys(omegaDataList);
	console.log (omegaIdList);
	
	listSize = omegaIdList.length;
	console.log (listSize);

	for (i = 0 ; i < listSize ; i++)
	{
		currDevice = omegaIdList [i];

//		safeOmegaList[currDevice] = omegaDataList[currDevice];
//		safeOmegaList[currDevice].apiKey = '';
		body = JSON.stringify({ 
			"command"	: omegaDataList[currDevice].sensorCommand.command,
			"params"	: omegaDataList[currDevice].sensorCommand.params
		});

		req = onionCloudDevRequest (omegaDataList[currDevice], '/file/exec');

		console.log(req.getHeader('X-API-KEY'));

		req.write(body);
		console.log('request wrote' + body);

		req.end();
		console.log('request ended');
	}
	
	return omegaDataList;
}

// SERVER SETUP
app.use (express.static('static'));

app.get('/data', function (req, res) {
	res.json(omegaDataList);
});

app.get('/', function (req, res) {
	res.redirect('/pages/home.html');
});

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
	setInterval(function(){	omegaTempUpdate(); }, 3000);
});
