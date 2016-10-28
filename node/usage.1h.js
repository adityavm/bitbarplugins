#!/usr/bin/env /usr/local/bin/node

var
  request = require("request"),
  q = require("q"),
  parser = require("xmldom").DOMParser,
  xpath = require("xpath"),
  parse5 = require("parse5"),
  xmlser = require("xmlserializer"),
  bitbar = require("bitbar");

var promise = q.defer();

request.get("http://122.160.230.125:8080/planupdate/", function(e,r,b) {
  if (e) {
    throw e;
    return;
  }

  promise.resolve(b);
});

promise.promise.then(function(data) {
  var
    doc = parse5.parse(data),
    html = xmlser.serializeToString(doc),
    dom = new parser().parseFromString(html);

  var
    path = '//*[@style="height: 104px;"]',
    nodes = xpath.select(path, dom),
    dataNode = nodes[1],
    daysNode = nodes[2];

  var
    dataLeft = parseFloat(dataNode.childNodes[3].childNodes[1].childNodes[5].childNodes[0].nodeValue);
    daysLeft = parseInt(daysNode.childNodes[3].childNodes[1].childNodes[3].childNodes[0].nodeValue);

  var usageLeft = (dataLeft / daysLeft).toFixed(2);

  var
	color = "",
  	symbol = "";

  if (usageLeft < 5) {
  	color = "#B40717";
  	symbol = "⬇";
  }

  if (usageLeft >= 5) {
  	// color = "#FF8000";
		color = "#999999";
  	symbol = "=";
  }

  if (usageLeft > 8) {
  	color = "#00FF00";
  	symbol = "⬆";
  }

  bitbar([
  {
  	text: symbol,
  	color: color,
  	dropdown: false,
  },
  bitbar.sep,
  {
  	text: "Usage left: " + usageLeft + " GB/day",
  },
  bitbar.sep,
  {
  	text: "Data left: " + dataLeft + " GB",
  },
  {
  	text: "Days left: " + daysLeft + " days",
  },
  ]);
});
