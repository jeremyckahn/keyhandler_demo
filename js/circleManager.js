function circleManager(canvas, x, y, radius, color){
	this.x = x;
	this.y = y;
	this.radius = radius;

	if (!color)
		this.color = "#ddd";
	else
		this.color = color;
	
	this.canvas = canvas;
	this.context = this.canvas.context;
	
	this.paint = function(x, y, color){
		this.context.beginPath();
		this.context.arc(!!x ? x : this.x, !!y ? y : this.y, this.radius, 0, Math.PI*2, true);
		this.context.fillStyle = !!color ? color : this.color;
		this.context.fill();
		this.context.closePath();
	}
}

circleManager.prototype.draw = function(){
	   
	   if (typeof this.behavior === "function")
	   	   this.behavior();
	
	   this.paint();
}

circleManager.prototype.behavior = function(){
	   // Override this!
}