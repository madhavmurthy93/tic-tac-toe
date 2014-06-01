$(document).ready(function() {
	"use strict";
	$("#reset").disabled = true;
	var socket = io.connect('http://localhost:3000/game');
	var pixels = 120;
	(function () {
		for(var row = 0; row < 3; row++) {
			for(var col = 0; col < 3; col++) {
				var square = $("<div>", {class: "square", id: row + "_" + col});
				var xpos = (col * pixels);
				var ypos = (row * pixels);
				square.css({
					"left": xpos + "px",
					"top": ypos + "px"
				});
				$("#game").append(square);
			}
		}
	})();

	$(".square").click(function() {
		if(!($(this).prop("disabled")) && !($("#game").prop("played"))) {
			var row = parseInt($(this).css("top")) / pixels;
			var col = parseInt($(this).css("left")) / pixels;
			console.log(row + " " + col);
			socket.emit("clicked", {
				"row": row,
				"col": col
			});
		}
	});

	$("#reset").click(function() {
		socket.emit("reset");
	});

	socket.on("connect", function() {
		var id = Number(window.location.pathname.match(/\/(\d+)$/)[1]);
		socket.emit("load", id);
	});

	socket.on("reset", function() {
		$(".square").text("").prop("disabled", false);
		$("#reset").attr("disabled", true);
		$("#message").text("");
	});

	socket.on("played", function(position) {
		$("#" + position.row + "_" + position.col).text(position.symbol)
		.css("color", position.color)
		.prop("disabled", true);
		$("#game").prop("played", true);
		if(position.over) {
			$("#message").text("Congratulations! You win.")
			.css({
				"font-size": "30pt",
				"color": "green"
			});
			$("#reset").attr("disabled", false);
		}
	});

	socket.on("clicked", function(position) {
		$("#" + position.row + "_" + position.col).text(position.symbol)
		.css("color", position.color)
		.prop("disabled", true);
		$("#game").prop("played", false);
		if(position.over) {
			$("#message").text("Sorry! You lose.")
			.css({
				"font-size": "30pt",
				"color": "red"
			});
			$("#reset").attr("disabled", false);
		}
	});
});
