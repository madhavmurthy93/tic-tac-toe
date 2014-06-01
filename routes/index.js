var express = require('express');

exports.index = function(req, res) {
  var id = Math.round(Math.random() * 100000);

  res.redirect('/' + id);
};

exports.game = function(req, res) {
	res.render("index");
}

