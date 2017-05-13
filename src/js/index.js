
var app = new _app;

function _app(){
	this._engine = null;
	this._mainvis = null;
	this._petalvis1 = null;
	this._petalvis2 = null;
	
	this._plot1 = null;
	this._plot2 = null;
	
	this._picSetter = null;
	
	this.currentBar = 1;

	var events = () => {
		$( window ).resize(() => {
			resizeMain();
			
			this._mainvis.resize();
			this._petalvis1.resize();
			this._petalvis2.resize();
			this._plot1.resize();
			this._plot2.resize();
		});
	}
	
	this.onload = function(data){
		resizeMain();
		
		this._mainvis = new radialvis(this, data);
		this._petalvis1 = new petalvis(this, data, 1);
		this._petalvis2 = new petalvis(this, data, 2);
		
		this._plot1 = new scatterPlot(this, data, 'petal');
		this._plot2 = new scatterPlot(this, data, 'sepal');
		
		this._picSetter = new setPics(this);
		
		events();
		
		this._mainvis.infoUpdater.update(this.currentBar);
		
		this._engine = new engine(this);
	};
};

function radialvis(app, input){
	var margin = {};
	
	var parent = d3.select("#main_left-radial");

	var svg = parent.append('svg')
		.style('position', 'absolute')
		.on('mousemove', mousemove);

	
	var width, height;
	var outerwidth, outerheight
	var centerx, centery;
	
	var radial, bars, button, clickOverlay, infoUpdater;
	
	var data = input.data;
	var headers = input.headers;
	
	var radialOffset = Math.PI/2;
	var radius;

	var body = svg.append("g");
	
	var defs = svg.append('defs');

	

	

	
	function setDimensions(){
		outerwidth = parseInt(svg.style('width'));
		outerheight = parseInt(svg.style('height'));
		
		var iMargin = Math.min(outerwidth, outerheight) * 0.1;
		margin = {top: iMargin, right: iMargin, bottom: iMargin, left: iMargin};
		
		width = outerwidth - margin.left - margin.right;
		height = outerheight - margin.top - margin.bottom;

		var length = Math.min(width, height);

		var heightoffset = height - length;
		var widthoffset = width - length;
		
		width = height = length;

		svg
			.style('height', '100%')
			.style('width', '100%');
			
		body.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			
		centerx = (widthoffset + width)/2;
		centery = (heightoffset + height)/2;

		radius = length/2;
	}
	
	function renderRadial(){
		var circle = body.append('circle')
			.style('fill', 'white')
			.style('stroke', 'black')
			.style('stroke-width', 1);

		function resize(){

			circle
				.attr('cx', centerx)
				.attr('cy', centery)
				.attr('r', radius)
		}
		
		this.resize = resize;
	}
	
	function renderBars(){
		var barLength = ( Math.PI*2 / data.length ) * 0.8;
		var barDepth;
		var barDistance = 2*Math.PI / (data.length);
		this.barDistance = barDistance;
		this.barStretch;
		
		var barObjs = [];
		
		var group = body.append('g')
			.attr('id', 'bars_group');

		var barSvgs = group
			.selectAll('.bars')
			.data(data)
			.enter()
			.append('path')
			.attr('class', 'bar')
			.attr('data-barid', function(d){ return d[0] })
			.style('fill', function(d, i, svgs){
				
				var type = d[5];

				var color = 'black';
				
				if( type == 'Iris-setosa' ){
					color = green;
				}
				else if( type == 'Iris-versicolor' ){
					color = purple;
				}
				else if( type == 'Iris-virginica' ){
					color = red;
				}
				
				return color;
			});
			
		barSvgs._groups[0].forEach(function(d){
			
			var id = parseInt($(d).attr('data-barid'));

			var obj = {
				id: id,
				svg: $(d),
				height: 0,
				update: function(){
					
					var startAngle = radialOffset + this.id * barDistance + barLength/2;
					var endAngle = radialOffset + this.id * barDistance - barLength/2;
					
					this.svg.attr('d', pathCircleSegment(startAngle, endAngle, 0, this.height, false));
				}
			};

			barObjs[id] = obj;
		})

		this.tick = function(time){
			var diff = time * 0.5;
			for(var i = 1; i < barObjs.length; i++){
				if(i == app.currentBar){
					if(barObjs[i].height < this.barStretch){
						barObjs[i].height = Math.min(this.barStretch, barObjs[i].height + diff);						
						barObjs[i].update();
					}
				}
				else{
					if(barObjs[i].height > barDepth){
						barObjs[i].height = Math.max(barDepth, barObjs[i].height - diff);
						barObjs[i].update();
					}
				}
			}
			
		}
		
		this.resize = function(){
			barDepth = radius * 0.03;
			this.barStretch = barDepth * 5;
			
			barSvgs
				.attr('d', (d, i) => {
					var bar = Number(d[0]);

					if(bar != app.currentBar){
						barObjs[bar].height = barDepth;
					}
					else{
						barObjs[bar].height = this.barStretch;
					}
					
					var startAngle = radialOffset + bar * barDistance + barLength/2;
					var endAngle = radialOffset + bar * barDistance - barLength/2;
					
					return pathCircleSegment(startAngle, endAngle, 0, barObjs[bar].height, false);
				});
		}
	}
	
	function renderButton(){
		var buttonx, buttony, buttonAngle;
		var buttondepth, buttonwidth;
		var angle;
		
		var fill = 'rgba(255, 255, 255, 0.5)'
		
		var button = body.append('path')
			.style('fill', fill)
			.style('stroke', 'black')
			.style('stroke-width', 1);


		this.setButtonPos = function(angle){
			
			var barWidth = bars.barDistance;

			if(typeof angle !== 'undefined'){

				angle += barWidth / 2.5;				
				angle += radialOffset;
				
				var remainder = angle % barWidth;

				if(remainder > barWidth / 2){
					angle -= remainder;
					angle += barWidth;
				}
				else{
					angle -= remainder;
				}

			}
			else{
				angle = radialOffset;
			}
			
			var angleCopy = (angle - radialOffset) < 0 ? (angle - radialOffset) + Math.PI*2 : (angle - radialOffset);
			angleCopy = Math.floor(angleCopy / (Math.PI * 2) * data.length);
			angleCopy = angleCopy == 0 ? 150 : angleCopy;

			buttonAngle = angle - bars.barDistance/2;
			
			buttonx = centerx + Math.cos(buttonAngle) * radius;
			buttony = centery + Math.sin(buttonAngle) * radius;
				
			button
				.attr('d', function(){
					var start = buttonAngle + bars.barDistance;
					var end = buttonAngle - bars.barDistance;
					var depth = bars.barStretch;
					var padding = radius * 0.05;

					return pathCircleSegment(start, end, padding, depth + padding, true);
				});
				
			return angleCopy;
		}
		
		this.resize = function(){

			buttonwidth = radius * 0.1;
			buttondepth = bars.barDistance * 2 * Math.PI * radius;
			
			var angle = ( ( app.currentBar ) / ( data.length ) ) * Math.PI * 2;

			this.setButtonPos(angle);
		}
	}

	function mousemove(){
		var mouse = d3.mouse(this);
		var bar;
	
		mousex = mouse[0];
		mousey = mouse[1];
		
		var x = outerwidth/2 - mousex;
		var y = outerheight/2 - mousey;

		var angle = Math.atan2(x, -y);
		
		var bar = button.setButtonPos(angle);
		
		if(bar != app.currentBar){
			infoUpdater.update(bar);
		}
	}
	
	function infoUpdater(){
		var i_id = $('#info-id');
		var i_type = $('#info-type');
		var i_pl = $('#info-p_length');
		var i_pw = $('#info-p_width');
		var i_sl = $('#info-s_length');
		var i_sw = $('#info-s_width');
		
		this.update = function(id){

			var obj = data[id-1];
			
			i_id.text(obj[0]);
			i_type.text(obj[5]);
			i_pl.text(obj[3]);
			i_pw.text(obj[4]);
			i_sl.text(obj[1]);
			i_sw.text(obj[2]);
	
			app.currentBar = id;

			app._petalvis1.petals.resize();
			app._petalvis2.petals.resize();
			app._plot1.selectDot(id);
			app._plot2.selectDot(id);
			app._picSetter.set(obj[5]);
		}
	}

	function pathCircleSegment(start, end, barBase, barDepth, connect){
		var startx = Math.cos(start) * (radius - barBase) + centerx;
		var starty = Math.sin(start) * (radius - barBase) + centery;
		
		var startx2 = Math.cos(start) * (radius + barDepth) + centerx;
		var starty2 = Math.sin(start) * (radius + barDepth) + centery;
		
		var endx = Math.cos(end) * (radius - barBase) + centerx;
		var endy = Math.sin(end) * (radius - barBase) + centery;
		
		var endx2 = Math.cos(end) * (radius + barDepth) + centerx;
		var endy2 = Math.sin(end) * (radius + barDepth) + centery;
		
		var path = '';
		
		path += 'M ' + startx + ' ' + starty;
		path += 'L ' + startx2 + ' ' + starty2;
		path += 'A ' + centerx + ' ' + centery + ' 0 0 0 ' + endx2 + ' ' + endy2;
		path += 'L ' + endx + ' ' + endy;
		
		if(connect) path += ' z';
		
		return path;
	}
	
	function resize(){
		setDimensions();
		
		bars.resize();
		radial.resize();
		button.resize();
	}
	
	(function init(){
		setDimensions();
		
		bars = new renderBars;
		radial = new renderRadial;
		button = new renderButton;
		infoUpdater = new infoUpdater;
		
		resize();

	})();
	
	
	this.bars = bars;
	this.resize = resize;
	this.infoUpdater = infoUpdater;
}

function base(app, input, type){
	var a = 5;
	
	console.log(app);
}

function petalvis(app, input, type){
	
//	this = new base(app, input, type);
	
	var margin = {};
	var parent = d3.select('#main_left-diagram');
	
	var svg = parent.append('svg')
	
	var body = svg.append("g")
	
	var petals;
	
	var data = input.data;
	var headers = input.headers;

	var maxUnit;
	
	function setDimensions(){
		outerwidth = parseInt(parent.style('width'));
		outerheight = 150;//parseInt(parent.style('height'));
		
		var iMargin = 5;
		margin = {top: iMargin, right: iMargin, bottom: iMargin, left: iMargin};
		
		width = outerwidth - margin.left - margin.right;
		height = outerheight - margin.top - margin.bottom;
		
		svg
			.attr('width', outerwidth)
			.attr('height', outerheight)
		
		body.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	}
	
	function findMax(){
		var max_pl, max_pw, max_sl, max_sw;
		max_pl = max_pw = max_sl = max_sw = 0;
		
		data.forEach(function(d){
			max_sl = d[1] > max_sl ? d[1] : max_sl;
			max_sw = d[2] > max_sw ? d[2] : max_sw;
			max_pl = d[3] > max_pl ? d[3] : max_pl;
			max_pw = d[4] > max_pw ? d[4] : max_pw;
		})
		
		maxUnit = Math.max(max_pl, max_pw, max_sl, max_sw);
	}

	function renderPetalTop(){

		var backrect = body.append('rect')
			.style('fill', lightGrey);
	
		var back = body.append('path')
			.style('fill', grassGreen);
	
		var petal = body.append('path')
			.style('fill', lightPurple);
			
		var sepal = body.append('path')
			.style('fill', darkPurple);

		this.resize = function(){
			if(!(app.currentBar > 0 && app.currentBar <= data.length))
				return -1;
			
			var centery = height/2;
			var centerx = width/2;

			function rot(coord, angle){
				var cos = Math.cos(angle * Math.PI / 180);
				var sin = Math.sin(angle * Math.PI / 180);
				
				for(var a in coord){
					coord[a].x -= centerx;
					coord[a].y -= centery;
					
					var x = coord[a].x;
					var y = coord[a].y;
					
					coord[a].x = x * cos + y * sin;
					coord[a].y = -x * sin + y * cos;
					
					coord[a].x += centerx;
					coord[a].y += centery;
				}
			}
		
			function coords(side){

				var flower = data[app.currentBar - 1];
				
				var mindim = Math.min(height, width);

				var petal = (side == 'ptop' || side == 'pbot');
				
				var _width = petal ? flower[4] : flower[2];
				var _length = petal ? flower[3] : flower[1];
				
				var petalWidth = mindim/2 * _width/maxUnit;
				var petalLength = mindim/2 * _length/maxUnit;
				var petalMiddle = petalWidth/2;
			
				var offsety1 = petalWidth * 0.15;
				var offsety2 = offsety1 / 2;
				
				petalWidth -= offsety1;
				
				var offsetx = Math.sin(30 * Math.PI / 180) * petalWidth;
			
				var midpoint1x;
			
				if(petal){
					offsetx *= 0.2;
					midpoint1x = petalLength/3;
				}
				else
					midpoint1x = petalLength/2;
			
				var coord = {
					0: {
						x: centerx + offsetx,
						y: centery
					},
					1: {
						x: centerx + offsetx + midpoint1x,
						y: centery
					},
					2: {
						x: centerx + offsetx + petalLength,
						y: centery
					},
					3: {
						x: centerx + offsetx + petalLength,
						y: centery
					}
				}

				if(side == 'ptop' || side == 'stop'){
					if(!petal)
						coord['1'].y -= petalWidth/2;
					coord['2'].y -= petalWidth;
				}
				else if(side == 'pbot' || side == 'sbot'){
					if(!petal)
						coord['1'].y += petalWidth/2;
					coord['2'].y += petalWidth;
				}

				return coord;
			}
			
			function makePath(top, bot){
				var path = '';
				
				path += 'M ' + top['0'].x + ' ' + top['0'].y;	
			
				path += 'C ' + top['1'].x + ' ' + top['1'].y + ' ' +
					top['2'].x + ' ' + top['2'].y + ' ' +
					top['3'].x + ' ' + top['3'].y;
				
				path += 'C ' + bot['2'].x + ' ' + bot['2'].y + ' ' +
					bot['1'].x + ' ' + bot['1'].y + ' ' +
					bot['0'].x + ' ' + bot['0'].y;
					
				return path;
			}
			
			function backPath(){
				var path = '';
				
				path += 'M ' + width*0.4 + ' ' + 0;
				
				path += 'L ' + 0 + ' ' + height * 0.6;
				
				path += 'L ' + width*0.5 + ' ' + height;
				
				path += 'L ' + width + ' ' + height * 0.5;
				
				return path;
			}
			
			var ptop = coords('ptop');
			var pbot = coords('pbot');
			
			var stop = coords('stop');
			var sbot = coords('sbot');

			var petalPath = '';
			var sepalPath = '';

			rot(stop, -60);
			rot(sbot, -60);
			
			for(var i = 0; i < 3; i++){

				petalPath += makePath(ptop, pbot);

				rot(ptop, -120);
				rot(pbot, -120);
				
				sepalPath += makePath(stop, sbot);
				
				rot(stop, -120);
				rot(sbot, -120);
			}
			
			petal
				.attr('d', petalPath);
				
			sepal
				.attr('d', sepalPath);
				
			back
				.attr('d', backPath());
			
			var marx = width * 0.2;
			var mary = height * 0.2;
			
			backrect
				.attr('x', marx/2)
				.attr('y', mary/4)
				.attr('width', width - marx)
				.attr('height', height - mary);
		}
	}
	
	function renderPetalSide(){

		var backrect = body.append('rect')
			.style('fill', lightGrey);
	
		var back = body.append('path')
			.style('fill', skyBlue);
	
		var petal = body.append('path')
			.style('fill', lightPurple)
			.style('stroke-linecap', 'round');
			
		var sepal = body.append('path')
			.style('fill', darkPurple)
			.style('stroke-linecap', 'round');
			
		var stem = body.append('path')
			.style('fill', darkGreen)
			.style('stroke-linecap', 'round');

		this.resize = function(){

			if(!(app.currentBar > 0 && app.currentBar <= data.length))
				return -1;
		
			var centery = height/2;
			var centerx = width/2;
			
			function mirror(coord){

				for(var a in coord){
					coord[a].x -= centerx;

					coord[a].x *= -1;
					
					coord[a].x += centerx;
				}
			}
		
			function coords(side){

				var flower = data[app.currentBar - 1];
				
				var mindim = Math.min(height, width);

				var petal = (side == 'petal');
				
				var _width = petal ? flower[4] : flower[2];
				var _length = petal ? flower[3] : flower[1];
				
				var petalWidth = mindim/2 * _width/maxUnit;
				var petalLength = mindim/2 * _length/maxUnit;

				var offset = 0;//mindim * 0.01;
				
				var coord;

				if(petal){
					coord = {
						0: {
							x: centerx,
							y: centery
						},
						1: {
							x: centerx + petalLength/6,
							y: centery - petalLength/6
						},
						2: {
							x: centerx + petalLength/3,
							y: centery
						},
						3: {
							x: centerx + petalLength/3,
							y: centery - petalLength
						},
						4: {
							x: centerx,
							y: centery
						},
						5: {
							x: centerx + petalLength/6,
							y: centery - petalLength/6
						},
						6: {
							x: centerx + petalLength/3,
							y: centery
						},
						7: {
							x: centerx + petalLength/6,
							y: centery - petalLength + petalLength/6
						},
						8: {
							x: centerx + petalLength/6 + 3*petalLength/24,
							y: centery - petalLength + petalLength/6 - petalLength/24
						}
					}
				}
				else{
					coord = {
						0: {
							x: centerx,
							y: centery
						},
						1: {
							x: centerx + petalLength,
							y: centery - petalLength/4
						},
						2: {
							x: centerx + petalLength/4,
							y: centery + petalLength/4
						},
						3: {
							x: centerx + 3*petalLength/4,
							y: centery + petalLength/2
						},
						4: {
							x: centerx,
							y: centery
						},
						5: {
							x: centerx + petalLength,
							y: centery - petalLength/4
						},
						6: {
							x: centerx + 3*petalLength/4,
							y: centery + petalLength/4
						},
						7: {
							x: centerx + 3*petalLength/4,
							y: centery + petalLength/2
						}
					}
				}
				
				for(var i in coord){
					coord[i].x += offset;
					if(petal)
						coord[i].y -= offset;
					else
						coord[i].y += offset;
				}

				return coord;
			}
			
			function makePath(top, petal){
				var path = '';
				
				path += 'M ' + top['0'].x + ' ' + top['0'].y;	
			
				path += 'C ' + top['1'].x + ' ' + top['1'].y + ' ' +
					top['2'].x + ' ' + top['2'].y + ' ' +
					top['3'].x + ' ' + top['3'].y;
				
				if(petal)
					path += 'Q ' + top[8].x + ' ' + top[8].y + ' ' +
					top[7].x + ' ' + top[7].y;
				
				path += 'C ' + top['6'].x + ' ' + top['6'].y + ' ' +
					top['5'].x + ' ' + top['5'].y + ' ' +
					top['4'].x + ' ' + top['4'].y;
				
				return path;
			}
			
			function stemPath(){
				var path = ''
				
				var mindim = Math.min(height, width);
				
				var baseWidth = mindim * 0.05;
				var stubWidth = baseWidth * 1.3;
				
				path += 'M ' + (centerx - 2*baseWidth/3) + ' ' + height;
				
				path += 'Q ' + (centerx ) + ' ' + (height * 0.75) + ' ' + centerx + ' ' + centery;
				
				path += 'Q ' + (centerx ) + ' ' + (height * 0.75) + ' ' + (centerx + baseWidth/3) + ' ' + height;
				
				path += 'z'
				
				path += 'M ' + (centerx - stubWidth) + ' ' + (centery + stubWidth/2 - stubWidth);
				
				path += 'C ' + (centerx - stubWidth/2) + ' ' + (centery + stubWidth/2 - stubWidth/2) + ' ' +
					(centerx + stubWidth/2) + ' ' + (centery + stubWidth/2 - stubWidth/2) + ' ' +
					(centerx + stubWidth) + ' ' + (centery + stubWidth/2 - stubWidth);
				
				path += 'C ' + (centerx - stubWidth/2) + ' ' + (centery + stubWidth/2) + ' ' +
					(centerx + stubWidth/2) + ' ' + (centery + stubWidth/2) + ' ' +
					(centerx - stubWidth) + ' ' + (centery + stubWidth/2 - stubWidth);
				
				return path;
			}
			
			function backPath(){
				var path = '';
				
				path += 'M ' + width*0.3 + ' ' + 0;
				
				path += 'L ' + 0 + ' ' + height * 0.6;
				
				path += 'L ' + width*0.6 + ' ' + height;
				
				path += 'L ' + width + ' ' + height * 0.3;
				
				return path;
			}
			
			var pcoord = coords('petal');
			
			var scoord = coords('sepal');

			var petalPath = '';
			var sepalPath = '';

			petalPath += makePath(pcoord, true);
			sepalPath += makePath(scoord, false);
			
			mirror(pcoord);
			mirror(scoord);
			
			petalPath += makePath(pcoord, true);
			sepalPath += makePath(scoord, false);


			
			petal
				.attr('d', petalPath);
				
			sepal
				.attr('d', sepalPath);
				
			stem
				.attr('d', stemPath());
				
			back
				.attr('d', backPath());
				
			var marx = width * 0.2;
			var mary = height * 0.2;
			
			backrect
				.attr('x', marx/2)
				.attr('y', mary/2)
				.attr('width', width - marx)
				.attr('height', height - mary);
		}
	}
	
	this.resize = function(){
		setDimensions();
		
		petals.resize();
	};

	(() => {
		findMax();
		
		if(type == 1)
			petals = new renderPetalTop;
		else
			petals = new renderPetalSide;
		
		this.resize();
	})();

	this.petals = petals;
}


function scatterPlot(app, input, type){
	var margin = {};
	
	var parent;
	
	var petal = (type == 'petal');
	
	if(petal)
		parent = d3.select("#graph1");
	else
		parent = d3.select("#graph2");

	var svg = parent.append('svg')
		.style('height', '100%')
		.style('width', '100%');
	
	var body = svg.append("g");
	
	var width, height;
	var outerwidth, outerheight;
	var max_pl, max_pw, max_sl, max_sw;
	var min_pl, min_pw, min_sl, min_sw;
	
	var data = input.data;
	var headers = input.headers;
	
	var x = d3.scaleLinear();
	var y = d3.scaleLinear();
	
	var xAxis = body.append("g")
		.attr("class", "xaxis");
		
	var yAxis = body.append("g")
		.attr("class", "yaxis");
	
	var yLabel = yAxis.append("text")
		.attr("fill", "#000")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text(function(){ return petal ? 'Petal width' : 'Sepal width' })
		
	var xLabel = xAxis.append("text")
		.attr("fill", "#000")
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text(function(){ return petal ? 'Petal length' : 'Sepal length' });
	
	var className = petal ? "petalDot" : "sepalDot";
	
	var plot, prevDot;
	
	var dotSmall = 1.5;
	var dotBig = 4;
	
	function setDimensions(){
		outerwidth = parseInt(svg.style('width'));
		outerheight = parseInt(svg.style('height'));
		
		var iMargin = Math.min(outerwidth, outerheight) * 0.1;
		margin = {top: iMargin, right: iMargin, bottom: iMargin, left: iMargin};
		
		width = outerwidth - margin.left - margin.right;
		height = outerheight - margin.top - margin.bottom;
		
		body.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		x
			.range([0, width])
			.domain([(petal ? min_pl : min_sl) * 0.9, (petal ? max_pl : max_sl) * 1.1]);
		
		y
			.range([height, 0])
			.domain([(petal ? min_pw : min_sw) * 0.9, (petal ? max_pw : max_sw) * 1.1]);
		
		xAxis
			.call(d3.axisBottom(x).ticks(0))
			.attr("transform", "translate(0," + height + ")");
		
		yAxis
			.call(d3.axisLeft(y).ticks(0));
		
		xLabel
			.attr("y", 6)
			.attr("x", width);

		var w = petal ? 4 : 2;
		var l = petal ? 3 : 1;

		plot.attr('cx', d => x(d[l]))
			.attr('cy', d => y(d[w]));
	}

	
	function findMax(){
		max_pl = max_pw = max_sl = max_sw = 0;
		min_pl = min_pw = min_sl = min_sw = Infinity;
		
		data.forEach(function(d){
			max_sl = d[1] > max_sl ? d[1] : max_sl;
			max_sw = d[2] > max_sw ? d[2] : max_sw;
			max_pl = d[3] > max_pl ? d[3] : max_pl;
			max_pw = d[4] > max_pw ? d[4] : max_pw;
			
			min_sl = d[1] < min_sl ? d[1] : min_sl;
			min_sw = d[2] < min_sw ? d[2] : min_sw;
			min_pl = d[3] < min_pl ? d[3] : min_pl;
			min_pw = d[4] < min_pw ? d[4] : min_pw;
		})
	}

	function initDots(){
		plot = body.selectAll("." + className)
			.data(data)
		.enter()
			.append("circle")
			.attr("class", className)
			.attr('id', function(d){ return className + '_' + d[0] })
			.attr('r', dotSmall)
			.style('fill', function(d){
				var type = d[5];

				var color = 'black';
				
				if( type == 'Iris-setosa' ){
					color = green;
				}
				else if( type == 'Iris-versicolor' ){
					color = purple;
				}
				else if( type == 'Iris-virginica' ){
					color = red;
				}
				
				return color;
			});
	}
	
	this.selectDot = function(dot){
		body.select('#' + className + '_' + prevDot)
			.attr('r', dotSmall);
			
		prevDot = dot;
		
		body.select('#' + className + '_' + dot)
			.attr('r', dotBig);
	}
	
	this.resize = function(){
		setDimensions();
	};
	
	(() => {
		findMax();
		initDots();

		this.resize();
	})();
}


function engine(app){
	var start = performance.now(), end, time;


	function animate(accTime){
		requestAnimationFrame(animate);
		
		
		
		
		
		end = performance.now();

		time = end - start;
//		console.log(time);
		start = performance.now();

		app._mainvis.bars.tick(time);
	}
	
	(function init(){

		animate();
	})();
}

function setPics(){
	var currentType = '';
	
	var pic1 = $('#pic1');
	var pic2 = $('#pic2');
	
	this.set = function(type){
		if(currentType != type){
			currentType = type;
			pic1.css('backgroundImage', 'url("src/images/' + type + '1.jpg")');
			pic2.css('backgroundImage', 'url("src/images/' + type + '2.jpg")');
		}
	}
}

function resizeMain(){
	var width = parseInt($('body').css('width'));
	var height = parseInt($('body').css('height'));
	
	var mindim = Math.max(Math.min(width, height) * .95, 850);
	
	$('#main_left').css({
		width: mindim,
		height: mindim
	});
	
	$('#main_right').css({
//		height: mindim
	});
}


$(document).ready(function() {
	$.ajax({
		type: "GET",
		url: "Iris.csv",
		dataType: "text",
		success: function(data) {

			app.onload(processData(data));
		}
	});
	
	function processData(allText){
		var allTextLines = allText.split(/\r\n|\n/);
		var headers = allTextLines[0].split(',');
		var lines = [];

		for (var i=1; i<allTextLines.length; i++) {
			var data = allTextLines[i].split(',');
			if (data.length == headers.length) {

				var tarr = [];
				for (var j=0; j<headers.length; j++) {
					tarr.push(data[j]);
				}
				lines.push(tarr);
			}
		}
		
		return {
			headers: headers,
			data: lines
		}
	}
});

