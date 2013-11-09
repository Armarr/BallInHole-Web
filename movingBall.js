window.onload = init;

var winW, winH;
var ball;
var hole;
var mouseDown;
var touchDown;
var movementTimer;
var mouseDownLocation, lastOrientation, touchDownLocation;
var ballVelocity;
var xDelta, yDelta;
var gravity = 0.5;
var friction = 2;
var framesPerSecond = 60;
var timer; 
var time = 0;
                            
// Initialisation on opening of the window
function init() {
	lastOrientation = {};
	window.addEventListener('resize', doLayout, false);
	document.body.addEventListener('mousemove', onMouseMove, false);
	document.body.addEventListener('mousedown', onMouseDown, false);
	document.body.addEventListener('mouseup', onMouseUp, false);
	document.body.addEventListener('touchmove', onTouchMove, false);
	document.body.addEventListener('touchstart', onTouchDown, false);
	document.body.addEventListener('touchend', onTouchUp, false);
	window.addEventListener('deviceorientation', deviceOrientationTest, false);
	mouseDownLocation = {x:0, y:0};
	touchDownLocation = {x:0, y:0};
	ballVelocity = {x:0, y:0};
	xDelta = 0;
	yDelta = 0;
	mouseDown = false;
	touchDown = false;
	doLayout(document);
	startGame();
}

// Does the gyroscope or accelerometer actually work?
function deviceOrientationTest(event) {
	window.removeEventListener('deviceorientation', deviceOrientationTest);
	if (event.beta != null && event.gamma != null) {
		window.addEventListener('deviceorientation', onDeviceOrientationChange, false);
	}
}

function doLayout(event) {
	winW = window.innerWidth;
	winH = window.innerHeight;
	var surface = document.getElementById('surface');
	surface.width = winW;
	surface.height = winH;
	ball = {	radius:30,
				x:Math.round(winW/2),
				y:Math.round(winH/2),
				color:'green',
				strokeColor:'#003300'};
				
	hole = {	radius:40,
				x:Math.round(winW/3*2),
				y:Math.round(winH/3*2),
				color:'black'};
}

function update(event) {
	var surface = document.getElementById('surface');
	var context = surface.getContext('2d');
	context.clearRect(0, 0, surface.width, surface.height);

	applySensor();
	moveBall();
	checkWin();
	renderHole(context);
	renderBall(context);
	renderContactPoint(context);
}

function checkWin(){
	if(distanceBetweenBallAndHole() < 5){
		stopGame();
		alert("You won!");
	}
}

function startGame(){	 
		if(timer == null)
	timer = setInterval(updateTime, 1000);
		if(movementTimer == null)
	movementTimer = setInterval(update, 1000/framesPerSecond);
	document.getElementById("timerText").innerHTML = time;
}

function pauseGame(){
	window.clearInterval(movementTimer);
	movementTimer = null;
	window.clearInterval(timer);
	timer = null;
	mouseDown = false;
	touchDown = false;
	update();
}

function stopGame(){
	doLayout(document);
	pauseGame();
	ballVelocity = {x:0, y:0};
	time = 0;
	update();
}
function updateTime(){
	time++;
	document.getElementById("timerText").innerHTML = time;
}

function renderHole(context) {	
	context.beginPath();
	context.arc(hole.x, hole.y, hole.radius, 0, 2 * Math.PI, false);
	context.fillStyle = hole.color;
	context.fill();	
} 
	
function renderBall(context) {
	context.beginPath();
	context.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI, false);
	context.fillStyle = ball.color;
	context.fill();
	context.lineWidth = 3;
	context.strokeStyle = ball.strokeColor;
	context.stroke();		
} 

function renderContactPoint(context) {
	if(mouseDown || touchDown){
		var x = 0;
		var y = 0;
		if(mouseDown){
			x = mouseDownLocation.x;
			y = mouseDownLocation.y;
		}else{
			x = touchDownLocation.x;
			y = touchDownLocation.y;
		}	
		context.beginPath();
		context.arc(x, y, 30, 0, 2 * Math.PI, false);
		var gradient = context.createRadialGradient(x, y, 10, x, y, 30);
		gradient.addColorStop(0, 'yellow');
		gradient.addColorStop(1, 'transparent');
		context.fillStyle = gradient;
		context.fill();
	}	
} 

function applySensor() {
	if(lastOrientation.length > 0){
		switch (window.orientation) {
			case 0: // portrait - normal
				xDelta = lastOrientation.gamma;
				yDelta = lastOrientation.beta;
				break;
			case 180: // portrait - upside down
				xDelta = lastOrientation.gamma * -1;
				yDelta = lastOrientation.beta * -1;
				break;
			case 90: // landscape - bottom right
				xDelta = lastOrientation.beta;
				yDelta = lastOrientation.gamma * -1;
				break;
			case -90: // landscape - bottom left
				xDelta = lastOrientation.beta * -1;
				yDelta = lastOrientation.gamma;
				break;
			default:
				xDelta = lastOrientation.gamma;
				yDelta = lastOrientation.beta;
		}
		xDelta = xDelta / 20;
		yDelta = yDelta / 20;
	}
}

function moveBall(){
	ballVelocity.x += xDelta * gravity / framesPerSecond;
	ballVelocity.y += yDelta * gravity / framesPerSecond;
	
	ballVelocity.x = ballVelocity.x * (1 - (friction/framesPerSecond));
	ballVelocity.y = ballVelocity.y * (1 - (friction/framesPerSecond));
	
	//bounce top or bottom > negative x velocity
	if(ball.x + ball.radius > winW || ball.x - ball.radius < 0){
		ballVelocity.x = -ballVelocity.x;
		if(ball.x + ball.radius > winW){
			ball.x = winW - ball.radius;
		}else{
			ball.x = ball.radius;
		}
	}
	//bounce left or right > negative y velocity
	if(ball.y + ball.radius > winH || ball.y - ball.radius < 0){
		ballVelocity.y = -ballVelocity.y;
		if(ball.y + ball.radius > winH){
			ball.y = winH - ball.radius;
		}else{
			ball.y = ball.radius;
		}
	}
	
	//if the ball comes close to the hole it starts to fall towards it
	if(distanceBetweenBallAndHole() < hole.radius){
		ballVelocity.x += (hole.x - ball.x) * gravity / framesPerSecond * 2;
		ballVelocity.y += (hole.y - ball.y) * gravity / framesPerSecond * 2;
	}
	
	ball.x += ballVelocity.x;
	ball.y += ballVelocity.y;
}

function distanceBetweenBallAndHole() {
	return Math.sqrt(Math.pow(ball.x - hole.x, 2) + Math.pow(ball.y - hole.y, 2));
}

function onMouseMove(event) {
	if(mouseDown){
		xDelta = event.clientX - mouseDownLocation.x;
		yDelta = event.clientY - mouseDownLocation.y;
	}
}

function onMouseDown(event) {
	mouseDownLocation.x = event.clientX;
	mouseDownLocation.y = event.clientY;
	mouseDown = true;
} 

function onMouseUp(event) {
	mouseDown = false;
	xDelta = 0;
	yDelta = 0;
}

function onTouchMove(event) {
	event.preventDefault();	
	if(touchDown){
		var touches = event.changedTouches;
		var xav = 0;
		var yav = 0;
		for (var i=0; i < touches.length; i++) {
			var x = touches[i].pageX;
			var y =	touches[i].pageY;
			xav += x;
			yav += y;
		}
		xav /= touches.length;
		yav /= touches.length;

		xDelta = xav - touchDownLocation.x;
		yDelta = yav - touchDownLocation.y;
	}
}

function onTouchDown(event) {
	event.preventDefault();
	var touches = event.changedTouches;
	for (var i=0; i < touches.length && !touchDown; i++) {
		touchDownLocation.x = touches[i].pageX;
		touchDownLocation.y = touches[i].pageY;
	}
	touchDown = true;		
} 

function onTouchUp(event) {
	touchDown = false;
	xDelta = 0;
	yDelta = 0;
}

function onDeviceOrientationChange(event) {
	lastOrientation.gamma = event.gamma;
	lastOrientation.beta = event.beta;
}
