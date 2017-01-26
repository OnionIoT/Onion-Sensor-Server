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



app.get('/', function (req, res) {
	res.send(:q)
});

app.listen(3000, function () {
	console.log('Example app listening on port 3000!')
});
