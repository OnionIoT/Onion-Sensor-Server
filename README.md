# Omega-Cloud-Demo

Pulls temperature data from registered Omega devices, and serves them webapp style.

## TL;DR

Get nodejs 6.9.4+, clone this repository somewhere, then:

```
cd ./Onion-Sensor-Server

npm install
npm start
```

Check out localhost:8080 to see the app running!

## Requirements

This is a web app, so ideally you'd want to run it on a remote server.  We won't be covering how to set this up on your local machine, but there should be plenty of guides on properly securing and operating a home server.

We've tested this successfully on Ubuntu Xenial (16.04LTS), and should theoretically work anywhere you can get node 6.9+ working. We've not tested this against other versions of node, feel free to try it out and submit issues/pull requests for cross-platform operation.

Make sure you have git installed to clone the source.


## Setup

All setup instructions assume you're running Ubuntu 16.04 LTS, although very similar processes should work on other Unix-likes.

### Environment

Step one is to set up your machine for server use. This should already be done if you're using a web service (AWS/DigitalOcean/something else).

Next, `ssh` into the server and install nodejs. The node version that aptitude (`apt` or `apt-get`) tracks is out of date, so we'll get it fresh from the source:
```
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt install nodejs
```

>Note, for older version of ubuntu, replace `apt` with `apt-get`


### Clone in source

Navigate to the directory you want the project to live in, then run:

```
git clone git@github.com:OnionIoT/Onion-Sensor-Server.git
```

The server has some dependencies that aren't included here due to size, run npm to get them set up.

```
npm install
```

## Running the Server

The simplest way to start the server is through npm.

```
npm start
```

You can pass in the port the server listens on as an argument, if nothing is set, the server runs on `8080`.

```
npm start 80
```

>For most setups, you'd need to run `npm start` as root to listen on port 80.

Minification is currently being worked on, if you'd like to run this live, you should probably minify everything in `/static` (if you change the names, make sure to update index.html) to save some money.






