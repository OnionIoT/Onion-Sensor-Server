const https		= require('https');
const fs		= require('fs');

var onionRestHostname 	= 'api.onion.io';
	omegaDbFile = 'omegas.json';
	secrtDbFile = 'secrets.json';



// Constructs an exec request header from known Omega attributes
function buildRPC (omega, secret)
{
	endpoint = '/v1/devices/' + omega.id + '/system/board';
	console.log(endpoint);
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

function getCloudDataz()
{
	omegaList = JSON.parse (fs.readFileSync (omegaDbFile));
	secrtList = JSON.parse (fs.readFileSync (secrtDbFile));

	console.log (omegaList[0]);
	console.log (secrtList[0]);

	options = buildRPC (omegaList[0], secrtList[0]);
	console.log (options);
	req = https.request (options, (res) => {
		console.log ('called back');
		let rawData = '';
		let parsedData = '';
		res.on ('data', (chunk) => rawData += data);
		res.on ('end', () => {
			console.log ('req ended');
			try {
				parsedData += JSON.parse(rawData);
				console.log (parsedData);
			} catch (e) {
				console.log (e.message);
			}
			req.end();
		});
	}).on ('error', (e) => {
		console.log (`HTTPS request error: ${e.message}`);
	});

	
}

getCloudDataz();
