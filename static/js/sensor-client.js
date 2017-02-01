var omegaDataList = {};
var autoUpdater = setInterval(updateTemp(), 1000);
var currTempUnit = 'c';
var statusCodeMessage = 
{
	'0'		: 'ONLINE',
	'400'	: 'ERROR',
	'401'	: 'ERROR',
	'404'	: 'OFFLINE'
};

var tempUnit = {
	'k'	: ' K',
	'f'	: ' °F',
	'c'	: ' °C'
};

var tempConvert = {
	'k'	: (t) => { return (273.15+parseFloat(t)); },
	'f'	: (t) => { return (t * 1.8 + 32); },
	'c'	: (t) => { return t; }
};

function buttonHit()
{
	console.log ('update button pressed.');
	updateTemp();
}

function setCurrTempUnit (u) 
{
	currTempUnit = u; 
	renderOmegaList();
}

function renderOmegaList() 
{
	omegaDataList.forEach( function (omega) {// TODO check for undefined, don't update it if so, change to use foreach

		time = Date(omega.time).toLocaleString();
	
		description = '0';
		cardStyle = 'card';
		if (omega.statusCode == 0 || omega.statusCode == 404)
		{
			if (omega.statusCode == 0)
			{
				// Data sanitisation is done server-side, this should be 100% float manipulation
				description = tempConvert[currTempUnit](omega.temp);
				console.log(description);
				description = Number(description).toFixed(2);
				description = description + tempUnit[currTempUnit];
			} else
			{	cardStyle += ' card-outline-warning'; }
		} else
		{
			cardStyle += ' card-outline-danger';
			description = omega.message;
		}

		console.log(omega.displayName + ' - ' + 
					omega.statusCode + ' @' + 
					time + ' | ' + 
					description);

		// Checking for new omega/updating current omega
		if($('#'+ omega.deviceId).length) 
		{
			$('#' + omega.deviceId).attr( { "class" : cardStyle } );
			$('#' + omega.deviceId + ' h6.card-subtitle')	.html( statusCodeMessage[omega.statusCode] );
			$('#' + omega.deviceId + ' p.card-text')		.html( description);
			$('#' + omega.deviceId + ' div.card-footer')	.html( time);
		} else 
		{
			appendString =  '<div class="' + cardStyle + '" id="' + omega.deviceId + '">';
			appendString += '<div class="card-block">';
				appendString += '<h4 class="card-title">' 						+ omega.displayName + '</h4>';
				appendString += '<h6 class="card-subtitle mb-2 text-muted">' 	+ statusCodeMessage[omega.statusCode] + '</h6>';
				appendString += '<p class="card-text description">' 						+ description + '</p>';
			appendString += '</div>';
			appendString += '<div class="time-text card-footer text-muted">' 				+ omega.time;
			appendString += '</div></div>';
			console.log(appendString);
			$('#omega-list').append(appendString);
		}
	}); // forEach ends here
}

function updateTemp()
{
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			omegaDataList = JSON.parse(this.responseText);
			renderOmegaList();
		}
	};
	xhttp.open("GET", "/data", true);
	xhttp.send();
}
