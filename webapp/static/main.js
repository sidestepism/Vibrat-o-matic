"use strict";
var socket = io();
var youtubePlayer
var onYouTubeIframeAPIReady;
var onPlayerReady;
var onPlayerStateChange;
var youtubeRecording = false;
var youtubePlaying = false;
var lastParamUpdated = 0;

// output JSON to textarea
var youtubeSettings = [];
// iterator
var youtubeSettingsSeekIndex = 0;

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
	 	console.log("submit")
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
	 	
	 	afn();
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
	$("#sing-frequency").change(function () {
		$("#sing-frequency-label").text($("#sing-frequency").val() / 10)
	});
	$("#sing-strength").change(function () {
		$("#sing-strength-label").text($("#sing-strength").val())
	})
	var updateDotPosition = function() {
		if(singEmitTimer){
			var freqRaito = ($("#sing-frequency").val() - $("#sing-frequency").attr("min"))/($("#sing-frequency").attr("max") - $("#sing-frequency").attr("min"))
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
			return
		}
		var emit = function () {
			var interval = Math.round(1000 / ($("#sing-frequency").val() / 10))
			socket.emit('test', {
				// add + for numeric value
				length: Math.round(interval),
				strength: +$("#sing-strength").val(),
				updateInterval: +$("#sing-update-interval")
				envelopeFunction: $("#sing-envelope").val(),
			});
			singEmitTimer = setTimeout(emit, interval);
		}
		emit();
		$("#sing-pad").css("background-color", "lightgray");

	 	// 録画
		if (youtubeRecording && youtubePlayer.getPlayerState() == 1){
			console.log("record", youtubePlayer.getCurrentTime())
			youtubeSettings.push({
				timeStamp: Math.floor(youtubePlayer.getCurrentTime()*1000)/1000,
				event: "vibratoOn",
				frequency: $("#sing-frequency").val(),
				strength: $("#sing-strength").val()
			})
			updateSettingJSON();
		}
	}
	var vibratoOff = function(){
		if (!singEmitTimer) return;
		clearTimeout(singEmitTimer);
		singEmitTimer = false;
		$("#sing-pad").css("background-color", "white");

	 	// 録画
		if (youtubeRecording && youtubePlayer.getPlayerState() == 1){
			youtubeSettings.push({
				timeStamp: Math.floor(youtubePlayer.getCurrentTime()*1000)/1000,
				event: "vibratoOff",
				frequency: $("#sing-frequency").attr("min"),
				strength: $("#sing-strength").attr("min")
			})
			updateSettingJSON();
		}
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
		if (!singEmitTimer){
			return
		}
		if (+new Date() - lastParamUpdated < 50){
			return
		}
		lastParamUpdated = +new Date();

	 	var freq = Math.round(10 + evt.offsetX / $(evt.currentTarget).width() * 6 * 10) / 10
	 	var strength = 100 - Math.round(evt.offsetY / $(evt.currentTarget).height() * 100)
	 	$("#sing-frequency").val(freq * 10)
	 	$("#sing-frequency-label").text(freq)
	 	$("#sing-strength").val(strength)
	 	$("#sing-strength-label").text(strength)
	 	updateDotPosition();

	 	// 録画
		if (youtubeRecording && youtubePlayer.getPlayerState() == 1){
			youtubeSettings.push({
				timeStamp: Math.floor(youtubePlayer.getCurrentTime()*1000)/1000,
				event: "updateParam",
				frequency: $("#sing-frequency").val(),
				strength: $("#sing-strength").val()
			})
			updateSettingJSON();
		}
	}
	var padMouseDownFlag = false
	$("#sing-pad").mousedown(updateParam).mousedown(function () {
		padMouseDownFlag = true
		updateParam(evt);
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

	/*
	 * +++++++++++++++++++++++++++++
	 * Youtube song interface
	 * +++++++++++++++++++++++++++++
	 */
    var loadSettingTimer = null;
    onYouTubeIframeAPIReady = function() {
    	youtubePlayer = new YT.Player('youtube-player', {
          videoId: 'vNhhAEupU4g',
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });
        console.log("Youtube iframe API Loaded");
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
    function updateSettingJSON(){
    	$("#youtube-settings").val(JSON.stringify(youtubeSettings))
    }
	$("#youtube-switch").children().each(function(e){
		$(this).click(function() {
			youtubePlayer.cueVideoById($(this).attr("x-youtube-id"), $(this).attr("x-youtube-from"))
		})
	});
	$("#youtube-record").click(function() {
		youtubeRecording = true;
		youtubePlaying = false;
		$("#youtube-record").attr("disabled", true)
		$("#youtube-play").attr("disabled", true)
		youtubePlayer.playVideo()
	});
	$("#youtube-play").click(function() {
		youtubeSettings = JSON.parse($("#youtube-settings").val());
		youtubeRecording = false;
		youtubePlaying = true;
		youtubeSettingsSeekIndex = 0;
		function loadNextSetting(){
			var setting;
			if(!youtubePlaying){
				conosle.log("loadNextSetting: youtubeplaying flag is off");
				loadSettingTimer = setTimeout(loadNextSetting, 100);
			}
			if(youtubePlayer.getPlayerState() != 1){
				console.log("loadNextSetting: youtubePlayer.getPlayerState() is not playing state");
				loadSettingTimer = setTimeout(loadNextSetting, 100);
			}
			if(setting = youtubeSettings[youtubeSettingsSeekIndex]){
				console.log("loading setting:", setting)
				switch (setting.event) {
					case "vibratoOn":
						$("#sing-frequency").val(setting.frequency);
						$("#sing-strength").val(setting.strength);
						vibratoOn();
						break;
					case "vibratoOff":
						$("#sing-frequency").val(setting.frequency);
						$("#sing-strength").val(setting.strength);
						vibratoOff();
						break;
					case "updateParam":
						$("#sing-frequency").val(setting.frequency);
						$("#sing-strength").val(setting.strength);
						break;
					default:
						console.log("unknown event:", setting.event)
						break;
				}
				updateDotPosition();
				youtubeSettingsSeekIndex ++
				if(setting = youtubeSettings[youtubeSettingsSeekIndex]){
					loadSettingTimer = setTimeout(loadNextSetting, (setting.timeStamp - youtubePlayer.getCurrentTime()) * 1000);
				}
			}else{
				console.log("loadNextSetting: Seekindex out of range", youtubeSettingsSeekIndex)
			}
		}

		$("#youtube-record").attr("disabled", true)
		$("#youtube-play").attr("disabled", true)
		youtubePlayer.playVideo();
		if (loadSettingTimer){
			clearTimeout(loadSettingTimer)
		}
		loadSettingTimer = setTimeout(loadNextSetting, 100);
	});
	$("#youtube-stop").click(function() {
		youtubeRecording = false;		
		youtubePlaying = false;
		$("#youtube-record").attr("disabled", false)
		$("#youtube-play").attr("disabled", false)
		youtubePlayer.stopVideo()
	});

})