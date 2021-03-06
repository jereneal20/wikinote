var wikiFS = require("../app/wikiFS");
var marked = require("marked");
var WikiPath = require("./wikipath");
var config = require("../config");
var userApp = require("./userApp");

marked.setOptions({
	gfm: true,
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: false,
	smartLists: true
});

var wikiApp = {};

wikiApp.view = function(req, res){
	wikiFS.readWiki(req.wikiPath, function(err, data){
		if(err) {
			console.log(err);
			data = null;
		} else {
			data = marked(data);
		}
		res.render("view", {title : "Wiki Note", wikiData: data});
	});
}
wikiApp.edit = function(req, res){
	wikiFS.readWiki(req.wikiPath, function(err, data){
		res.render("edit", {title : "Wiki Note::Edit", wikiData: data});
	});
}
wikiApp.save = function(req, res){
	var data = req.param("data");
	wikiFS.writeWiki(req.wikiPath, data, req.session.user, function(err){
		res.redirect(req.path);
	});
}
wikiApp.moveForm = function(req, res){
	res.render("move", {title : "Wiki Note::Move"});
}
wikiApp.move = function(req, res){
	wikiFS.move(req.wikiPath, new WikiPath(req.param("target")), function(){
		res.redirect(req.param("target"));
	});
}
wikiApp.attach = function(req, res){
	wikiFS.fileList(req.wikiPath, function(err, files){
		res.render("attach", {title : "Wiki Note::Attach", files: files || []});
	});
}
wikiApp.upload = function(req, res){
	var file = req.files.upload;
	wikiFS.acceptFile(file.path, req.wikiPath, file.name, function(err){
		if(err) {console.log(err); res.send(500); return;}
		res.redirect(req.path + "?attach");
	});
}
wikiApp.staticFiles = function(req, res){
	res.sendfile(saveDir + decodeURIComponent(req.path));
}
wikiApp.presentation = function(req, res){
	wikiFS.readWiki(req.wikiPath, function(err, data){
		var option = {};
		try {
			option = JSON.parse(data.match(/^<!--({.*})-->/)[1]);
		} catch (e){
		}
		res.render("presentation", {title : "Wiki Note::Presentation", wikiData: data, option : option});
	});
}
wikiApp.find = function(req, res){
	var word = req.param("find");
	if(word == ""){
		res.render("find", {title : "Wiki Note::Find", result : null});
		return;
	}
	wikiFS.find(req.wikiPath, word, function(e, data){
		res.render("find", {title : "Wiki Note::Find", result : data});
	});
}
wikiApp.deleteForm = function(req, res){
	res.render("delete", {title : "Wiki Note::Delete"});
}
wikiApp.deleteComfirm = function(req, res){
	if(req.wikiPath.name != req.param("comfirm")){
		req.flash("warn","note의 이름이 정확하지 않습니다.");
		res.redirect(req.wikiPath + "?delete" );
		return;
	}
	wikiFS.deleteFile(req.wikiPath, function(e){
		if(e) {
			console.log(e);
			req.flash("warn","fail to delete");
			res.redirect(req.wikiPath);
		} else {
			req.flash("info", "delete!");
			res.redirect("/" + config.frontPage);
		}
	});
}
wikiApp.history = function(req, res){
	wikiFS.history(req.wikiPath, function(e, logs){
		res.render("history", {title : "Wiki Note::History", logs : logs});
	});
}
module.exports = wikiApp;
