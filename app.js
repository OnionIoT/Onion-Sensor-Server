// Dependencies
var express	= require ('express');
	fs		= require ('fs');
	https	= require ('https');
	_			= require ('lodash');
	bodyParser 	= require('body-parser');


// Initialise variables for server
var app		= express();
	onionCloudHostname 	= 'api.onion.io';

app.use(bodyParser.json());

// Initialise variables for api handling
var	deviceDbFile = 'devices.json';
	deviceList = [];

function updateDevice (index, code, temp, message)
{
		deviceList[index]['statusCode'] = code;
		deviceList[index]['temp'] = temp;
		deviceList[index]['message'] = message;
		deviceList[index]['time'] = new Date();

		console.log ('Updating device with ID: ' + deviceList[index].deviceId + '| Code ' + code + ': ' + message + ' ' + temp);
}

// for future use
function addOmegaConfig (deviceId, apiKey, sensorCommand, displayName, deviceLocation)
{
	deviceConfig = {
		"deviceId" 			: deviceId,
		"apiKey" 			: apiKey,
		"sensorCommand" 	: sensorCommand,
		"displayName" 		: displayName,
		"deviceLocation" 	: deviceLocation || '',
		"writable"			: false
	};

	// add it to the master config list
	deviceList.push(deviceConfig);
	fs.writeFileSync('devices.json', JSON.stringify(deviceList, null, 4));
}

// Constructs an exec request header from a given Omega
function onionCloudDevRequest (device, ep)
{
	endpoint = '/v1/devices/' + device.deviceId + ep;
	options =
	{
		hostname: onionCloudHostname,
		path	: endpoint,
		method	: 'POST',
		headers	:
		{
			"X-API-KEY"	: device.apiKey,
		}
	};

	// actual requesting
	return https.request (options, (res) => {
	//		console.log ('request ' + i + ' called back');
			let rawData = '';

			res.on ('data', (chunk) => rawData += chunk);
			res.on ('end', () => {
				console.log ('response ended ' + device.deviceId);

				let parsedData = {};

				try			{ parsedData = JSON.parse(rawData);	}
				catch (e)	{
					console.log ('Unable to parse rawData: ' + e.message);
					parsedData.message = 'Cloud response unreadable: ' + e.message;
					parsedData.statusCode = -1;
				}


				if (_.has(parsedData, 'statusCode')) { 				// Case for cloud service returns error
					var code 	= parsedData.statusCode;
					var temp 	= 0.0;
					var message = parsedData.message;
					console.log ('Response returned http error ' + code);
				} else if (_.has(parsedData, 'stderr')) { 			// Case for device returns some error
					var code 	= parsedData.code;
					var temp 	= 0.0;
					var message = "Device command returned error";
					console.log ('Response returned device error ' + code);
				} else if (_.has(parsedData, 'stdout')) { 			// Case of successful data return
					var code 	= parsedData.code;
					var temp 	= parsedData.stdout.split('\n')[0];
					var message = "Device command returned success";
					console.log ('Response returned success ' + code);
				} else { 											// See log comment below
					console.log('Something very strange happened with the cloud response data.');
					return;
				}


				var index = deviceList.findIndex(function (element) {
					return element.deviceId === device.deviceId;
				});

				updateDevice(index, code, temp, message);
				console.log ('response code: ' + parsedData.statusCode + ' | raw: ' + rawData); 
			});
		}).on ('error', (e) => {
			console.log('request ERROR ' + e.message);
		});
}

// Goes through the list of known Omegas and updates each one
function deviceTempUpdate()
{
	console.log (deviceList);

	// Interatively updating devices
	deviceList.forEach(function (deviceConfig) {
		command = deviceConfig.sensorCommand.split(" ");
		body = JSON.stringify (
				{
					"command"	: command[0],
					// body.params must be ARRAY!
					"params"	: command.slice(1)
				});
		// pass in the config, updates the safe list when the call returns
		req = onionCloudDevRequest (deviceConfig, '/file/exec');
		console.log(req.getHeader('X-API-KEY'));

		req.write(body);
		console.log('request wrote' + body);

		req.end();
		console.log('request ended');
	});
}

// SERVER SETUP
app.use ('/', express.static('static'));

app.get('/data', function (req, res) {
	var fullResponse = [];

	deviceList.forEach(function (device) {
		var deviceResponse = {
			displayName: device.displayName,
			deviceId: device.deviceId,
			statusCode: device.statusCode,
			temp: device.temp,
			message: device.message,
			time: device.time
		};

		fullResponse.push(deviceResponse);
	})

	console.log('responding to GET /data with ', fullResponse);
	res.json(fullResponse);
});

app.post('/add', function (req, res) {
	var params = req.body;
	console.log('received POST to /add, req.body is ', req.body);

	// ensure all required parameters are in the request
	if (!_.has(params, 'deviceId')) {
		// respond with an error message
		res.status(400).json({
			error: 'Missing deviceId parameter'
		});
	} else if (!_.has(params, 'apiKey')) {
		// respond with an error message
		res.status(400).json({
			error: 'Missing apiKey parameter'
		});
	} else if (!_.has(params, 'sensorCommand')) {
		// respond with an error message
		res.status(400).json({
			error: 'Missing sensorCommand parameter'
		});
	} else if (!_.has(params, 'displayName')) {
		// respond with an error message
		res.status(400).json({
			error: 'Missing displayName parameter'
		});
	} else {
		// add to the config
		addOmegaConfig(params.deviceId, params.apiKey, params.sensorCommand, params.displayName, _.get(params, 'deviceLocation', ''));

		// trigger an update
		deviceTempUpdate();

		// respond with a success message
		res.json({
			device: params.deviceId,
			status: 'success'
		});
	}

});


var port = process.env.PORT || 8080;
var updateInterval = 60000;

app.listen (port, function () {
	// Loading the config list once
	console.log('Example app listening on port ' + port);
	deviceList = JSON.parse (fs.readFileSync (deviceDbFile));
	deviceTempUpdate();
	setInterval(function(){	deviceTempUpdate(); }, updateInterval);
});
