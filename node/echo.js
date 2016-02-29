#!/usr/bin/env /usr/local/bin/node
"use strict";

const bitbar = require("bitbar"),
	request = require("request"),
	fs = require("fs"),
	q = require("q");

function extend(o,n) {
	var i;
	for(i in n) {
		o[i] = n[i];
	}
	return o;
}

(function(){
	let cfg = {},
		ptbb = "/Users/aditya/dev/bitbar-plugins/node",
		fsread = q.defer();

	fs.readFile(ptbb +"/.cfg", "utf8", function(err,body){
		if(err) {
			console.log(process.cwd());
			console.log(err);
			return;
		}
		var parsed = JSON.parse(body);
		fsread.resolve(parsed);
	});

	fsread.promise.then(function(_cfg){
		cfg = extend(cfg, _cfg);
		let opts = {
			url: "http://"+ cfg.jira_user +":"+ cfg.jira_pass +"@jira.unikrn.com/rest/api/2/search?jql=" + encodeURIComponent('status in (New, "To Do", "In Progress") AND resolution = Unresolved AND assignee in (currentUser()) ORDER BY priority DESC, updatedDate DESC'),
		}
		request.get(opts.url, function(err,resp,body){
			if(err){
				return;
			}

			body = JSON.parse(body);

			let issues = {
				blocker: body.issues.filter(function(iss){ return iss.fields.priority.id==1; }),
				critical: body.issues.filter(function(iss){ return iss.fields.priority.id==2; }),
				major: body.issues.filter(function(iss){ return iss.fields.priority.id==3; }),
				minor: body.issues.filter(function(iss){ return iss.fields.priority.id==4; }),
				trivial: body.issues.filter(function(iss){ return iss.fields.priority.id==5; })
			}

			let title = [];

			title.push((issues.blocker.length && cfg.jira_show.indexOf("blocker")>-1) ? "🚫"+ issues.blocker.length : "");
			title.push((issues.critical.length && cfg.jira_show.indexOf("critical")>-1) ? "♨️"+ issues.major.length : "");
			title.push((issues.major.length && cfg.jira_show.indexOf("major")>-1) ? "‼️"+ issues.major.length : "");
			title.push((issues.minor.length && cfg.jira_show.indexOf("minor")>-1) ? "❗️"+ issues.minor.length : "");
			title.push((issues.trivial.length && cfg.jira_show.indexOf("trivial")>-1) ? "❕"+ issues.trivial.length : "");

			bitbar([
				{
					text: title.join(""),
					dropdown: false
				},
				bitbar.sep,
				{
					text: "🚫"+ issues.blocker.length +" Blockers"
				},
				{
					text: "♨️"+ issues.critical.length +" Critical"
				},
				{
					text: "‼️"+ issues.major.length +" Major"
				},
				{
					text: "❗️"+ issues.minor.length +" Minor"
				},
				{
					text: "❕"+ issues.trivial.length +" Trival"
				}
			])
		});
	});
})();

