/*
	jQuery Canvas Kit
	v. 0.2
	Updated: 7/3/2010
	
	by Jeremy Kahn - jeremyckahn@gmail.com
	http://www.jerbils.com/

	SVN: http://code.google.com/p/jquerycanvaskit/

	jQuery Canvas Kit (JCK) is a jQuery toolkit that extends functionality of the HTML 5 
	canvas tag.  To use it, simply call the jck() function with the canvas element as 
	the parameter.  Since JCK uses jQuery, you may want to initialize it with something 
	like this:
	
	$(document).ready(function(){
		$("canvas").each(function(){
			jck(this);
		});
	});
	
	This fun little snippet will extend the functionality of all of the canvases on the 
	page as soon as the page has loaded.
	
	Further documentation is forthcoming.
*/

function jck(canvas, options){
	
	canvas.defaults = {
		'context'			: '2d',
		'drawColor'			: '#555',
		'circleRadius'		: '30'
	};
	
	if (!options)
		options = {};
	
	// If the canvas does does not have an ID, generate a random one
	if (canvas.id == "")
		canvas.id = parseInt(random(0, 100000000));
		
	canvas.isKitted = true;
	
	canvas.context = canvas.getContext(canvas.defaults.context);
	
	// Give the canvas a JSON object representing things to draw in the drawlist
	canvas.drawlist = {};
	
	// Define some hooks for the development profiler
	canvas.profilerID = canvas.id + "Profiler";
	canvas.additionalProfilerOutputs = new Array();
	
	// Used to give a real-time output of how many frames are actually being rendered
	canvas.frameSampleTimes = new Array();
	
	
	// Implement many settable JCK options
	/* 	TODO:  Currently under construction.  This is one of the primary functions of the JCK, and it's
		good enough for now, but needs to be filled out more and completed. 
		
		Also TODO:  Move the functionality of setting the defaults to this function, it's unneccessary 
		to have them set elsewhere.  
		
		Further TODO:  Have the rest of the framework change the options through this function whenever possible. */
	canvas.updateOptions = function(options){
		if (!options)
			options = {};
			
		for (option in options){
			switch (option){
				case 'autoClear':
					this.options.autoClear = options.autoClear;
					
				break;
				
				case 'autoClear':
					this.options.autoClear = options.autoClear;					
				break;
				
				case 'autoUpdate':
					this.options.autoUpdate = options.autoUpdate;
					
					if (!this.options.autoUpdate && this.showProfiler){
						this.updateProfiler();	
					}
					
					$('#' + this.profilerID + ' li.pause').html(getPauseText(this));	
				break;
				
				case 'autoUpdateProfiler':
					this.options.autoUpdateProfiler = options.autoUpdateProfiler;
				break;
				
				case 'framerate':
					this.options.framerate = getValidFramerate(options.framerate);
					clearInterval(this.updateHandle);
					this.updateHandle = setInterval(this.update, parseInt(1000 / this.options.framerate));
					
				break;
				
				case 'fullscreen':
					this.options.fullscreen = options.fullscreen;
					/* 	TODO: This does not currently place the canvas in the upper left corner of the screen.  It needs to do that.
						This will take some voodoo because the canvas must be outside of every other element.*/
					if (this.options.fullscreen){
						$(window).bind('resize.' + this.id, function(){
							canvas.setHeight($(window).height());
							canvas.setWidth($(window).width());
						}).resize();
					}
					else{
						$(window).unbind('resize.' + this.id);
					}
				
				break;
				
				case 'sampleFrames':
					this.options.sampleFrames = options.sampleFrames;
				break;
				
				case 'showProfiler':
					options.showProfiler ? this.showProfiler() : this.hideProfiler();
				break;
				
				default:
					throw('invalidOrUnchangeableJCKOption')
			}	
		}
	};
	
	// Set default options
	
	// The attempted frames processed per second		
	options.framerate = options.framerate == null ? 20 : getValidFramerate(options.framerate);
		
	// If true, the canvas will be updated at the rate defined by the framerate option
	if (options.autoUpdate == null)
		options.autoUpdate = true;
		
	/* 	If true, the canvas will be cleared out and before redraw.  You'll usually want this on,
		But performance is affected. */
	if (options.autoClear == null)
		options.autoClear = true;
	
	// If true, the canvas will take up the entire browser window
	if (options.fullscreen == null)
		options.fullscreen = false;
	
	// Controls whether the profiler for this canvas is displayed
	if (options.showProfiler == null)
		options.showProfiler = false;
		
	/*	NOTE:  It is wasteful to have this set to true if updateProfiler() is being called explicitly in your runloop.
		That approach is not as straightforward but does allow you to keep your custom profiler values up-to-date.
		Long story short, either set this to true or update the profiler yourself. Not both.  */
	if (options.autoUpdateProfiler == null)
		options.autoUpdateProfiler = false;
		
	// Used to calculate actual frames being processed.  Off by default because it hurts performance
	if (options.sampleFrames == null)
		options.sampleFrames = false;
		
	// Give the options to the canvas
	canvas.options = options;
		
	// Values defined in this object will be used to give real-time data for canvas performance
	canvas.liveData = {
		actualFPS : "Sampling..."
	};
	
	/* - Setters for width and height.  Must be defined up here because they are used immediately below. - */
	canvas.setHeight = function(newHeight){
		$(this).height(newHeight);
		this.height = (newHeight);
	};
	
	canvas.setWidth = function(newWidth){
		$(this).width(newWidth);
		this.width = (newWidth);
	};
	
	canvas.setSize = function(width, height){
		this.setWidth(width);
		this.setHeight(height);		
	};
	
	/* - Getters - */
	canvas.getHeight = function(){
		return this.height;
	};
	
	canvas.getWidth = function(){
		return this.width;
	};
	
	canvas.getSize = function(){
		return {'width' : this.getWidth(), 'height' : this.getHeight()};	
	};
	/* - END Getters - */
	
	/* - Additional canvas functions - */
	canvas.runloop = function(){
		// I'm your run loop!  I don't do anything yet!  Override me!
	};
	
	// Toggle the pause status of the canvas's update loop
	canvas.togglePause = function(){
		this.options.autoUpdate = !this.options.autoUpdate;
		this.updateOptions({'autoUpdate' : this.options.autoUpdate});
	};
		
	/*	Redraw routine for the canvas.  Also acts as a wrapper for canvas.runloop.
		Define your redraw logic with canvas.runloop, overriding this function
		is a bad idea.	
		
		options: 
			-manualFrameUpdate: If the user wants to update the canvas once without having it
				automatically repeat.  Calling canvas.update({manualFrameUpdate : true}) is better than
				calling canvas.runloop() because the update is then wrapped in all of the JCK's
				built-in frame update functionality.
			
		*/
	canvas.update = function(options){
		// If no options are given, set it to an empty object to prevent endless erroring.
		if (!options)
			options = {};
		
		// If autoUpdate is turned off, just exit out of the function
		if (!canvas.options.autoUpdate && !options.manualFrameUpdate)
			return;
		
		/*	If autoClear is enabled, clear out the canvas before redrawing it.
			This is desirable in most applications, but keep in mind that there is an
			impact on performance.  It is enabled by default. */
		if (canvas.options.autoClear)
			canvas.context.clearRect(0, 0, canvas.getWidth(), canvas.getHeight());
		
		/* 	Make sure that the runloop hasn't been overridden with something other than
			a function, and then run it */
		if (typeof canvas.runloop === "function"){
			canvas.runloop();
		}
		
		// Determine the actual number of frames being processed real-time
		if (canvas.options.sampleFrames){
			canvas.frameSampleTimes.push(now().getTime());

			if (canvas.frameSampleTimes.length > canvas.options.framerate){
				canvas.frameSampleTimes.shift();

				// Do some crazy math on the frameSampleTimes values to determine the actual frames being rendered
				canvas.liveData.actualFPS = parseFloat(
					((canvas.options.framerate - 1) * 1000)  / (canvas.frameSampleTimes[canvas.frameSampleTimes.length - 1] - canvas.frameSampleTimes[0])
					).toFixed(3);
			};
		}
		
		if (canvas.options.autoUpdateProfiler)
			canvas.updateProfiler();
	};
	
	// Now that the update function has been defined, repeat it at the rate defined by canvas.options.framerate
	canvas.updateOptions({framerate : canvas.options.framerate})
	
	/*	Draw a simple cicrle.  Won't necessarily give you the greatest performance, but works as
		a good general-purpose drawing utility. */
	canvas.circle = function(x, y, radius, color){
		this.context.beginPath();
		this.context.arc(!!x ? x : 0, !!y ? y : 0, (!!radius ? radius : this.defaults.circleRadius), 0, Math.PI*2, true);
		this.context.fillStyle = !!color ? color : this.defaults.drawColor;
		this.context.fill();
		this.context.closePath();
	};
	
	/*	Draw a polygon.  pointsX and pointsY are corresponding arrays of points.  
		color, offsetX and offsetY are optional values.
		
		You can define a polygon's dimensions with pointsX and pointsY, and independantly move
		the shape around with offsetX and offsetY. */
	canvas.polygon = function(pointsX, pointsY, offsetX, offsetY, color){
		function getOffsetX(x){
			return x + offsetX;
		}
		
		function getOffsetY(y){
			return y + offsetY;
		}
		
		this.context.beginPath();
		
		// Get the smaller of the two points arrays so they match up correctly
		points = pointsX.length > pointsY.length ? pointsY.length : pointsX.length;
		
		// Start off the pen at the first point
		this.context.moveTo(getOffsetX(pointsX[0]), getOffsetY(pointsY[0]));
		
		for (i = 1; i < points; i++)
			this.context.lineTo(getOffsetX(pointsX[i]), getOffsetY(pointsY[i]));
			
		// Close the polygon by drawing a line back to the first point
		this.context.lineTo(getOffsetX(pointsX[0]), getOffsetY(pointsY[0]));
		
		this.context.strokeStyle = this.context.fillStyle = !!color ? color : this.defaults.drawColor;
		this.context.fill();
		this.context.stroke();
		this.context.closePath();
	};
	
	/* - END Additional canvas functions - */
	
	/* - Profiler functions - 
	
		The profiler is used to give real-time output for various things as a draggable overlay.  By default, it outputs
		all of the options and liveData for the canvas, but can be extended with custom values. Since updating it every frame
		affects performance, you need to explicitly call updateProfiler() in your canvas.runloop override to keep it real-time.  
		
		Alternatively, you can set options.autoUpdateProfiler to true and have it update the jck values only.  This approach
		does not allow for custom live-updated values, however.  */
	canvas.createProfiler = function(){
		info = '<li class="pause">' + getPauseText(this) + '</li>';
			
		for(var option in this.options)
			info += makeProfilerLI(this, option, this.options[option]);
			
		for(var data in this.liveData)
			info += makeProfilerLI(this, data, this.liveData[data]);
		
		$("body").append(makeProfilerUL(this, info));
		
		$("#" + this.profilerID).each(function(){
			$(this).addClass("profilerOutput")
			.draggable()
			.find('li.pause').click(function(){
				canvas.togglePause();
			});
		});
		
		if (!this.options.showProfiler)
			this.hideProfiler();
		else
			this.showProfiler();
	}
	
	// Completely remove the profiler from the document
	canvas.killProfiler = function(){
		$("#" + this.profilerID).remove();
	}
	
	canvas.showProfiler = function(){
		this.options.showProfiler = true;
		$("#" + this.profilerID).css({"display" : "block"});
	}
	
	canvas.hideProfiler = function(){
		this.options.showProfiler = false;
		$("#" + this.profilerID).css({"display" : "none"});
	}
	
	// Shows/hides the profiler, but keeps it in the document
	canvas.toggleProfiler = function(){
		canvas.options.showProfiler = !canvas.options.showProfiler;
		$("#" + canvas.profilerID).toggle("fast");
	};

	/*	Define any custom user-variables to be included in the profiler.  The values must be added before 
		they can be displayed in the output.  Values must be given as an array with the following JSON format:
	
		[
			{	
				label : "label for value one",
				value : "initial value for value one"
			},
			{	
				label : "label for value two",
				value : "initial value for value two"
			}
		]
		
		etc, etc.  That would be a valid argument for this function.
		
		NOTE:  Calling this function wipes out all values added previously, so you must add them again if you wish
		to hang onto them.  All needed values must be added in the parameter array at once.
	
	*/
	canvas.addProfilerValue = function(profilerValues){ // Expecting an array
		// Blank out the profiler and start fresh with it before we add the new values
		this.killProfiler();
		this.createProfiler();
	
		for (i = 0; i < profilerValues.length; i++)
			this.additionalProfilerOutputs.push(profilerValues[i]);
			
		for (i = 0; i < this.additionalProfilerOutputs.length; i++)
			$(makeProfilerLI(this, this.additionalProfilerOutputs[i].label, this.additionalProfilerOutputs[i].value)).appendTo("#" + this.profilerID);
	};
	
	/*	If you are calling this explicitly and are passing custom values, you must pass them as the parameters here as well.
		Use the same format used when adding them initially, as detailed above.  */
		canvas.updateProfiler = function(additionalValues){ // Expecting an array
		for (option in this.options)
			$("#" + this.profilerID + " #" + getProfilerLIID(this, option, this.options[option]) + " .value").html(this.options[option].toString());
		
		for (data in this.liveData)
			$("#" + this.profilerID + " #" + getProfilerLIID(this, data, this.liveData[data]) + " .value").html(this.liveData[data]);
		
		if (additionalValues != null){
			for (i = 0; i < additionalValues.length; i++)
				$("#" + this.profilerID + " #" + getProfilerLIID(this, additionalValues[i].label) + " .value").html(additionalValues[i].value);
		}
		
	}
	/* - END Profiler functions - */
	
	canvas.updateOptions(canvas.options);
	
	return canvas;
}

/* Used for the profiler functions, but can be used statically */
function makeProfilerUL(canvas, text){
	return "<ul id=\"" + canvas.profilerID + "\">" + text + "</ul>";
}

function makeProfilerLI(canvas, label, value){
	return "<li id=\"" + getProfilerLIID(canvas, label) + "\"><span class=\"label\">" + label + ":</span>" + "<span class=\"value\">" + value + "</span></li>";
}

function getProfilerLIID(canvas, label){
	return canvas.profilerID + label;
}

// Get the current time
function now(){
	return new Date();	
}

// Useful for getting random values.  Parameters are optional
function random(max, min){
	if (max == null && min == null)
		return Math.random();
	
	if (min == null)
		return (Math.random() * max);
		
	difference = max - min;
	return min + Math.random() * difference;
};

// Some JCK utilities
function getPauseText(canvas){
	return canvas.options.autoUpdate ? 'Pause' : 'Unpause';
}

function getValidFramerate(framerate){
	return (Math.abs(framerate))
}

function create(element){
	return document.createElement(element);
}