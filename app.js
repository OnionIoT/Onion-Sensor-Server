// Dependencies
var express	= require ('express');
	fs		= require ('fs');
	https	= require ('https');

// Initialise server variables
var app					= express();

var onionRestHostname 	= 'api.onion.io';
	omegaDbFile = 'omegas.json';
	secrtDbFile = 'secrets.json';

// Constructs an exec request header from known Omega attributes
function buildRPC (omega, secret) 
{
	customPath = '/v1/devices/' + omega.id + '/file/exec';
	options = 
	{
		hostname: onionRestHostname,
		path	: endpoint,
		method	: 'POST',
		headers	: 
		{
			"X-API-KEY"	: secret.owner,
			"secret" 	: secret.key
			//"command"	: omega.sensorRead.command,
			//"params"	: omega.sensorRead.params
		}
	};

	return options;
}

// TODO: figure out how to open connections and send multiple requests
/*rawTempData = [];
/*for (i = 0 ; i < omegaList.length ; i++) 
{
	options = buildRPC(omegaList[i]);
	req = https.request(options, (res) =>
			{
				console.log('Response obtained for Omega with id: ' + omegaList[i].id);
				console.log('status: ' + res.statusCode);
				console.log('with headers: ' + JSON.stringify(res.headers));
				
				res.on('data', function (chunk) 
						{
							rawTempData.push(chunk);
						});
			});
	req.end();
}*/


omegaList = JSON.parse (fs.readFileSync (omegaDbFile));
temperatureReadings = [];

//	console.log (omegaList[0]);
for (i = 0 ; i = omegaList.length ; i++)
{
	options = buildRPC (omegaList[i]);
	console.log (options);

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
		console.log (`HTTPS request error: ${e.message}`);
	});

	req.write(body);
	console.log('wrote' + body);
	req.end();
	console.log('request ended');
}

app.get('/', function (req, res) {
	res.send('pages/dash.html');
});

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
});
