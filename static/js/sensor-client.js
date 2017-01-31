var omegaDataList = {};
var currTempUnit = 'c';
var statusCodeMessage = 
{
	'0'		: 'Temperature: ',
	'400'	: 'Device error: ',
	'401'	: 'Device error: ',
	'404'	: 'Device error: '
};

var tempUnit = {
	'k'	: ' K',
	'f'	: ' °F',
	'c'	: ' °C'
};

var tempConvert = {
	'k'	: (t) => { return t + 273.15; },
	'f'	: (t) => { return (t * 1.8 + 32); },
	'c'	: (t) => { return t; }
};

function renderOmegaList() {


	omegaDataList.forEach( function (omega) {// TODO check for undefined, don't update it if so, change to use foreach
		console.log(omega.displayName);
		console.log(omega.message);
		if (omega.displayName != undefined && omega.message != undefined )
		{
			cardStyle = 'card';

			if(omega.statusCode != 0)
			{
				cardStyle += ' card-outline-danger';
				description = omega.message;
			} else
			{
				// Data sanitisation is done server-side, this should be 100% float manipulation
				description = tempConvert[currTempUnit](omega.message);
				description = description + tempUnit[currTempUnit];
			}
			if($('#'+ omega.deviceId).length) 
			{
				$('#' + omega.deviceId).attr( { "class" : cardStyle } );
				$('#' + omega.deviceId + ' h6.card-subtitle').html(omega.statusCode);
				$('#' + omega.deviceId + ' p.card-text').html(description);
			} else 
			{
				appendString =  '<div class="card ' + cardStyle + ' id="' + omega.deviceId + '">';
				appendString += '<div class="card-block">';
					appendString += '<h4 class="card-title">' + omega.displayName + '</h4>';
					appendString += '<h6 class="card-subtitle mb-2 text-muted">' + statusCodeMessage[omega.statusCode] + '</h6>';
					appendString += '<p class="card-text">' + description + '</p>';
				appendString += '</div></div>';
				console.log(appendString);
				$('#omega-list').append(appendString);
			}
		}
	});
}

function updateTemp() {
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

$(document).ready( updateTemp() );
