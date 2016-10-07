var socket = io();
$(function () {

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

	var singEmitTimer;
	$("#sing-freqency").change(function () {
		$("#sing-freqency-label").text($("#sing-freqency").val() / 10)
	});
	$("#sing-strength").change(function () {
		$("#sing-strength-label").text($("#sing-strength").val())
	})
	var vibratoOn = function(){
		if(singEmitTimer){
			clearTimeout(singEmitTimer);
		}
		var emit = function () {
			var interval = Math.round(1000 / ($("#sing-freqency").val() / 10))
			socket.emit('test', {
				// add + for numeric value
				length: Math.round(interval * 0.7),
				strength: +$("#sing-strength").val(),
				envelopeFunction: "sina",
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
	 	var freq = Math.round(1 + evt.offsetX / $(evt.currentTarget).width() * 9 * 10) / 10
	 	var strength = 100 - Math.round(evt.offsetY / $(evt.currentTarget).height() * 100)
	 	$("#sing-freqency").val(freq * 10)
	 	$("#sing-freqency-label").text(freq)
	 	$("#sing-strength").val(strength)
	 	$("#sing-strength-label").text(strength)
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


})