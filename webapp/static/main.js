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
	function updateDotPosition() {
		if(singEmitTimer){
			var freqRaito = ($("#sing-frequency").val() - $("#sing-frequency").attr("min"))/($("#sing-frequency").attr("max") - $("#sing-frequency").attr("min"))
			var strengthRaito = ($("#sing-strength").val() - $("#sing-strength").attr("min"))/($("#sing-strength").attr("max") - $("#sing-strength").attr("min"))
			$("#sing-pad").css("background-color", "lightgray");
		}else{
			var freqRaito = 0
			var strengthRaito = 0	
			$("#sing-pad").css("background-color", "white");
		}		
		$("#sing-pad-dot").css("bottom", strengthRaito * 200 - 8).css("left", freqRaito * 200 - 8)
	}
	$("#sing-pad-dot").on("dragstart", function() {
		return false;		
	}).css("pointer-events", "none")

	function vibratoOn(){
		console.log("vibratoOn")
		if(singEmitTimer){
			clearTimeout(singEmitTimer);
			return
		}
		console.log("strength", +$("#sing-strength").val(), "freq", $("#sing-frequency").val()/10)

		var emit = function () {
			var interval = Math.round(1000 / ($("#sing-frequency").val() / 10))
			socket.emit('test', {
				// add + for numeric value
				length: Math.round(interval),
				strength: +$("#sing-strength").val(),
				envelopeFunction: "sin",
				updateInterval: +$("#sing-update-interval"),
				envelopeFunction: $("#sing-envelope").val(),
			});
			console.log("strength", +$("#sing-strength").val(), "freq", $("#sing-frequency").val()/10)
			singEmitTimer = setTimeout(emit, interval);
		}
		emit();

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
	 	updateDotPosition();
	}
	function vibratoOff(){
		console.log("vibratoOff")
		if (!singEmitTimer) return;
		clearTimeout(singEmitTimer);
		singEmitTimer = false;
		$("#sing-frequency").val($("#sing-frequency").attr("min"))
		$("#sing-strength").val($("#sing-strength").attr("min"))
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
	 	updateDotPosition();
	}
	
	$("#sing-vibrato").mousedown(vibratoOn).mouseup(vibratoOff)
	$("#sing-vibrato-toggle").click(function () {
		if(singEmitTimer) {
			vibratoOff();
		}else{
			vibratoOn();
		}
	})

	function updateParam(evt) {
		if (evt.type == "mousemove" && +new Date() - lastParamUpdated < 50){
			return
		}
		lastParamUpdated = +new Date();

	 	var freq = Math.round(10 + evt.offsetX / $(evt.currentTarget).width() * 9 * 10) / 10
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
	$("#sing-pad").mousedown(updateParam).mousedown(function (evt) {
		padMouseDownFlag = true
		updateParam(evt);
		vibratoOn(evt);
	}).mouseup(function (evt) {
		padMouseDownFlag = false
		updateParam(evt);
		vibratoOff(evt);
	}).mousemove(function (evt) {
		if(padMouseDownFlag){
			updateParam(evt);
		}
	}).mouseout(function (evt) {
		if(padMouseDownFlag){
			padMouseDownFlag = false;
			vibratoOff();
		}
	})

	/*
	 * +++++++++++++++++++++++++++++
	 * Youtube song interface
	 * +++++++++++++++++++++++++++++
	 */
    var loadSettingTimer = null;
    var playStartTimestamp = 0
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
		if (youtubePlayer.getPlayerState() == 1){
			youtubeSettingsSeekIndex = 0
			$("#youtube-record").attr("disabled", true);
			$("#youtube-play").attr("disabled", true);
		} else {
			$("#youtube-record").attr("disabled", false);
			$("#youtube-play").attr("disabled", false);			
		}
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
    /*
     localStorageから設定を読み込み
     */
    function loadSettingsFromLocalStorage(){
	    if(window.localStorage && window.localStorage.youtubeSettings){
	    	youtubeSettings = JSON.parse(window.localStorage.youtubeSettings);
	    }
	    if(!youtubeSettings.length) youtubeSettings = [];
	    updateSettingJSON();
    }
    loadSettingsFromLocalStorage();

	function loadCurrentParameter(){
		var setting;
		if (!youtubePlaying){
			// console.log("loadCurrentParameter: youtubeplaying flag is off");
			return
		}
		if (youtubePlayer.getPlayerState() != 1){
			// console.log("loadCurrentParameter: youtubePlayer.getPlayerState() is not playing state");
			return
		}
		if(setting = youtubeSettings[youtubeSettingsSeekIndex]){
			if (setting.timeStamp > youtubePlayer.getCurrentTime()){
				// do nothing
				// console.log("loadCurrentParameter: no op");
				return
			}
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
					updateDotPosition();
					break;
				default:
					console.log("unknown event:", setting.event)
					break;
			}
			// console.log("loadCurrentParameter:", youtubeSettingsSeekIndex);
			youtubeSettingsSeekIndex ++;
			updateDotPosition();
			loadCurrentParameter();
		}else{
			// console.log("loadCurrentParameter: Seekindex out of range", youtubeSettingsSeekIndex)
		}
	}
	var loadParameterTimer = setInterval(loadCurrentParameter, 50);

	$("#youtube-switch").children().each(function(e){
		$(this).click(function() {
			youtubePlayer.cueVideoById($(this).attr("x-youtube-id"), $(this).attr("x-youtube-playAt"))
			playStartTimestamp = +$(this).attr("x-youtube-playAt")
		})
	});
	$("#youtube-record").click(function() {
		youtubeSettingsSeekIndex = 0;
		youtubeRecording = true;
		youtubePlaying = false;
		youtubePlayer.playVideo();
		youtubePlayer.seekTo(playStartTimestamp, true);
	});
	$("#youtube-play").click(function() {
		try{
			youtubeSettings = JSON.parse($("#youtube-settings").val());
		}catch(e){
			youtubeSettings = []
			alert("JSON parse failed")
		}
		youtubeRecording = false;
		youtubePlaying = true;
		youtubeSettingsSeekIndex = 0;
		youtubePlayer.seekTo(playStartTimestamp, true);
		if (loadSettingTimer){
			clearTimeout(loadSettingTimer)
		}
	});
	$("#youtube-stop").click(function() {
		youtubeRecording = false;		
		youtubePlaying = false;
		youtubeSettingsSeekIndex = 0;
		youtubePlayer.stopVideo()
		if (loadSettingTimer){
			clearTimeout(loadSettingTimer)
		}
		vibratoOff();
	});

	$(window).bind('beforeunload', function(event) {
		localStorage.youtubeSettings = JSON.stringify(youtubeSettings);
	});
})