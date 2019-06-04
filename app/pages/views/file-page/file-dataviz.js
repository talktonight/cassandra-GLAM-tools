// **************************************************************
// ********************** CATEGORY NETWORK **********************
// **************************************************************
const MAX_LEVEL = 3;

function networkDataviz() {
		var data_source = getCategoryUrl();

		// console.log(data_source);

		var width = $("#file_category_network").width(),
			height = $("#file_category_network").height();

		var svg = d3.select("#file_category_network")
								.append("svg")
								.attr("viewBox", "0 0 " + width + " " + height);

		var plot = svg.append("g")
									.attr("id", "d3_plot");

		var color = d3.scaleOrdinal(d3.schemeCategory20);

		d3.json(data_source, function(error, data) {
				if (error)
					window.location.replace('/500');

				var levels = [];
				data.nodes.forEach(function(node) {
						levels.push(
								node.group
						);
				})
				var max_level = d3.max(levels);
				var dataLegend = [];
				for (var j = 0; j <= max_level; j++) {
						dataLegend.push(j);
				}

				var legendDiv = d3.select("#file_cat_network_legend");

				var legendRow = legendDiv.selectAll("test")
				    .data(dataLegend)
				    .enter()
				    .append("div")
				    .style("margin-bottom", "2px");

				legendRow.append("div")
				    .html("&nbsp")
				    .attr("class", "rect")
						.style("opacity", function(d, i) { if (data.nodes.length > 100 && i > MAX_LEVEL) return "0.2"; else return "1"; })
				    .style("background-color", (d, i) => color(i));

				legendRow.append("div")
				    .style("opacity", function(d, i) { if (data.nodes.length > 100 && i > MAX_LEVEL) return "0.2"; else return "1"; })
				    .html(d=> "lv. " + d);

				//This code is for reduce graph size when too big
				if (data.nodes.length > 100) {
						var nodi = [];
						var archi = [];
						for (let i = 0; i < data.nodes.length; i++) {
		            if (data.nodes[i].group < MAX_LEVEL) {
									  nodi.push(data.nodes[i])
								}
						}
						data.nodes = nodi;
						for (let j = 0; j < data.edges.length; j++) {
							  let sourceNode = false, targetNode = false;
							  for (let i = 0; i < data.nodes.length; i++) {
									  if (data.edges[j].source === data.nodes[i].id ) sourceNode = true;
										if (data.edges[j].target === data.nodes[i].id ) targetNode = true;
								}
								if (sourceNode && targetNode) {
									  archi.push(data.edges[j]);
							  }
					  }
						data.edges = archi;
				}

				var files = [];
				data.nodes.forEach(function(node) {
						files.push(
								node.files
						);
				})

				var max_file = d3.max(files),
					circle_size = width / max_file / data.nodes.length;

				var simulation = d3.forceSimulation()
					.force("link", d3.forceLink().id(function(d) {
							return d.id;
						})
						.distance(function(d,i){
							return ( (max_file * circle_size))
						})
						.strength(0.5)
					)
					.force("charge", d3.forceManyBody())
					.force("center", d3.forceCenter(width / 2, height / 2))
					.force("collide",d3.forceCollide( (circle_size * max_file) + 5 ))

				var edges = plot.append("g")
					.attr("class", "edges")
					.selectAll("line")
					.data(data.edges)
					.enter()
					.append("line")
					.attr("class","line")
					.attr("stroke","#999")

				var nodes = plot.append("g")
					.attr("class", "nodes")
					.selectAll(".nodes")
					.data(data.nodes)
					.enter()
					.append("g")
					.attr("class",function(d,i){
						return d.id.hashCode() + " node"
					})
					.call(d3.drag()
						.on("start", dragstarted)
						.on("drag", dragged)
						.on("end", dragended)
					)

				var node_circle = nodes.append("circle")
					.attr("r", function(d,i){
						return Math.min(100, 3 + (d.files  * circle_size));
					})
					.attr("fill", function(d) {
						return  color(d.group);
					})
					.attr("class", function (d,i){
						return "circle " + d.files
					})

				simulation
					.nodes(data.nodes)
					.on("tick", ticked);

				simulation.force("link")
					.links(data.edges);

				function ticked() {
					var x = 1
					edges
						.attr("x1", function(d) { return d.source.x * x; })
						.attr("y1", function(d) { return d.source.y * x; })
						.attr("x2", function(d) { return d.target.x * x; })
						.attr("y2", function(d) { return d.target.y * x; });

					nodes
						.attr("transform", function(d,i) {
							let radius = Math.min(100, 3 + (d.files  * circle_size));
							d.x = Math.max(radius, Math.min(width - radius, d.x));
							d.y = Math.max(radius, Math.min(height - radius, d.y));
							return "translate(" + (d.x * x) + "," + (d.y* x) + ")"
						})

					var q = d3.quadtree(nodes),
						i = 0,
						n = nodes.length;
				}

				function dragstarted(d) {
						if (!d3.event.active) simulation.alphaTarget(0.3).restart();
						d.fx = d.x;
						d.fy = d.y;
				}

				function dragged(d) {
						d.fx = d3.event.x;
						d.fy = d3.event.y;
				}

				function dragended(d) {
						if (!d3.event.active) simulation.alphaTarget(0);
						d.fx = null;
						d.fy = null;
				}
		})
}

// ******************************************************************
// ********************** USAGE *************************************
//******************************************************************
var TOP_WIKIS = [];

var usageDataViz = function(wiki_array) {
	d3.json(getUsageStatsUrl(), function(error, stats_data) {
		var data_source = getUsageUrl();
		// console.log(data_source);
		// get data
		d3.json(data_source, function(error, data) {
			// manage error
			if (error) throw error;
			// sort
			data = data.sort(function(a, b) {
				if (a.wiki === 'others') return -1; // put others column as last element
				return a.usage - b.usage;
			});
			// format the data
			data.forEach(function(d) {
				if (d.wiki !== 'others') TOP_WIKIS.push(d.wiki);
				d.usage = +d.usage;
			});
			// draw
			drawHorizBars(data, '#file_usage_horiz_bars', stats_data.totalPages, wiki_array);
		});
	});
}

function drawHorizBars(data, div, totalPages, wiki_array) {
  // Graph dimensions
  var margin = {};
  var kH;
  var availH;

  if ($(window).width() < 576) {
    // smartphones
    availH = $(div).outerHeight();
    margin = { top: 40, right: 10, bottom: 40, left: 30 };
  } else if ($(window).width() < 1450) {
    // tablets and desktop
    availH = $(div).outerHeight() * 0.9;
    margin = { top: 40, right: 30, bottom: 20, left: 70 };
  } else {
		// Full HD screens
		availH = $(div).outerHeight() * 0.85;
		margin = { top: 40, right: 30, bottom: 20, left: 80 };
	}

  var width = Math.round($(div).outerWidth()) - margin.left - margin.right,
      height = availH - margin.top - margin.bottom;

  var svg = d3.select(div).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + 50 + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // SCALES
  var x = d3.scaleLinear().range([0, width]);
  var y = d3.scaleBand().range([height, 0]).padding(0.3);

  x.domain([0, d3.max(data, function(d) { return d.usage; })]);

  y.domain(data.map(function(d) { return d.wiki; }));

  var xAxis = d3.axisBottom().scale(x).tickValues(x.ticks(5).concat(x.domain()));

  var yAxis = d3.axisLeft()
                .scale(y)
                .ticks(10);

  var gX = svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", ".7em")
                .attr("dy", ".7em");

  var gY = svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Value");


    // Y axis label:
  svg.append("text")
     .attr("text-anchor", "end")
     .attr("y", -15)
     .attr("x", -1)
     .text("Projects")

  svg.append("text")
     .attr("text-anchor", "end")
     .attr("x", width)
     .attr("y", height + margin.top + 10)
     .text("Pages");

  // append the rectangles for the bar chart
  var bars = svg.selectAll(".bar")
     .data(data)
     .enter().append("rect")
     .attr("class", "bar")
     .attr("id", d => d.wiki)
     .style("transition", "width 1s ease-in-out, stroke .3s")
     .attr("width", (d) => 0 )
     .attr('fill', '#080d5a')
     .attr('stroke', '#080d5a')
     .attr('stroke-width', '3')
     .attr("x", function(d) { return 3 })
     .attr("y", function(d) { return y(d.wiki); })
     .attr("height", y.bandwidth());


    // add labels
  var labels = svg.selectAll('.text')
                  .data(data)
                  .enter().append("text")
                  .attr("class", "usage-bar-label")
                  .attr("x", d => x(d.usage))
                  .attr("dx", ".6em")
                  .attr("y", d => y(d.wiki) + y.bandwidth() / 2)
                  .attr("dy", ".4em")
                  .text(d => {
                    let p = d.usage / totalPages * 100;
                    return `${d.usage} (${p.toFixed(2)}%)`;
                  });

     // animation
  setTimeout(function() {
    bars.attr("width", d => x(d.usage));
  }, 100);

  // check for labels outside graph
  labels.each(function(d) {
   let bbox =  d3.select(this).node().getBBox();
   let threshold = width - margin.left;
   if (bbox.x + bbox.width > threshold) {
     d3.select(this)
       .attr("x", bbox.x - bbox.width * 1.5)
       .attr("fill", "#fff");
     }
  });

	// HIGHLIGHT WIKIS BARS
	wiki_array.forEach(function(el) {
		d3.select('#' + el).attr('stroke', 'red');
	});
	// check if used in other wikis
	let difference = wiki_array.filter(x => !TOP_WIKIS.includes(x));
	if (difference.length > 0) {
		d3.select('#others').attr('stroke', 'red');
	}

  // window.highlightUsageBars = function(array) {
  //   array.forEach(function(el) {
  //     d3.select('#' + el).attr('stroke', 'red');
  //   });
  //   // check if used in other wikis
  //   let difference = array.filter(x => !TOP_WIKIS.includes(x));
  //   if (difference.length > 0) {
  //     d3.select('#others').attr('stroke', 'red');
  //   }
  // }
	//
  // window.turnOffUsageBars = function(array) {
  //   bars.attr('stroke', '#080d5a');
  // }
}

// ******************************************************************
// ********************** VIEWS *************************************
//******************************************************************
var lineChartDraw = function() {

  var data_source = getViewsUrl();

	var file_query = getFileViewsUrl();

  d3.json(data_source, function(error, data) {
    if (error) throw error;

		d3.json(file_query, function(error, image_data) {
			if (error) throw error;

			lineChart('file_main_views_container', data, image_data);

    });
  });
}



function lineChart(div, data, image_data) {

  var margin = {};
  var margin2 = {};
  var kH;
  var availH;

  if ($(window).width() < 576) {  // smartphones
    availH = $("#" + div).outerHeight();
    margin = { top: 10, right: 40, bottom: 140, left: 20 };
    margin2 = { top: availH - margin.bottom + 30, right: 40, bottom: 50, left: 20 };
  } else { // tablets and desktop
    availH = $("#" + div).outerHeight();
    margin = { top: 10, right: 50, bottom: 140, left: 30 };
    margin2 = { top: availH - margin.bottom + 30, right: 50, bottom: 50, left: 30 };
  }

  var width = Math.round($("#" + div).outerWidth()) - margin.left - margin.right,
      height = availH - margin.top - margin.bottom,
      height2 = availH - margin2.top - margin2.bottom;

  var parseTime = d3.isoParse;

  var image_valueline, image_path;

  // FORMAT DATA
  data.forEach(function(d) {
    d.date = parseTime(d.date);
    d.views = +d.views;
  });

  // Brush function
  var brush = d3.brushX()
                .extent([[0, 0], [width, height2]])
                .on("brush end", brushFunction);

  // Zoom Function
  var zoom = d3.zoom()
               .scaleExtent([1, Infinity])
               .translateExtent([[0, 0], [width, height]])
               .extent([[0, 0], [width, height]])
               .on("zoom", zoomFunction);

  // Main SVG
  var svg = d3.select("#" + div)
              .append("svg")
              .attr("id", "svg-graph")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // SCALE OBJECTS
  var x = d3.scaleTime().range([0, width]);
  var y = d3.scaleLog().range([height, 0]);

  // BRUSH SCALES
  var x2 = d3.scaleTime().range([0, width]);
  var y2 = d3.scaleLinear().range([height2, 0]);

  // SET DOMAINS
  x.domain(d3.extent(data, function(d) { return d.date; }));
  y.domain([d3.min(data, function(d) { return d.views; }), d3.max(data, function(d) { return d.views; })]);

  // BRUSH DOMAINS
  x2.domain(x.domain());
  y2.domain(y.domain());

  // AXIS
  var xAxis = d3.axisBottom(x);
  var xAxis2 = d3.axisBottom(x2);

  // var yAxis = d3.axisLeft(y).ticks(20).tickFormat(d3.formatPrefix(".0", 1)).tickSize(6, 0);

  var yAxis = d3.axisLeft(y).ticks(20).tickFormat(d3.formatPrefix(".0", 1));

  // Clip path (clip line outside axis)
  var clip = svg.append("defs")
                .append("svg:clipPath")
                .attr("id", "clip")
                .append("svg:rect")
                .attr("width", width)
                .attr("height", height)
                .attr("x", 0)
                .attr("y", 0);

  var lineChart = svg.append("g")
                     .attr("class", "focus")
                     .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                     .attr("clip-path", "url(#clip)");

  var focus = svg.append("g")
                 .attr("class", "focus")
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var context = svg.append("g")
                   .attr("class", "context")
                   .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

  var valueline = d3.line()
                    .x(function(d) { return x(d.date); })
                    .y(function(d) { return y(d.views); })
                    .curve(d3.curveLinear);

  var valueline2 = d3.line()
                     .x(function(d) { return x2(d.date); })
                     .y(function(d) { return y2(d.views); })
                     .curve(d3.curveLinear);

  // DRAW AXIS
  var gX = focus.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

  var gY = focus.append("g")
                .attr("class", "axis axis--y")
                .call(yAxis);

  var gX2 = context.append("g")
                   .attr("class", "axis axis--x")
                   .attr("transform", "translate(0," + height2 + ")")
                   .call(xAxis2);

  // Append data to main graph...
  var path = lineChart.append("path")
                .datum(data)
                .attr("class", "line")
                .attr("d", valueline);

  // ...and to secondary graph
  var path2 = context.append("path")
                .datum(data)
                .attr("class", "line")
                .attr("d", valueline2);

  // IMAGE LINE
	image_data.forEach(function(d) {
		d.access_date = parseTime(d.access_date);
		d.sum = +d.sum;
	});

	// update domain
	let min = Math.min(d3.min(image_data, function(d) { return d.sum; }), d3.min(data, function(d) { return d.views; }));
	let max = Math.max(d3.max(image_data, function(d) { return d.sum; }), d3.max(data, function(d) { return d.views; }));

	y.domain([min, max]);

	// update axis
	gY.call(yAxis);

	// update main line chart
	path.transition().attr("d", valueline);

	// append new line
	image_valueline = d3.line()
										.x(function(d) { return x(d.access_date); })
										.y(function(d) { return y(d.sum); })
										.curve(d3.curveLinear);

	image_path = lineChart.append("path")
								.datum(image_data)
								.attr("class", "image_line")
								.attr("d", image_valueline);

  // append brush area
  var brushView = context.append("g")
                         .attr("class", "brush")
                         .call(brush)
                         .call(brush.move, x.range());

  // append zoom area
  var zoomView = svg.append("rect")
                    .attr("class", "zoom-area")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .call(zoom);

  //  Label to display details (right top corner)
  var legendLabel = focus.append("g").attr("class", "legend-container");

	legendLabel.append("g")
						 .attr("transform", `translate(${width - 170}, ${20})`)
						 .attr("class", "legend-label1")
						 .append('circle')
						 .style('fill','var(--main)')
						 .style('stroke','var(--main)')
						 .attr('r', 7);

	d3.select('.legend-label1').append('text')
														 .html("CATEGORY VIEWS")
														 .attr("font-family", "monospace")
														 .attr("font-size", "13px")
														 .attr('text-anchor', 'start')
														 .attr('dy', '.32em')
														 .attr('dx', '15');

	legendLabel.append("g")
						 .attr("transform", `translate(${width - 170}, ${50})`)
						 .attr("class", "legend-label2")
						 .append('circle')
						 .style('fill','var(--accent-green)')
						 .style('stroke','var(--accent-green)')
						 .attr('r', 7);

	d3.select('.legend-label2').append('text')
														 .html("FILE VIEWS")
														 .attr("font-family", "monospace")
														 .attr("font-size", "13px")
														 .attr('text-anchor', 'start')
														 .attr('dy', '.3em')
														 .attr('dx', '15');

  // invert x values
  function getValueForPositionXFromData(xPosition) {
    var xValue = x.invert(xPosition);
    return xValue;
  }

  // invert y values
  function getValueForPositionYFromData(yPosition) {
    var yValue = y.invert(yPosition);
    return yValue;
  }


  // zoom behavior handler
  function zoomFunction() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
    var t = d3.event.transform;
    x.domain(t.rescaleX(x2).domain());
    path.attr("d", valueline);

		image_path.attr("d", image_valueline);

    gX.call(xAxis);
    // update dots
    let dots = focus.selectAll('.note-dot');
    // console.log(dots);
    dots.attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y);

    brushView.call(brush.move, x.range().map(t.invertX, t));
  }

  function brushFunction() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
    var s = d3.event.selection || x2.range();
    x.domain(s.map(x2.invert, x2));
    path.attr("d", valueline);
    image_path.attr("d", image_valueline);
    gX.call(xAxis);
    svg.select(".zoom-area")
       .call(zoom.transform, d3.zoomIdentity
       .scale(width / (s[1] - s[0]))
       .translate(-s[0], 0));
  }

  // window.hideFileLine = function() {
  //   d3.selectAll('.image_line').remove();
  //   y.domain([d3.min(data, function(d) { return d.views; }), d3.max(data, function(d) { return d.views; })]);
  //   // update main line chart
  //   path.transition().attr("d", valueline);
  //   SHOWN_IMAGE = false;
  // }
	//

}
