$(document).ready(function() {
	"use strict";
	$("#reset").disabled = true;
	var socket = io.connect('http://localhost:3000/');
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
				"color": "#45C585"
			});
			$("#reset").attr("disabled", false);
		} else if(position.draw) {
			$("#message").text("Game ended in a draw.")
			.css({
				"color": "#5E84CF"
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
				"color": "#FF6262"
			});
			$("#reset").attr("disabled", false);
		} else if(position.draw) {
			$("#message").text("Game ended in a draw.")
			.css({
				"color": "#5E84CF"
			});
			$("#reset").attr("disabled", false);
		}
	});

    socket.on("spectator", function() {
        $(".square").prop("disabled", true);
        $("#reset").attr("disabled", true);
        $("#message").html("You are spectating! Go to <a href = '/'>home</a> to create a new game.")
        .css("color", "#1A334C");
    }); 

    socket.on("update", function(played) {
        var keys = Object.keys(played);
        console.log(keys); 
        for(var key in keys) {
            var square = played[keys[key]];
            $("#" + square.row + "_" + square.col).text(square.symbol)
            .css("color", square.color)
            .prop("disabled", true);
        }
    });
    
    socket.on("disable", function() {
        $("#game").prop("played", true);
    });

});
