'use strict';
function lerp(a, b, f) {
    return a + f * (b - a);
}
var graph = {
    map: {},
    nodes: [],
    edges: [],
    refs: [],
    commitRefCounts: {},
    authors: {
    	list: [],
    	emailMap: {},
    	nameMap: {},
    	add: function (email, name) {
    		var author;
    		if (this.emailMap[email]) {
    			return;
    		}
    		author = {
    			email: email,
    			name: name
    		};
			this.emailMap[email] = author;
			this.nameMap[name] = author;
    		author.index = this.list.push(author) - 1;
    	}
    },
    timestamp: {
    	list: [],
    	min: Infinity,
    	max: -Infinity,
    	delta: 0,
    	update: function (t) {
    		this.list.push(t);
    		this.min = Math.min(t, this.min);
    		this.max = Math.max(t, this.max);
    		this.delta = this.max - this.min
    	},
    	sort: function () {
    		this.list.sort();
    	}
    }
};
var h = $(window).height();
var w = $(window).width();
var legend = d3.select('#legend');
var svg = d3.select('svg');
var container = svg.append('g');
var color = d3.scale.category10();
var force = d3.layout.force().
    size([w, h]).
    linkStrength(2).
    linkDistance(32).
    friction(0.8).
    charge(0).
    gravity(0).
    theta(0.6).
    alpha(0.1);
var zoom = d3.behavior.zoom().
	scaleExtent([0.01,2]).
	on('zoom', zoomed);

svg.call(zoom);
    
$.ajax({
    'url': '/data.json',
    'success': function (data) {
        $('h1').text(data.name);
    }
});

$.ajax({
    'url': '/repo/graph_data.json',
    'success': function (data) {
        var i = 0;
        graph.nodes = $.map(data.nodes, function (d,id) {
            graph.map[id] = i++;
            graph.timestamp.update(d.authored_timestamp);
            graph.authors.add(d.author_email, d.author_name);
            return d;
        });
        graph.timestamp.sort();
        graph.nodes.forEach(function (d, i) {
        	d.author = graph.authors.emailMap[d.author_email];
            //d.target_x = (d.authored_timestamp - graph.timestamp.min)/100;
            d.target_x = graph.timestamp.list.indexOf(d.authored_timestamp) * 32;
            d.target_y = (d.author.index * 64);
		});
        graph.edges = $.map(data.edges, function (d,id) {
            d.source_id = d.source;
            d.target_id = d.target;
            d.source = graph.map[d.source_id];
            d.target = graph.map[d.target_id];
            return d;
        });
        graph.refs = $.map(data.refs, function (d,id) {
        	var commit = graph.nodes[graph.map[d]],
        		commitRefIndex = (graph.commitRefCounts[commit.tree] || 0);
        	graph.commitRefCounts[commit.tree] = commitRefIndex + 1;
            return {
                'name': id,
                'commit': commit,
                'commitRefIndex': commitRefIndex
            };
        });
        

        force.
            nodes(graph.nodes).
            links(graph.edges).
            start();

        var link = container.selectAll(".edge").
            data(graph.edges).
            enter().append("line").
            attr("class", "edge").
            attr("marker-start", "url(#markerArrow)").
            attr('stroke', function (d) {
            	return color(d.source.author_email);
            });

        var node = container.selectAll(".node").
            data(graph.nodes).
            enter().append("circle").
            attr("class", "node").
            attr("r", 3).
            //attr('fill', function (d) { return color(d.author_email); }).
            call(force.drag);

        var ref = container.selectAll(".ref").
            data(graph.refs).
            enter().append("text").
            attr("class", "ref").
            attr("font-family", 'sans-serif').
            attr("font-size", 16).
            attr('fill', function (d) {
            	return d.name.match(/^origin\//) ? 'red' : 'green'
            }).
            text(function (d) { return d.name; });
        
        var authors = legend.selectAll(".author").
        	data(graph.authors.list).
        	enter().append("div").
        	attr("class", "author").
        	attr("style", function (d) { return "color: " + color(d.email); }).
        	text(function (d) {
        		return d.name + ' (' + d.email + ')';
        	});

        force.on("tick", function(e) {
        	graph.nodes.forEach(function(d) {
        		var k = 0.1 * e.alpha;
        		//d.x += (d.target_x - d.x) * k;
        		d.x = d.target_x;
        		d.y += (d.target_y - d.y) * k;
        		//d.y = d.target_y;
        	});
        	
            link.
                attr("x1", function(d) { return d.source.x; }).
                attr("y1", function(d) { return d.source.y; }).
                attr("x2", function(d) { return d.target.x; }).
                attr("y2", function(d) { return d.target.y; });
            node.
                attr("cx", function(d) { return d.x; }).
                attr("cy", function(d) { return d.y; });
            ref.
                attr('x', function (d) { return d.commit.x; }).
                attr('y', function (d) {
                	return d.commit.y + 20 + 18 * d.commitRefIndex;
                });
        });
    }
});

function zoomed() {
	container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}
