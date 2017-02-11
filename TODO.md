## TODOs

* ~~Implement Adding a Device~~
  * ~~Use a button modal on the front-end~~
  * ~~Use a POST on the back-end~~
  * ~~back-end function needs to be modified to input: deviceId, apiKey, sensorCommand, and displayName~~
* ~~Front-End~~
  * ~~Put the title into a card~~
  * ~~Create a big old card to hold all of the device cards~~
  * ~~Change to a dark background~~
* ~~Handle device response where there is a stderr output~~
* ~~On the 'Add Device' modal, if required text is missing:~~
  * ~~Change how the modal forms look (should be red or something)~~
  * ~~Add a message saying 'All fields are required' or something along those lines~~
* ~~Fix issue where newly added device shows undefined for the data~~
* ~~Add option to delete devices through the front-end~~
  * ~~Back-End:~~
    * ~~Add a `writeable` option to the config file, if it is set to `false`, the device cannot be deleted~~
      * ~~Note that not all devices need to have this flag, assume writeable is true if not present~~
    * ~~Add a `DELETE /device` endpoint ~~
      * ~~(with DELETE being the type of HTTP request, should be very similar to a POST request) ~~
      * ~~Purpose: remove the device from memory as well as the config file on the server~~
      * ~~If the target device has a `writeable: false` setting, do NOT delete the device!~~
      * ~~The target device is to specified by the `deviceId` from the request body~~
      * ~~Use [array].findIndex function to find which device should be removed~~
    * ~~Add a `writeable: false` setting to the Onion HQ device~~
  * ~~Front-End:~~
    * ~~Add a delete button to each card, when it's clicked, trigger the DELETE /device endpoint with the deviceId as the body~~
    * ~~Change delete button text to just be an 'X', position it nicely in the card~~
  * ~~Code-Clean-up:~~
    * ~~Change the `POST /add` end-point to `POST /device` on the front-end and back-end~~
* ~~Comment server side and front-end js code~~
* UI Fixes:
  * When a device is added or deleted, have a spinning gear/loading icon so the user knows their command was successful and that they just need to wait
  * When a device is successfully added, clear the content (and any error formatting) of the form in the 'Add Device' modal
* Code Fixes:
  * Use a variable instead of the raw 'devices.json' string
  * Add ability for a run-time argument to specify the configuration file
