var theCanvas;
var frameCount = 0;
var randCircSizeMin = 10;
var randCircSizeMax = 50;
var goCrazy = false;

var circle = {
	x : 100,
	y : 100,
	radius : 50,
	color : '#0f0'
},
keysdown = [];

$(document).ready(function(){
	/* 	INITIALIZATION AREA - BEGIN
	*	Canvas setup and run loop are defined here.
	*/
	$("#theCanvas").each(function(){
		// Keep a handle on the canvas
		theCanvas = this;
		
		jck(this,
		{
			fullscreen : true,
			framerate :  20,
			autoUpdate : true,
			autoClear : true,
			sampleFrames : true,
			autoUpdateProfiler : false
		});
		
		this.runloop = function(){
			this.circle(circle.x, circle.y, circle.radius, circle.color);
			
			for (i = 0; i < keysdown.length; i++){
			    switch(keysdown[i]){        
			        case 37: // Left
			            circle.x -= 4;
			            break;
			            
			        case 39: // Right
			            circle.x += 4;
			            break;
			    }
			}
			
		};	
	});
	
	$(document).keydown(function(evt){
		keysdown.addUnique(evt.which);	
	});
	
	$(document).keyup(function(evt){
		keysdown.remove(evt.which);
	});
	
	// Courtesy of @Tmdean
	$(window).blur(function() { 
		keysdown.length = 0;
	});
});
	
/* 	INITIALIZATION AREA - END */

Array.prototype.addUnique = function(val){
    for (i = 0; i < this.length; i++){
        if (this[i] == val)
            return;
    }
    
    this.push(val);
};

Array.prototype.remove = function(val){
    for (i = 0; i < this.length; i++){
        if (this[i] == val){
            this.splice(i, 1);
        }
    }
}