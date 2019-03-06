# PrinterView

![screenshot](https://raw.githubusercontent.com/arvydas/PrinterView/master/images/screenshots/screenshot.png)

A simple web app for viewing the status of multiple printers in a single page. 
It works by storing all settings inside your browser's local storage and uses only JavaScript to communicate with OctoPrint instances.

I significantly modified the user inteface to suit purely my needs and designed it in such a way so that I could both monitor 3D printers 
and also control them for my small scale manufacturing requirements.

_Note:_ It only works with 3D printers accessible on the local network.

# Features

- Minimalistic approach to only display relevant information
- Elegant styling and color scheme
- Ability to start prints from single page
- Import/Export of settings
- Open OctoPrint UI without leaving the main page
- Lots of bug fixes and usability improvements compared to original code

# Known Issues

- Does not indicate correctly when connection to 3D printer is lost
- UI may not work correctly without a webcam attached
- Webcam settings could be with from OctoPrint API instead of entering them manually
- Tested only with Chrome and Chromium web browsers

# Requirements

- 3D Printer
- OctoPrint configured for the 3D printer
- Webcam configured with OctoPrint

Assuming you understand how these things work and you already have them set up.

# Installation

You have the following options on how to run this software:

- My hosted version
- Copy of the website on you local computer
- Install to a webserver

## My hosted version

Open <a href="http://printerview.arvydas.co.uk" target="_blank">printerview.arvydas.co.uk</a> and set up your printers. I will keep this version of the website up to date with source code on GitHub.

## Local copy

- Download [source code](https://github.com/arvydas/PrinterView/archive/master.zip)
- Extract it anywhere on your computer
- Open index.html file

NOTE: If you change the location of the index.html file, your printer settings will be lost. Please see below on how to set up default printers so that you are able to import them with one click.

## Install on a webserver

Let's say you want to install this on a Raspberry Pi. Assuming you have it all set up and logged in as user pi.

```
cd ~
git clone https://github.com/arvydas/PrinterView
```

This should install source code to /home/pi/PrinterView

Install nginx

```
sudo apt install nginx
```

Edit nginx configuration

```
sudo nano /etc/nginx/sites-available/default
```

Replace line 

```
root /var/www/html;
```

with the following line

```
root /home/pi/PrinterView
```

Restart nginx

```
sudo service nginx restart
```

Open your browser to the IP address of Raspberry Pi.

In the future if you want to update source code, just run these commands

```
cd ~/PrinterView
git pull
```

Then refresh your browser

# Default configuration

If you are using PrinterView as a self hosted version either by installing to a webserver or on local file system, you can set up default printers so that you don't have to configure them if you will be using PrinterView on multiple browsers.

- First set up your printers as normal.
- Click Export button in the top right corner of the web page
- Copy text
- Create a file name defaults.js where index.html is located
- Paste the contents of the text in the following format:

```
var defaultPrinters = <<PASTE HERE>>
```

For example:

```
var defaultPrinters = {
    "ip": [
        "192.168.100.99"
    ],
    "port": [
        "5001"
    ],
    "apikey": [
        "123"
    ],
    "noConn": [],
    "cameraIp": [
        "192.168.100.99"
    ],
    "camPort": [
        "6001"
    ]
}
```

Now in order to import your printers in another browser, just click on Import button and then "Load from Server". Your existing printers will be cleared and new ones imported.

# Screenshots and Usage

Make sure you configure OctoPrint as listed in the initial instructions.

![Welcome screen](https://raw.githubusercontent.com/arvydas/PrinterView/master/images/screenshots/screenshot-welcome.png)

Overview of all printers.

![screenshot](https://raw.githubusercontent.com/arvydas/PrinterView/master/images/screenshots/screenshot.png)

You can view temperature information by hovering mouse over the tile.

![temperature-information](https://raw.githubusercontent.com/arvydas/PrinterView/master/images/screenshots/temperature-information.png)

There are actions that can be performed on each printer

- Play button starts current file print
- Open button opens user interface in the same window
- Menu button allows additional actions on the printer

![printer-menu](https://raw.githubusercontent.com/arvydas/PrinterView/master/images/screenshots/printer-menu.png)

When printer settings are opened in iframe, it is cached in your browser, but loaded only when you click the "Open" button. Clicking the button again will show the same content you were viewing last time making it easy to continue what you were working on with that particular 3D printer.

![printer-iframe](https://raw.githubusercontent.com/arvydas/PrinterView/master/images/screenshots/printer-iframe.png)

Use the "Back" button to return to the list of all printers.

# Changelog

2019-03-06 Initial release

# Acknowledgements
PrinterView uses the following:
* [Code from developers this repository was forked from](https://github.com/arvydas/PrinterView/network/members)
* [Foosel/OctoPrint](https://github.com/foosel/OctoPrint)
* [jQuery](https://jquery.com/)
* [Bootstrap](http://getbootstrap.com/)
* [Bootbox](http://bootboxjs.com/)
* [Bootstrap Toggle](http://www.bootstraptoggle.com/)
