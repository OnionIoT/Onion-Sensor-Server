// Initialising client-side variables
var deviceDataList = {};
var statusCodeMessage =		// Maps status codes to statuses in english
{
	'0'		: 'ONLINE',
	'400'	: 'ERROR',
	'401'	: 'ERROR',
	'404'	: 'OFFLINE'
};

/** Temperature conversion functions
 * curreTempUnit - flag to coordinate conversion and appending units
 * tempUnit - hash table of flag:written_unit, the written unit will be appended to the number
 * tempConvert - hash table of flag:conversionFunction(), always converts *from* Celsius to F/K
 */
var currTempUnit = 'c';
// Maps the flag to the proper written unit
var tempUnit = {
	'k'	: ' K',
	'f'	: ' °F',
	'c'	: ' °C'
};
// Maps the flag to the related conversion function (from celsius)
var tempConvert = {
	'k'	: (t) => { return (273.15+parseFloat(t)); },
	'f'	: (t) => { return (t * 1.8 + 32); },
	'c'	: (t) => { return t; }
};

// onclick handler for the unit selection buttons, sets the flag, and renders the cards again
function setCurrTempUnit (u)
{
	currTempUnit = u;
	renderDeviceList();
}

// Alias for updateTemp(), adds console logging to track for debugging
// TODO up for deletion
function buttonHit()
{
	console.log ('update button pressed.');
	updateTemp();
}

/** Render function, only updates #omega-list
 * Generates HTML elements for each device in the device list
 * then appends them as children to #omega-list
 */
function renderDeviceList()
{
	// Iterates through the List of devices and builds an HTML block for each one
	deviceDataList.forEach( function (device) {// TODO check for undefined, don't update it if so, change to use foreach

		// parses time data to string
		time = Date(device.time).toLocaleString();
		// Initialises description to empty description is used for both
		// temperature and error message display
		description = '0';
		// Initialises card styling class to change based on device status
		cardStyle = 'card';

		// Checking the device status to assign appropriate messages/data to description
		if (device.statusCode == 0 || device.statusCode == 404)
		{
			if (device.statusCode == 0) // Converts data to appropriate unit
			{
				// Data sanitisation is done server-side, this should be 100% float manipulation
				description = tempConvert[currTempUnit](device.temp);
				console.log(description);
				description = Number(description).toFixed(2);
				description = description + tempUnit[currTempUnit];
			} else // Sets card to warning for 404s
			{	cardStyle += ' card-outline-warning'; }
		} else // Sets card to danger for all other statuses, also outputs error message instead of temperature
		{
			cardStyle += ' card-outline-danger';
			description = device.message;
		}
		
		// Some debug logging
		console.log(device.displayName + ' - ' +
					device.statusCode + ' @' +
					time + ' | ' +
					description);

		// Checking for new device/updating current device
		if($('#'+ device.deviceId).length == 1)
		{ // If card already exists for device, simply change the data
			$('#' + device.deviceId).attr( { "class" : cardStyle } );
			$('#' + device.deviceId + ' h6.card-subtitle')	.html( statusCodeMessage[device.statusCode] );
			$('#' + device.deviceId + ' p.card-text')		.html( description);
			$('#' + device.deviceId + ' div.card-footer')	.html( time);
		} else
		{ // If not, brute-force generates an html block from data, this avoids calling jQ - maybe faster (not benchmarked)
			appendString =  '<div class="' + cardStyle + '" id="' + device.deviceId + '">';
			appendString += '<div class="card-block">';
				appendString += '<h4 class="card-title">' 						+ device.displayName + '</h4>';
				appendString += '<h6 class="card-subtitle mb-2 text-muted">' 	+ statusCodeMessage[device.statusCode] + '</h6>';
				appendString += '<p class="card-text description">' 						+ description + '</p>';
			appendString += '</div>';
			appendString += '<div class="time-text card-footer text-muted">' 				+ device.time;
			appendString += '</div></div>';
			console.log(appendString);
			$('#omega-list').append(appendString);
		}
	}); // forEach ends here
}

// Constructs HTML request to GET /data from the app server
function updateTemp()
{
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			deviceDataList = JSON.parse(this.responseText);
			renderDeviceList();
		}
	};
	xhttp.open("GET", "/data", true);
	xhttp.send();
}

// listener for add device button
var addDevice = function () {
	console.log("Add Device button clicked!");

	var bValid 			= true;
	var deviceName 		= $('#device-name-input').val();
	var deviceId 		= $('#device-id-input').val();
	var apiKey 			= $('#api-key-input').val();
	var command 		= $('#device-command-input').val();

	// validate input
	bValid = checkEmpty('device-name');
	t = checkEmpty('device-id');
	bValid = bValid && t;
	t = checkEmpty('api-key');
	bValid = bValid && t;
	t = checkEmpty('device-command');
	bValid = bValid && t;

	// run the http request if everything goes through
	if (bValid) {
		// bodybuilding with given data from the form
		var body = {
			deviceId		: deviceId,
			apiKey			: apiKey,
			sensorCommand	: command,
			displayName		: deviceName
		};

		console.log("Sending POST with body: ", body);
		// ajax post request to /devices with all data
		$.ajax( {
			type: "POST",
			url: "/devices",
			data: JSON.stringify(body),
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function (msg) {
					console.log('POST /add returned: ', msg);

					// hide the modal
					$('#addDeviceModal').modal('hide');

					// update the devices
					setTimeout( function() {
						updateTemp();
					}, 5000);
				},
			error: function (msg) {
					console.log('POST /add returned ERROR: ', msg);
				}
		});
	}
};

// Checks a given form field for empty string input, updates an alert if it's empty, removes it if there is data
function checkEmpty(formId)
{
	// Inits the selector for the form groups
	var selector 	= '#' + formId + '-form';
	// generates a default 'required field' error html element from raw html string
	var errorHTML	= $.parseHTML('<div class="form-control-feedback col-12 text-center">This field is required.</div>');
	// presets validitiy of the form input
	let bValid 		= true;
	
	// Checks if the input is actually valid
	if ( $('#' + formId + '-input').val() === "") { // If not, adds warnings
		$(selector).addClass("has-danger");
		if ($(selector + '.form-control-feedback').length == 0) { // prevents adding the error string multiple times
			// TODO this doesn't always work!
			$(selector).append(errorHTML);
		}
		bValid = false;
	} else { // removes added warnings if input is valid
		$(selector).removeClass("has-danger");
		$(selector + '.form-control-feedback').remove();
	}
	

	return bValid;
}
