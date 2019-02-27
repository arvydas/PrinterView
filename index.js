//********************************************************************************
const printerState = {
	free        : 1,
	printing    : 2,
	error       : 3
};
const plastic = {
	ABS	: 0x01,
	PLA	: 0x02,
	Watson	: 0x03,
	HIPS	: 0x04
};
const color = {
	white		: 0x01,
	black		: 0x02,
	lightGray	: 0x03,
	Gray		: 0x04,
	red		: 0x05,
	green		: 0x06,
	blue		: 0x07, 
	yellow		: 0x08,
	orange		: 0x09,
	brown		: 0x0A,
	purple		: 0x0B,
	emerald		: 0x0C,
	skiey		: 0x0D,
	coral		: 0x0E,
	rose		: 0x0F,
	chocolate	: 0x10,
	gold		: 0x11,
	krem		: 0x12,
	limeGreen	: 0x13,
	lightBlue	: 0x14,
	natural		: 0x15
};
//********************************************************************************
var refreshRate     = 3000; // in milliseconds
var numPrinters     = 0;
var modalIndex      = 0;
var printers        = new Object();
var connected       = true;
var client          = new Array();
var prevPanelWidth  = 0;
//********************************************************************************
var printersInfo = {
    tool:  [],
    state: [],
    basicInfoExists: []
}; 
//********************************************************************************

// ToDo:
// switch to sockJS 
// 	- Probably a dual system, with a fallback. You never know what those 
//    network security guys will block at work
// reorder printers
//	- low priotity, but it would be nice.
// checkbox for minimizing and not updating a printer
//	- Could be useful, but I think there may be other priorities
// Objectify. Too much running amok
// 
// Dreamlist;
// Webcams
// Repetier-Server Integration
// Access Control/Database storage

window.onload = function () {
  $.fn.removeClassRegex = function(regex) {
    return $(this).removeClass(function(index, classes) {
      return classes.split(/\s+/).filter(function(c) {
        return regex.test(c);
      }).join(' ');
    });
  };

  $.fn.removeColor = function() {
    return $(this).removeClassRegex(/^color-/);
  };

	// get saved printers
    	reloadPrinters();
      panelWidthControl();
  	// update printer info
  	setInterval(
            function () {
                updatePrinters();
            }, 
            refreshRate
        );

    $( window ).resize(function() {
      setTimeout(
        panelWidthControl(),
        500);

    });

    $(document).on("mouseenter", ".panel", function() {
      $(this).find(".summary-row-top").fadeIn();
    });
    $(document).on("mouseleave", ".panel", function() {
      $(this).find(".summary-row-top").fadeOut();
    });

    $('#reload').click(function() {
      location.reload();
    });
};

function initPrinters()
{
    printers ={
        "ip": [],
        "port": [],
        "apikey": [],
        "noConn": [],
        "cameraIp": [],
        "camPort": []
    };
    printersInfo ={
        "tool":  [],
        "state": [],
        "basicInfoExists": []
    };
}

function panelWidthControl(){
    var currentWidth = document.getElementById("panel"+1).offsetWidth;
    if (prevPanelWidth != currentWidth)
    {
        prevPanelWidth = currentWidth;
        for(var i = 0; i<numPrinters; i++){
            resizeCanvas(0.5625, i);
        }
    }
} 

function reloadPrinters() {
	if (localStorage.getItem("savedPrinters") === null) {
        initPrinters();
      	$("#noPrintersModal").modal("show");
  	} else {
      		delete client;
      		printers = JSON.parse(localStorage.getItem("savedPrinters"));
      		numPrinters = printers.ip.length;
      		for (var i = 0; i < numPrinters; i++) {
              printersInfo.state[i] = printerState.free;
          		client.push(new OctoPrintClient());
          		client[i].options.baseurl = "http://" +printers.ip[i] + ":" +printers.port[i];
          		client[i].options.apikey = printers.apikey[i];
          		initialInfo(printers.ip[i], printers.port[i], printers.apikey[i], printers.camPort[i], i);
          		addPrinter(printers.ip[i], printers.port[i], printers.apikey[i], i);
              resizeCanvas(0.5625, i);
       		}
   	}
}

function initialInfo(ip, port, apikey, camPort, index) {
	basicInfo(ip, port, apikey, index);
  	updateStatus(ip, port, apikey, camPort, index);
}

function updateStatus(ip, port, apikey, camPort, index) {
	client[index].get("api/connection")
  	.done(function (response) {
    		if (response.current.state === null) {
      			makeBlank(index);
    		} else {
        		// get printer state
            let stateString = "";
            if (response.current.state.startsWith("Error")) {
              stateString = "<span data-toggle='tooltip' data-placement='bottom' title='" + response.current.state + "'>Error</span>";
            } else {
              stateString = response.current.state;
            }
            document.getElementById("printerStatus" + index).innerHTML = stateString;
        		if (response.current.state !== "Closed" && response.current.state !== "Offline" && !response.current.state.startsWith("Error")) {
                if (printersInfo.state[index] === printerState.free){
                    document.getElementById("panel" + index).className = "panel panel-success";
                    $("#printerStatus" + index).removeColor().addClass("color-silver");
                } else {
                    document.getElementById("panel" + index).className = "panel panel-primary";
                    $("#printerStatus" + index).removeColor().addClass("color-blue");
                }
                basicInfo(ip, port, apikey, index);
          			jobInfo(ip, port, apikey, index);
          			tempInfo(ip, port, apikey, index);
                videoInfo(printers.cameraIp[index], printers.camPort[index], index);
        		} else {
                $("#printerStatus" + index).removeColor().addClass("color-red");
            			//Do not make blank. It is annoying.
          			document.getElementById("panel" + index).className = "panel panel-default";
          			basicInfo(ip, port, apikey, index);
                document.getElementById("currentFile" +index).innerHTML ="&nbsp;";
                document.getElementById("timeLeft" +index).innerHTML ="";//- min
                $("#timeLeft" +index).removeColor().addClass("color-silver");

                document.getElementById("e0Temp" +index).innerHTML = "&nbsp;";
                document.getElementById("e1Temp" +index).innerHTML = "&nbsp;";
                document.getElementById("bedTemp" +index).innerHTML = "&nbsp;";
      			}
    		}
  	})
  	.fail(function () {
     		makeBlank(index);
	});
}

function basicInfo(ip, port, apikey, index) {
  /*
  	client[index].get("/api/printerprofiles")
  	.done(function (response) {
      		// get name of the printer
    		//document.getElementById("printerName" +index).innerHTML =response.profiles._default.name;
      		// set the panel footer as the printer's ip
    		//document.getElementById("printerIP" +index).innerHTML = ip;
                // get number of tools
                printersInfo.tool[index] = response.profiles._default.extruder.count;
  	});
    */
    //Don't call for basic info if we already have it
    if (printersInfo.basicInfoExists[index] === true) {
      return;
    }

  	client[index].get("/api/settings")
      .done(function (response) {
    		document.getElementById("printerName" +index).innerHTML =response.appearance.name;
        printersInfo.basicInfoExists[index] = true;
  	});
}

function jobInfo(ip, port, apikey, index) {
	// get info on current print job
  	client[index].get("/api/job")
  	.done(function (response) {
       		//get filename of print
      		if (response.job.file.name === null) {
          		// set current file to no file selected
          		document.getElementById("currentFile" +index).innerHTML ="No file selected";
          		// set time left field to no active print
          		document.getElementById("timeLeft" +index).innerHTML ="";//- min
              printersInfo.state[index] = printerState.free;
          		// set print progress bar perecent to 0
          		$("div#progressBar" +index).css("width", "0%");
      		} else {
              if (response.state === "Operational") {
                  printersInfo.state[index] = printerState.free;
                  $("#timeLeft" +index).removeColor().addClass("color-silver");
                  document.getElementById("timeLeft" +index).innerHTML = "";//- min
              } else {
                  printersInfo.state[index] = printerState.printing;
                  $("#timeLeft" +index).removeColor().addClass("color-orange");

                  // set estimation of print time left
                  document.getElementById("timeLeft" +index).innerHTML = (response.progress.printTimeLeft / 60).toFixed(0) + " min";
              }

          		// set filename of current print
          		document.getElementById("currentFile" +index).innerHTML = response.job.file.name.split(".").slice(0, -1).join(".");
                        
          		// set percentage of print completion
              $("div#progressBar" +index).css("width", response.progress.completion + "%");
    		}
	})
  	.fail(function () {
    		document.getElementById("panel" +index).className = "panel panel-danger";
    		makeBlank(index);
  	});
}

function tempInfo(ip, port, apikey, index) {
	// get info on temps
  	client[index].get("/api/printer")
  	.done(function (response) {
      		// get temp of extruder 0 and its target temp
      		document.getElementById("e0Temp" +index).innerHTML = response.temperature.tool0.actual + "°/" +response.temperature.tool0.target +"°";

          if (response.temperature.tool0.target == 0) {
            $("#e0Temp" +index).removeColor().addClass("color-silver");
          } else {
            $("#e0Temp" +index).removeColor().addClass("color-red");
          }

                // get temp of extruder 1 and its target temp
                if (typeof response.temperature.tool1 !== "undefined" && response.temperature.tool1.actual !== null) {
                    document.getElementById("e1Temp" +index).innerHTML = response.temperature.tool1.actual + "°/" +response.temperature.tool1.target +"°";
                    if (response.temperature.tool1.target == 0) {
                      $("#e1Temp" +index).removeColor().addClass("color-silver");
                    } else {
                      $("#e1Temp" +index).removeColor().addClass("color-red");
                    }
                } else {
                    document.getElementById("e1Temp" +index).innerHTML ="no tool";
                    $("#e1Temp" +index).removeColor().addClass("color-silver");
                }
      		// get temp of the bed and its target temp
      		if (typeof response.temperature.bed !== "undefined" && response.temperature.bed.actual !== null) {
        		document.getElementById("bedTemp" +index).innerHTML = response.temperature.bed.actual + "°/" +response.temperature.bed.target +"°";
            if (response.temperature.bed.target == 0) {
              $("#bedTemp" +index).removeColor().addClass("color-silver");
            } else {
              $("#bedTemp" +index).removeColor().addClass("color-red");
            }
      		} else {
        		document.getElementById("bedTemp" +index).innerHTML ="0°";
      		}
  	})
  	.fail(function () {
    		document.getElementById("panel" +index).className = "panel panel-danger";
    		makeBlank(index);
  	});
}


function scaleRect(srcSize, dstSize) {
      var ratio = Math.min(dstSize.width / srcSize.width,
                           dstSize.height / srcSize.height);
      var newRect = {
        x: 0, y: 0,
        width: srcSize.width * ratio,
        height: srcSize.height * ratio
      };
      newRect.x = (dstSize.width/2) - (newRect.width/2);
      newRect.y = (dstSize.height/2) - (newRect.height/2);
      return newRect;
    }

function resizeCanvas(ratio, index)
{
    var canvasWidth = $("#panel"+index).width();
    var canvasHeight = canvasWidth * ratio;
    document.getElementById("printerCam"+index).width = canvasWidth;
    document.getElementById("printerCam"+index).height = canvasHeight;
}

function videoInfo(ip, camPort, index) {
    //resizeCanvas(0.5625, index);
    var url = "http://" + ip + ":" + camPort + "/?action=snapshot";
    var img = new Image();
    img.src = url;
    var canvas  = document.getElementById("printerCam" + index);
    var context = canvas.getContext("2d");
    
    img.onload = function() {
        var srcRect = {
            x: 0, 
            y: 0,
            width: img.naturalWidth,
            height: img.naturalHeight
        };
        var dstRect = scaleRect(
            srcRect, {
                width: canvas.width,
                height: canvas.height
            }
        );
        context.save();
        context.translate(dstRect.width, dstRect.height);
        context.scale(-1, -1);
        context.drawImage(
            img,
            srcRect.x,
            srcRect.y,
            srcRect.width,
            srcRect.height,
            dstRect.x,
            dstRect.y,
            dstRect.width,
            dstRect.height
        );
        context.restore();
    };
}

function updatePrinters() {
	for (var i = 0; i < numPrinters; i++) {
      		updateStatus(printers.ip[i], printers.port[i], printers.apikey[i], printers.camPort[i], i);
    	}
}

function eePrinter(ip, port, apikey, i, camPort, camIP, noConn) {
	if (i === numPrinters) {
        	// This is a new addition
        	addPrinter(ip, port, apikey, i);
        	numPrinters++;
        	if (noConn === null) {
            		makeBlank(i);
        	}
        	client.push(new OctoPrintClient());
    	}
    	// store ip and apikey info
    	printers.ip[i] = ip;
    	printers.port[i] = port;
    	printers.apikey[i] = apikey;
    	printers.cameraIp[i] = camIP;
        printers.camPort[i] = camPort;
    	client[i].options.baseurl = "http://" + ip + ":" + port;
    	client[i].options.apikey = apikey;
    	// save new printer to local storage
    	localStorage.setItem("savedPrinters", JSON.stringify(printers));
    	// get initial info on printer
    	initialInfo(ip, port, apikey, camPort, i);
}


function addPrinter(ip, port, apikey, printerNum) {
  	var editButton          = '<li><a data-toggle="modal" href="#" onclick="eePrinterModal(' + printerNum +')"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span> Edit Printer</a></li>';
  	var removeButton        = '<li><a data-toggle="modal" href="#" onclick="removePrinter(' + printerNum +')"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span> Remove Printer </a></li>';
  	var octoPrintPageButton = '<li><a href="http://' +printers.ip[printerNum] + ':' + printers.port[printerNum] + '/" target="_blank"><span class="glyphicon glyphicon-home" aria-hidden="true"></span> OctoPrint</a></li>';
  	var connectButton       = '<li><a href="#" onclick="connectPrinter(' + printerNum +')"><span class="glyphicon glyphicon-off" aria-hidden="true"></span> Connect</a></li>';
  	var controlButton       = '<li><a href="#" onclick="controlPrinter(' + printerNum +')"><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span> Control Printer</a></li>';
  	// add HTML
  	$("#printerGrid").append('<div class="col-xs-12 col-sm-4 col-md-4 col-lg-3" id="printer' + printerNum +'"></div>');
  	$("#printer" +printerNum).append('<div class="panel panel-default" id="panel' + printerNum +'"></div>');
  	$("#panel" +printerNum).append('<div class="panel-heading clearfix" id="panelHeading' + printerNum +'"></div>');
  	$("#panelHeading" +printerNum).append('<span id="printerName' + printerNum +'" class="pull-left printer-name">Loading...</span>');
  	$("#panelHeading" +printerNum).append('<div class="btn-group pull-right" id="btnGroup' + printerNum +'"></div>');
  	$("#btnGroup" +printerNum).append('<button type="button" class="btn btn-default btn-sm" onclick="startJob(' + printerNum +')"><span class="glyphicon glyphicon-play" aria-hidden="true"></span></button>');
  	$("#btnGroup" +printerNum).append('<button type="button" class="btn btn-default btn-sm" onclick="controlPrinter(' + printerNum +')"><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span></button>');
  	$("#btnGroup" +printerNum).append('<button type="button" class="btn btn-default btn-sm dropdown-toggle" data-toggle="dropdown" aria-expanded="false"><span class="glyphicon glyphicon-menu-hamburger" aria-hidden="true" id="menuBtn' + printerNum +'"></span></button>');
  	$("#btnGroup" +printerNum).append('<ul class="dropdown-menu" role="menu" id="dropdown' + printerNum +'"></ul>');
  	$("#dropdown" +printerNum).append(connectButton);
  	$("#dropdown" +printerNum).append(editButton);
  	$("#dropdown" +printerNum).append(octoPrintPageButton);
  	$("#dropdown" +printerNum).append(controlButton);
  	$("#dropdown" +printerNum).append('<li role="separator" class="divider"></li>');
  	$("#dropdown" +printerNum).append(removeButton);
  	$("#panel" +printerNum).append('<div class="panel-body" id="body' + printerNum +'"></div>');
    $("#body" +printerNum).append('<canvas id="printerCam' + printerNum +'" width = "320" height = "180" >Browser error!</canvas>');

    $("#body" +printerNum).append('<div id="summaryRowTop' + printerNum +'" class = "summary-row-top" style="display: none;"> </div>');

    $("#summaryRowTop" +printerNum).append('<span class="info-description">E0:</span><span id="e0Temp' + printerNum +'" class="info-tile color-silver">Loading...</span>');
    $("#summaryRowTop" +printerNum).append('<span class="info-description">E1:</span><span id="e1Temp' + printerNum +'" class="info-tile color-silver">Loading...</span>');
    $("#summaryRowTop" +printerNum).append('<span class="info-description">Bed:</span><span id="bedTemp' + printerNum +'" class="info-tile color-silver">Loading...</span>');

    $("#body" +printerNum).append('<div id="summaryRowBottom' + printerNum +'" class = "summary-row-bottom"> </div>');

    $("#summaryRowBottom" +printerNum).append('<div id="printerStatus' + printerNum +'" class="info-tile color-silver normal">Loading...</div><div id="timeLeft' + printerNum +'" class="info-tile color-silver normal">Loading...</div>');
    $("#summaryRowBottom" +printerNum).append('<div class="info-description normal">File:</div><div id="currentFile' + printerNum +'" class="info-tile color-blue fill-width">Loading...</div>');

  	$("#body" +printerNum).append('<div class="progress" id="progress' + printerNum +'"></div>');

  	$("#progress" +printerNum).append('<div class="progress-bar progress-bar-info active" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"  id="progressBar' + printerNum +'"></div>');

  	$("#printerIframes").append('<iframe src="" id="printerIframe' + printerNum +'" style="width: 98vw;height: 98vh;position: relative; display: none;" class="printer-iframe" frameborder="0"></iframe>');
}

function eePrinterModal(index) {
	if (index === null) {
    		// Use blank/default values for new printer
    		index = numPrinters;
    		$("#eeIP").val("");
    		$("#eeCameraIP").val("");
    		$("#eePort").val("80");
    		$("#eeApikey").val("");
                $("#eeCamPort").val("8080");
  	} else if (index === numPrinters) {
      		// Do nothing.
      		// Keep the current printer values
  	} else {
      		// Pull in existing printer values
    		printers = JSON.parse(localStorage.getItem("savedPrinters"));
    		$("#eeCameraIP").val(printers.cameraIp[index]);
    		$("#eeIP").val(printers.ip[index]);
    		$("#eePort").val(printers.port[index]);
    		$("#eeApikey").val(printers.apikey[index]);
                $("#eeCamPort").val(printers.camPort[index]);
  	}
  	modalIndex = index;
  	$("#eePrinterModal").modal("show");
}

function importDefaults() {
  if (defaultPrinters === undefined) {
    bootbox.alert("No default printers configured. Please add them to default.js file");
    return;
  }
   $("#printerIframes").empty();
   deletePrinters(); 
   localStorage.setItem("savedPrinters", JSON.stringify(defaultPrinters));
   reloadPrinters();
}

function eeImportModal() {
   var newPrinters = JSON.parse($('#eeImportText').val());
   $("#printerIframes").empty();
   deletePrinters(); 
   localStorage.setItem("savedPrinters", JSON.stringify(newPrinters));
   reloadPrinters();
}

function exportSettings() {
    var dialog = bootbox.dialog({
    title: 'Export',
    message: "<pre>" + JSON.stringify(JSON.parse(localStorage.getItem("savedPrinters")), null, 4) + "</pre>",
    buttons: {
        close: {
            label: "Close",
            className: 'btn-default',
            callback: function(){
            }
        }
    }
    });
}

function eeFromModal() {
  	var index = modalIndex;
  	var eeIP = $("#eeIP").val();
  	var eeCameraIP = $("#eeCameraIP").val();
  	var eePort = $("#eePort").val();
  	var eeApikey = $("#eeApikey").val();
        var eeCamPort = $("#eeCamPort").val();
  	if (eeIP === "" || eeApikey === "" || eePort === "" || eeCamPort === "" || eeCameraIP === "") {
    		$("#missingInfoModal").modal("show");
  	} else {
   		testConnection(eeIP, eePort, eeApikey, index, eeCamPort, eeCameraIP);
  	}
}

function deletePrinters() {
	// remove the printers from localStorage
    	localStorage.removeItem("savedPrinters");
    	// remove the printers from the printers object
    	initPrinters();
    	// reset the number of printers
    	delete client;
	numPrinters = 0;
    	// remove all elements within the grid
	$("#printerGrid").empty();
  $("#printerIframes").empty();
}

function removePrinter(index) {
	var printerNum = index +1;
    	bootbox.confirm("Remove printer #" +(printerNum) +"?", function (result) {
  		if (result) {
  			// remove the printer from the page
			document.getElementById("printer" +index).remove();
  	    		// remove the printer from the printers object
			printers.ip.splice(index, 1);
        		printers.port.splice(index, 1);
        		printers.apikey.splice(index, 1);
                        printers.camPort.splice(index, 1);
  	    		// save new object to localStorage
			if (numPrinters <= 1) {
				localStorage.removeItem("savedPrinters");
			} else {
				localStorage.setItem("savedPrinters", JSON.stringify(printers));
  	    		}
			numPrinters = 0;
        		delete client;
			$("#printerGrid").empty();
      $("#printerIframes").empty();
			reloadPrinters();
    		}
  	});
}

function connectPrinter(index) {
	client[index].postJson("api/connection", { "command": "connect" });
}

function startJob(index) {
	client[index].postJson("api/job", { "command": "start" });
}

function controlPrinter(index) {
  var iframe = $("#printerIframe" + index);

  if (iframe.attr("src") === undefined || iframe.attr("src") === "") {
    iframe.attr("src", 'http://' +printers.ip[index] + ':' + printers.port[index] + '/');
  }
  $('#printerPanels').hide();
  $("#printerIframes").show();
  iframe.show();
  iframe.addClass("visible");
  $("#backFromIframeBtn").show();
}

function backFromIframe() {
  $("#backFromIframeBtn").hide();
  $("#printerIframes").hide();
  $(".printer-iframe").hide().removeClass("visible");
  $('#printerPanels').show();
  updatePrinters();
}

function makeBlank(index) {
      return;
    	// make panel border color red
    	document.getElementById("panel" + index).className = "panel panel-danger";
        printersInfo.state[index] = printerState.error;
    	// make the status fields blank
    	document.getElementById("printerStatus" +index).innerHTML ="&nbsp;";
    	document.getElementById("e0Temp" +index).innerHTML ="&nbsp;";
    	document.getElementById("e1Temp" +index).innerHTML ="&nbsp;";
    	document.getElementById("bedTemp" +index).innerHTML ="&nbsp;";
    	document.getElementById("currentFile" +index).innerHTML ="&nbsp;";
    	document.getElementById("timeLeft" +index).innerHTML ="&nbsp;";
    	// set progress bar to 0%
    	$("div#progressBar" +index).css("width", "0%");
    	// set panel footer to printer ip with not connected messgae
    	//document.getElementById("printerIP" +index).innerHTML = printers.ip[index] +" (not connected)";
}

function testConnection(ip, port, apikey, index, camPort, camIP) {
    	var testClient = new OctoPrintClient();
    	testClient.options.baseurl = "http://" + ip + ":" + port;
    	testClient.options.apikey = apikey;
    	testClient.get("/api/connection")
   	.done(function (response) {
       		if (response.current.state !== null) {
        		eePrinter(ip, port, apikey, index, camPort, camIP);
  		} else {
        		connectionError(ip, port, apikey, index, camPort, camIP);
  		}
   	})
   	.progress(function() {
       		console.log("H");
    	})
    	.fail(function () {
        	connectionError(ip, port, apikey, index, camPort, camIP);
    	});
}

function connectionError(ip, port, apikey, index,camPort, camIP) {
	var errorMessage = "PrinterView was unable to connect to the OctoPrint instance at <b>" + ip + "</b> using the following API key: " + apikey +". Do you still want to add this printer?";
  	bootbox.confirm(errorMessage, function (result) {
      		if (result) {
        		eePrinter(ip, port, apikey, index, camPort, camIP, "No Connection");
      		} else {
        		return 0;
      		}
  	});
}
