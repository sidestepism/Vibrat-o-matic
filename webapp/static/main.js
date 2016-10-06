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
		 		'length': +$("#test-length").val(),
				'strength': +$("#test-strength").val(),
				'waveform': +$("#test-waveform").val(),
			});
	 	}
	 	afn();

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
})