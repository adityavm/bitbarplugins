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

	let priority = {
		symbol: ["","🚫","♨️","‼️","❗️","❕"],
		inword: ["","blocker","critical","major","minor","trivial"]
	};

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
			url: "http://"+ cfg.jira_user +":"+ cfg.jira_pass +"@jira.unikrn.com/rest/api/2/search?jql=" + encodeURIComponent('type in ("Bug", "Task") AND status in (New, "To Do", "In Progress") AND resolution = Unresolved AND assignee in (currentUser()) ORDER BY updatedDate DESC'),
		}
		request.get(opts.url, function(err,resp,body){
			if(err){
				// console.log(err, body);
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

			[1,2,3,4,5].map(function(i){
				title.push(
					issues[priority.inword[i]].length && cfg.jira_show.indexOf(priority.inword[i])>-1 ? priority.symbol[i] + issues[priority.inword[i]].length : ""
				)
			});

			var output = [
				{
					text: title.join(""),
				},
				bitbar.sep
			];

			[1,2,3,4,5].map(function(i){
				output.push({text: priority.symbol[i] +" "+ issues[priority.inword[i]].length +" "+ priority.inword[i]});
			});

			output.push(bitbar.sep);
			output.push({text: "Last 5 Updated Issues"});

			[0,1,2,3,4].map(function(i){
				output.push({
					text: priority.symbol[body.issues[i].fields.priority.id] +" "+ body.issues[i].fields.summary,
					href: "https://jira.unikrn.com/browse/"+ body.issues[i].key
				})
			});

			bitbar(output);
		});
	});
})();

