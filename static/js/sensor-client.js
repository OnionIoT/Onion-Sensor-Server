// Initialising client-side variables
var deviceDataList = {};
var statusCodeMessage =		// Maps status codes to statuses in english
{
	'0'		: 'ONLINE',		// This device is online and sending temperature
	'1'		: 'MESSAGE',	// This device is online and sending response
	'400'	: 'ERROR',		// API key error
	'401'	: 'ERROR',		// API key error
	'404'	: 'OFFLINE'		// Device offline
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

/** Render function, only updates #device-list
 * Generates HTML elements for each device in the device list
 * then appends them as children to #device-list
 */
function renderDeviceList()
{
	// Iterates through the List of devices and builds an HTML block for each one

	var renderedDevices = $("#device-list").children();

	
	// iterates through rendered device html elements, and tries to match each
	// html element with a device in memory by deviceId
	console.log(renderedDevices);
	for (var i = 0 ; i < renderedDevices.length ; i++) {
		// finds device by element id
		console.log('aaaaa');
		matchingIndex = deviceDataList.findIndex( function (device) {
					return device.deviceId == renderedDevices[i].id;
					});
		//if no matching index, then deviceHtmlElement does not exist
		// in deviceDataList, and is removed
		if (matchingIndex == -1) { $('#'+renderedDevices[i].id).remove(); }
	}

	// goes through the device list, 
	// updates device cards and adds new cards if new
	deviceDataList.forEach( function (device) {
		// prepares variables to insert into device card
		time = Date(device.time).toLocaleString();
		description = device.message;
		cardStyle = 'card'; // used to change the outline of cards

		console.log ( device.deviceId + ' || ' + device.statusCode);
		// Checking the device status to assign appropriate messages/data to description
		switch (device.statusCode)
		{
			case 0: //case where temperature is returned
				// Data sanitisation is done server-side, this should be 100% float manipulation
				description = tempConvert[currTempUnit](device.temp);
				description = Number(description).toFixed(2);
				description = description + tempUnit[currTempUnit];
				break;
			case 1: //case where message is returned
				break;
			case 400: //device errors
				cardStyle += ' card-outline-danger';
				break;
			case 401:
				cardStyle += ' card-outline-danger';
				break;
			case 404:
				cardStyle += ' card-outline-warning';
				break;

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
			
			newCard = document.createElement('div');
			newCard.setAttribute('class', cardStyle);
			newCard.setAttribute('id', device.deviceId);

			block = document.createElement('div');
			block.setAttribute('class', 'card-block');

			title = document.createElement('h4');
			title.setAttribute('class', 'card-title');
			title.textContent = device.displayName;
			
			statusText = document.createElement('h6');
			statusText.setAttribute('class', 'card-subtitle mb-2 text-muted');
			statusText.textContent = statusCodeMessage[device.statusCode];

			descriPara = document.createElement('p');
			descriPara.setAttribute('class', 'card-text descriPara');
			descriPara.textContent = description;

			footer = document.createElement('div');
			footer.setAttribute('class', 'card-footer text-muted time-text');
			footer.textContent = time;

			block.append(title);
			block.append(statusText);
			block.append(descriPara);

			if (device.writable === true) {
				deleteButton = document.createElement('button');
				deleteButton.setAttribute('class', 'btn btn-sm delete-button');
				deleteButton.setAttribute('type', 'button');
				deleteButton.setAttribute('onclick', 'deleteDevice(\'' + device.deviceId + '\')');
				deleteButton.textContent = 'X';
				block.append(deleteButton);
			}

			newCard.append(block);
			newCard.append(footer);

			$('#device-list').append(newCard);
		}
	}); // forEach ends here
}

// Constructs HTML request to GET /data from the app server
function updateTemp()
{
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() { 
		// this is called when the request **returns** from the webapp server
		if (this.readyState == 4 && this.status == 200) {
			deviceDataList = JSON.parse(this.responseText);
			console.log('aaaaaaaa' + JSON.stringify(deviceDataList));
			renderDeviceList();
		}
	};
	xhttp.open("GET", "/data", true); // opening connection and constructing req
	xhttp.send(); 
}

var deleteDevice = function (deviceId) {
	console.log("Delete Device button clicked!");
	var index = deviceDataList.findIndex( function (d) { 
		return d.deviceId === deviceId;
	});

	deviceDataList.splice(index, 1);

	$.ajax( {
		type: "DELETE",
		url: "/devices/" + deviceId,
		success: function (msg) {
			setTimeout(function () { updateTemp();} , 3000);
		},
		error: function (msg) {
			console.log ("DELETE " + deviceId + "  unsuccessful: " + msg);
		}
	});
}


// listener for add device button
var addDevice = function () {
	console.log("Add Device button clicked!");

	var bValid 			= true;
	// setup variables for form field IDs
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

// called when the close button is clicked, clears the form modal HTML
function closeAddDeviceModal()
{
	clearDanger("device-name-form");
	clearDanger("device-id-form");
	clearDanger("api-key-form");
	clearDanger("device-command-form");
}


// removes danger labels from form input fields, used to reset the form
// validation fields to normal
function clearDanger(selector)
{
	$(selector).removeClass("has-danger");
	$(selector + '.form-control-feedback').remove();
}


// Checks a given form field for empty string input, 
// updates an alert if it's empty,
// removes it if there is data
function checkEmpty(formId)
{
	// Inits the selector for the form groups
	var selector 	= '#' + formId + '-form';
	// generates a default 'required field' error html element from raw html string
	var errorHTML	= document.createElement('div');
		errorHTML.setAttribute ('class', 'form-control-feedback col-12 text-center');
		errorHTML.setAttribute ('font-size', '.7em');
		errorHTML.textContent = 'This field is required.';

	// presets validitiy of the form input
	let bValid 		= true;
	
	// Checks if the input is actually valid
	if ( $('#' + formId + '-input').val() === "") { // Adds warnings if invalid
		$(selector).addClass("has-danger");
		if ($(selector + '.form-control-feedback').length == 0) { 
			// prevents adding the error string multiple times
			// TODO this doesn't always work!
			$(selector).append(errorHTML);
		}
		bValid = false;
	} else { // removes added warnings if input is valid
		clearDanger (selector);
	}
	

	return bValid;
}
