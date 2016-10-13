"use strict";
var socket = io();
var youtubePlayer
var onYouTubeIframeAPIReady;
var onPlayerReady;
var onPlayerStateChange;

$(function () {
	 /** test interface */
	 var testEmitTimer;
	 $("#test-length").change(function () {
	 	$("#test-length-label").text($("#test-length").val())
	 });
	 $("#test-strength").change(function () {
	 	$("#test-strength-label").text($("#test-strength").val())
	 })
	 $("#test-submit").click(function () {
	 	var afn = function () {
			socket.emit('test', {
				// add + for numeric value
				length: +$("#test-length").val(),
				strength: +$("#test-strength").val(),
				envelopeFunction: $("#test-envelope").val(),
				updateInterval: +$("#test-update-interval").val()
			});
	 	}

		if($("#test-repeat").prop('checked')){
			if(testEmitTimer) clearInterval(testEmitTimer);
			testEmitTimer = setInterval(afn, +Math.max($("#test-interval").val(), 50))
	 	}
	 });

	 $("#test-repeat").change(function () {
	 	if($("#test-repeat").prop('checked')){
	 		// この状態でsubmitボタンを押すと繰り返し実行される
	 	}else{
	 		if(testEmitTimer) clearInterval(testEmitTimer);
	 	}
	 })

	 /** sing interface */
	var singEmitTimer;
	$("#sing-freqency").change(function () {
		$("#sing-freqency-label").text($("#sing-freqency").val() / 10)
	});
	$("#sing-strength").change(function () {
		$("#sing-strength-label").text($("#sing-strength").val())
	})
	var updateDotPosition = function() {
		if(singEmitTimer){
			var freqRaito = ($("#sing-freqency").val() - $("#sing-freqency").attr("min"))/($("#sing-freqency").attr("max") - $("#sing-freqency").attr("min"))
			var strengthRaito = ($("#sing-strength").val() - $("#sing-strength").attr("min"))/($("#sing-strength").attr("max") - $("#sing-strength").attr("min"))
		}else{
			var freqRaito = 0
			var strengthRaito = 0	
		}		
		$("#sing-pad-dot").css("bottom", strengthRaito * 200 - 8).css("left", freqRaito * 200 - 8)
	}
	$("#sing-pad-dot").on("dragstart", function() {
		return false;		
	}).css("pointer-events", "none")
	var vibratoOn = function(){
		if(singEmitTimer){
			clearTimeout(singEmitTimer);
		}
		var emit = function () {
			var interval = Math.round(1000 / ($("#sing-freqency").val() / 10))
			socket.emit('test', {
				// add + for numeric value
				length: Math.round(interval),
				strength: +$("#sing-strength").val(),
				envelopeFunction: "sin",
				updateInterval: 20
			});
			singEmitTimer = setTimeout(emit, interval);
		}
		emit();
		$("#sing-pad").css("background-color", "lightgray");
	}
	var vibratoOff = function(){
		clearTimeout(singEmitTimer);
		singEmitTimer = false;
		$("#sing-pad").css("background-color", "white");
	}
	$("#sing-vibrato").mousedown(vibratoOn).mouseup(vibratoOff)
	$("#sing-vibrato-toggle").click(function () {
		if(singEmitTimer) {
			vibratoOff();
		}else{
			vibratoOn();
		}
	})

	var updateParam = function (evt) {
		// console.log(evt);
	 // 	console.log(evt.offsetX, evt.offsetY, $(evt.currentTarget).height(), $(evt.currentTarget).width())
	 	var freq = Math.round(10 + evt.offsetX / $(evt.currentTarget).width() * 6 * 10) / 10
	 	var strength = 100 - Math.round(evt.offsetY / $(evt.currentTarget).height() * 100)
	 	$("#sing-freqency").val(freq * 10)
	 	$("#sing-freqency-label").text(freq)
	 	$("#sing-strength").val(strength)
	 	$("#sing-strength-label").text(strength)
	 	updateDotPosition();
	}
	var padMouseDownFlag = false
	$("#sing-pad").mousedown(updateParam).mousedown(function () {
		padMouseDownFlag = true
	}).mouseup(function () {
		padMouseDownFlag = false
	}).mousemove(function (evt) {
		if(padMouseDownFlag){
			updateParam(evt);
		}
	}).mouseout(function () {
		padMouseDownFlag = false;
		vibratoOff();
	}).mousedown(vibratoOn).mouseup(vibratoOff);

	/** song interface */
    onYouTubeIframeAPIReady = function() {
    	youtubePlayer = new YT.Player('youtubePlayer', {
          videoId: 'vNhhAEupU4g',
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });
        console.log("Youtube iframe API Loaded");
    	console.log(youtubePlayer)
        setInterval(showCurrentTime, 200);
    }
    onPlayerReady = function() {
    	console.log("Youtube iframe API Player Ready")
    }
	onPlayerStateChange = function() {
    	console.log("Youtube iframe API State Changed")
	};

    console.log("Youtube iframe API Loading");
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    var youtubePlayer = null;
    
    function showCurrentTime() {
        if (youtubePlayer.getCurrentTime) console.log(youtubePlayer.getCurrentTime());
    }
	$("#youtube-switch").children().each(function(e){
		$(this).click(function() {
			youtubePlayer.cueVideoById($(this).attr("x-youtube-id"), $(this).attr("x-youtube-from"))

		})
	});
})