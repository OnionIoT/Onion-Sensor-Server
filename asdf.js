const https		= require('https');
const fs		= require('fs');

var onionRestHostname 	= 'api.onion.io';
	omegaDbFile = 'omegas.json';
	secrtDbFile = 'secrets.json';
	tempDataList = [];



// Constructs an exec request header from known Omega attributes
function buildRPC (omega)
{
	endpoint = '/v1/devices/' + omega.deviceId + '/file/exec';
//	endpoint = '/v1/devices/' + '000' + '/file/exec';
	options = 
	{
		hostname: onionRestHostname,
		post 	: 443,
		path	: endpoint,
		method	: 'POST',
		headers	: {
			"X-API-KEY"	: omega.apiKey,
		},

	};

	console.log('RPC built');
	return options;
}


function getCloudDataz()
{
	omegaList = JSON.parse (fs.readFileSync (omegaDbFile));

//	console.log ('length = ' + omegaList.length);

	for (i = 0 ; i < omegaList.length ; i++)
	{
//		console.log("looping " + i);
		options = buildRPC (omegaList[i]);

		body = JSON.stringify({ 
			"command"	: omegaList[i].sensorCommand.command,
			"params"	: omegaList[i].sensorCommand.params
		});
		
		// adding an element to temperature list for each device, matched by device ID
		let d = {};
			d.deviceId = omegaList[i].deviceId;
		tempDataList.push (d);
		

		req = https.request (options, (res) => {
//			console.log ('request ' + i + ' called back');
			let rawData = '';
			let tempDataJson = '';
			res.on ('data', (chunk) => rawData += chunk);
			res.on ('end', () => {
				console.log ('response ended');
				try {
					parsedData += JSON.parse(rawData);
					// FUTURE: potentially handle error here - right now sends the error message to user	
					// flag maybe?
					tempDataList[i].data = parsedData.message;

					//console.log (rawData);
					//console.log (parsedData);
				} catch (e) {
					console.log ('no data ' + e.message);
				}

			});
		}).on ('error', (e) => {
			console.log('request ERROR ' + e.message);
		});

		req.write(body);
		console.log('request wrote' + body);
		req.end();
		console.log('request ended');
	}
}
// TODO fix the stupid func name and migrate to app.js
getCloudDataz();
