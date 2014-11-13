'use strict';
var graph = {
    map: {},
    nodes: [],
    edges: [],
    refs: []
};
var h = $(window).height();
var w = $(window).width();
var svg = d3.select('svg');
var color = d3.scale.category20();
var force = d3.layout.force().
    size([w, h]).
    linkStrength(0.7).
    linkDistance(15).
    friction(0.95).
    charge(-5).
    gravity(0.01).
    theta(0.8).
    alpha(0.2);
    
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
            return d;
        });
        graph.edges = $.map(data.edges, function (d,id) {
            d.source_id = d.source;
            d.target_id = d.target;
            d.source = graph.map[d.source_id];
            d.target = graph.map[d.target_id];
            return d;
        });
        graph.refs = $.map(data.refs, function (d,id) {
            return {
                'name': id,
                'commit': graph.nodes[graph.map[d]]
            };
        });
        force.
            nodes(graph.nodes).
            links(graph.edges).
            start();

        var link = svg.selectAll(".edge").
            data(graph.edges).
            enter().append("line").
            attr("class", "edge");

        var node = svg.selectAll(".node").
            data(graph.nodes).
            enter().append("circle").
            attr("class", "node").
            attr("r", 5).
            attr('fill', function (d) { return color(d.author_email); }).
            call(force.drag);

        var ref = svg.selectAll(".ref").
            data(graph.refs).
            enter().append("text").
            attr("class", "ref").
            attr("font-family", 'sans-serif').
            attr("font-size", 16).
            attr('fill', 'darkgray').
            text(function (d) { return d.name; });

        force.on("tick", function() {
            link.
                attr("x1", function(d) { return d.source.x; }).
                attr("y1", function(d) { return d.source.y; }).
                attr("x2", function(d) { return d.target.x; }).
                attr("y2", function(d) { return d.target.y; });
            node.
                attr("cx", function(d) { return d.x; }).
                attr("cy", function(d) { return d.y; });
            ref.
                attr('x', function (d) { return d.commit.x + 8; }).
                attr('y', function (d) { return d.commit.y + 4; });
        });
    }
});
