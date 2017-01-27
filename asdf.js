const https		= require('https');
const fs		= require('fs');

var onionRestHostname 	= 'api.onion.io';
	omegaDbFile = 'omegas.json';
	secrtDbFile = 'secrets.json';



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

	console.log(options);
	return options;
}


function getCloudDataz()
{
	omegaList = JSON.parse (fs.readFileSync (omegaDbFile));
	temperatureReadings = [];

	console.log ('length = ' + omegaList.length);
	for (i = 0 ; i < omegaList.length ; i++)
	{
		console.log("looping " + i);
		options = buildRPC (omegaList[i]);

		body = JSON.stringify({ 
			"command"	: omegaList[i].sensorCommand.command,
			"params"	: omegaList[i].sensorCommand.params
		});

		

		req = https.request (options, (res) => {
			console.log ('called back');
			let rawData = '';
			let parsedData = '';
			res.on ('data', (chunk) => rawData += chunk);
			res.on ('end', () => {
				console.log ('req ended');
				try {
					parsedData += JSON.parse(rawData);
					temperatureReadings.push (parsedData);
					console.log (rawData);
					console.log (parsedData);
				} catch (e) {
					console.log (e.message);
				}
				req.end();
			});
		}).on ('error', (e) => {
			if (e.statusCode == 400)
			{
				
		});

		req.write(body);
		console.log('wrote' + body);
		req.end();
		console.log('request ended');
	}
	
	console.log(temperatureReadings);
}

getCloudDataz();
