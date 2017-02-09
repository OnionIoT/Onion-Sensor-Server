// Dependencies
var express	= require ('express');
	fs		= require ('fs');
	https	= require ('https');
	_			= require ('lodash');
	bodyParser 	= require('body-parser');


// Initialise server variables
var app		= express();
	port = process.env.PORT || 8080;
	updateInterval = 60000;
	onionCloudHostname 	= 'api.onion.io';

// bodyParser
app.use(bodyParser.json());

// Initialise device storage variables
var	deviceDbFile = 'devices.json';
	deviceList = [];

// Starting the server
app.listen (port, function () {
	console.log('Example app listening on port ' + port);

	// Loading the config list once
	deviceList = JSON.parse (fs.readFileSync (deviceDbFile));
	
	// Initial update
	deviceTempUpdate();

	// Set up a periodic updater - this is kept alive, and dies with server
	setInterval(function(){	deviceTempUpdate(); }, updateInterval);
});
// ---- SERVER SETUP and ROUTING

// This serves the static directory as root '/', and autoroutes root to index.html
app.use ('/', express.static('static'));

// GET endpoint to request temperature data
// -> Calls cloud to execute sensor data retreival script on *all* devices in deviceList
// -> Extracts only relevant data from deviceList into new array of device objects
// and returns it as JSON
app.get('/data', function (req, res) {
	var fullResponse = [];

	deviceList.forEach(function (device) {
		var deviceResponse = {
			displayName: device.displayName,
			deviceId: device.deviceId,
			statusCode: device.statusCode,
			temp: device.temp,
			message: device.message,
			time: device.time,
			writable:_.get(device, 'writable', true)
		};

		fullResponse.push(deviceResponse);
	})

	console.log('responding to GET /data with ', fullResponse);
	res.json(fullResponse);
});

/** POST endpoint, accepts a single device and adds it to the devices.json file
 *
 * ~~~ Required body fields
 * "deviceId", 
 * "apiKey", 
 * "sensorCommand", 
 * "displayName"
 *
 * TODO add "deviceLocation" handling
 */
app.post('/devices', function (req, res) {
	var params = req.body;
	console.log('received POST to /devices, req.body is ', req.body);

	// ensure all required parameters are in the request
	if (!_.has(params, 'deviceId')) {
		res.status(400).json({
			error: 'Missing deviceId parameter'
		});
	} else if (!_.has(params, 'apiKey')) {
		res.status(400).json({
			error: 'Missing apiKey parameter'
		});
	} else if (!_.has(params, 'sensorCommand')) {
		res.status(400).json({
			error: 'Missing sensorCommand parameter'
		});
	} else if (!_.has(params, 'displayName')) {
		res.status(400).json({
			error: 'Missing displayName parameter'
		});
	} else {
		// If nothing is missing, add device to the List
		addDeviceConfig(params.deviceId, params.apiKey, params.sensorCommand, params.displayName, _.get(params, 'deviceLocation', ''));

		// Trigger an update
		deviceTempUpdate();

		// respond with a success message and the ID of added device
		res.status(201).json({
			device: params.deviceId,
			status: 'success'
		});
	}

});

/** DELETE /devices endpoint
 * deletes the device from deviceList selected by deviceId
 * returns:
 * 400 - missing deviceId
 * 200 - delete successful
 *
 */ // TODO too many arguments check for all endpoints
app.delete('/devices/:deviceId', function (req, res) {
	var params = req.params;
	console.log('received DELETE to /devices, req.body is ', req.params);

	// Checks the request uri for deviceId
	if (_.has(params, 'deviceId')) 
	{
		var index = deviceList.findIndex(function (element) {
			return element.deviceId === params.deviceId;
		});

		if (index >= 0) { // Found device
			if (_.get(deviceList[index], 'writable', true) === true) { 
				// if device is writable, delete it
				deviceList.splice(index, 1);
				fs.writeFileSync('devices.json', JSON.stringify(deviceList, null, 4));
				res.status(200).json({
					'body'	: params,
					status	: 'Delete successful'
				});
			} else { // device is not writable, do not delete, respond with error
				res.status(403).json({
					'body'	: params,
					status	: 'Device is not removeable'
				});
			}
		} else { //If device does not exist in server lists, respond  not found
			res.status(404).json({
				'body'	: params,
				status	: 'Device not found'
			});
		}
	} else { // if there is no device id in request, respond with error
		res.status(400).json({
			'body'	: params,
			status	: 'Missing deviceId'
		});
	}
});


// Changes device data according to arguments, device identified by **index** here
function updateDevice (index, code, temp, message)
{
		deviceList[index]['statusCode'] = code;
		deviceList[index]['temp'] = temp;
		deviceList[index]['message'] = message;
		deviceList[index]['time'] = new Date();

		console.log ('Updating device with ID: ' + deviceList[index].deviceId + '| Code ' + code + ': ' + message + ' ' + temp);
}

// Adds a device to the list with given arguments as initial properties
function addDeviceConfig (deviceId, apiKey, sensorCommand, displayName, deviceLocation)
{
	deviceConfig = {
		"deviceId" 			: deviceId,
		"apiKey" 			: apiKey,
		"sensorCommand" 	: sensorCommand,
		"displayName" 		: displayName,
		"deviceLocation" 	: deviceLocation || '',
		"writable"			: true						// Defaults to writable for easy cleanup
	};

	// Add it to the master config list and writes to file THIS IS BLOCKING!
	deviceList.push(deviceConfig);
	fs.writeFileSync('devices.json', JSON.stringify(deviceList, null, 4));
}

// Constructs an exec request header from a given Omega
function onionCloudDevRequest (device, ep)
{
	// Build the request endpoint from the given arguments
	endpoint = '/v1/devices/' + device.deviceId + ep;

	// Construct the header json
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

	// Making the request to api.onion.io
	return https.request (options, (res) => {
			let rawData = '';
			// The two lines below are event handlers that, in order:
			// - read the raw data from the request and append it to a local variable
			// - parse the raw data as soon as the stream ends, and decide what updates
			//		can be made to the deviceList
			res.on ('data', (chunk) => rawData += chunk);
			res.on ('end', () => { // Function below handles updating the device based on response once response is returned
				console.log ('response ended ' + device.deviceId);

				let parsedData = {};

				try			{ parsedData = JSON.parse(rawData);	}
				catch (e)	{
					console.log ('Unable to parse rawData: ' + e.message);
					parsedData.message = 'Cloud response unreadable: ' + e.message;
					parsedData.statusCode = -1;
				}


				var code;
				var temp;
				var message;
				// Checks a bunch of conditions for the response,
				// appropriately determines the way the device data (temperature, message, etc.)
				// If successfully updated (code == 0), returns temp, code 0, success message
				// Else keeps original temperature and returns appropriate code and error message given
				if (_.has(parsedData, 'statusCode')) { 				// Case for cloud service returns error, returns the error message
					code 	= parsedData.statusCode;
					temp 	= device.temp;
					message = parsedData.message;
					console.log ('Response returned http error ' + code);
				} else if (_.has(parsedData, 'stderr')) { 			// Case for device returns some error, returns the stderr as message
					code 	= parsedData.code;
					temp 	= device.temp;
					message = parsedData.stderr;
					console.log ('Response returned device error ' + code);
				} else if (_.has(parsedData, 'stdout')) { 			// Case of successful data return
					code 	= parsedData.code;
					temp 	= parsedData.stdout.split('\n')[0];
						// if the returned data isn't a number, sets code to 1
						// this alerts client to display message instead of temp
						if ((!isNaN(parseFloat(temp)) && isFinite(temp)) == false) { 
							code = '1';
						}

					message = "Success!";
					console.log ('Response returned success ' + code + temp);
				} else { 											// See log comment below
					console.log('Something very strange happened with the cloud response data.');
					return;
				}

				// Findes the device in the list
				var index = deviceList.findIndex(function (element) {
					return element.deviceId === device.deviceId;
				});
				
				// Calls an update
				updateDevice(index, code, temp, message);
				console.log ('response code: ' + code + ' | raw: ' + rawData); 
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

		req.write(body);
		console.log('Cloud request wrote' + body);

		req.end();
		console.log('Cloud request ended');
	});
}

