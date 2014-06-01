$(document).ready(function() {
	"use strict";
	$("#reset").disabled = true;
	var socket = io.connect('http://localhost:3000');
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
			socket.emit("clicked", {
				"row": row,
				"col": col
			});
		}
	});

	$("#reset").click(function() {
		socket.emit("reset");
	});

	socket.on("reset", function() {
		$(".square").text("").prop("disabled", false);
		$("#reset").attr("disabled", true);
		$("#result").text("");
	});

	socket.on("played", function(position) {
		$("#" + position.row + "_" + position.col).text(position.symbol)
		.css("color", position.color)
		.prop("disabled", true);
		$("#game").prop("played", true);
		if(position.over) {
			var message = $("<p>", {id: "result"});
			message.text("Congratulations! You win.");
			message.css({
				"font-size": "30pt",
				"color": "green"
			});
			$("#message").append(message);
			$("#reset").attr("disabled", false);
		}
	});

	socket.on("clicked", function(position) {
		$("#" + position.row + "_" + position.col).text(position.symbol)
		.css("color", position.color)
		.prop("disabled", true);
		$("#game").prop("played", false);
		if(position.over) {
			var message = $("<p>", {id: "result"});
			message.text("Sorry! You lost.");
			message.css({
				"font-size": "30pt",
				"color": "red"
			});
			$("#message").append(message);
			$("#reset").attr("disabled", false);
		}
	});
});
