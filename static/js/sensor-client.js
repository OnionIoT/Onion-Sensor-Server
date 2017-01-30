var omegaDataList = {};
var statusCodeMessage = 
{
	'0'		: 'Temperature: ',
	'400'	: 'Device error: ',
	'401'	: 'Device error: ',
	'404'	: 'Device error: '
};

function renderOmegaList() {
	omegaIdList = Object.keys(omegaDataList);

	for (i = 0 ; i < omegaIdList.length ; i++)
	{// TODO check for undefined, don't update it if so, change to use foreach
		currDevice = omegaDataList[omegaIdList[i]];
		console.log(currDevice.displayName);
		console.log(currDevice.message);
		if($('#'+ omegaIdList[i]).length) 
		{
			$('#' + omegaIdList[i] + ' li.message').html(statusCodeMessage[currDevice.statusCode] + currDevice.message);
		} else 
		{
			appendString =  '<ul class=".col-xs-6 .col-sm-4" ';
			appendString += 'id="' + omegaIdList[i] + '">';
			appendString += '<li class="displayName">' + currDevice.displayName + '</li>';
			appendString += '<li class="message">' + currDevice.message + '</li>';
			appendString += '</ul>';
			console.log(appendString);
			$('#omega-list').append(appendString);
		}
	}
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


