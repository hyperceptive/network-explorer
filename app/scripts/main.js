console.log('yo!');

var width = 960,
    height = 500;

var color = d3.scale.category20();

var force = d3.layout.force()
    .charge(-120)
    .linkDistance(80)
    .size([width, height]);

var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

d3.json('data/miserables.json', function(error, graph) {
  if (error) throw error;

  console.log('-------------- Les Mis *gag* --------------'); //fish
  console.log(graph.nodes[0]);
  console.log(graph.links[0]);

  force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

  var link = svg.selectAll('.link')
      .data(graph.links)
    .enter().append('line')
      .attr('class', 'link')
      .style('stroke-width', function(d) { return Math.sqrt(d.value); });

  var node = svg.selectAll('.node')
      .data(graph.nodes)
    .enter().append('circle')
      .attr('class', 'node')
      .attr('r', 5)
      .style('fill', function(d) { return color(d.group); })
      .call(force.drag);

  node.append('title')
      .text(function(d) { return d.name; });

  force.on('tick', function() {
    link.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

    node.attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });
  });
});



d3.json('data/lobbyistsContacts.json', function(error, lobbyistsContacts) {

  console.log('-------------- Lobbyists Contacts * double gag* --------------'); //fish
  console.log(lobbyistsContacts.meta.view.columns);


  var columns = lobbyistsContacts.meta.view.columns;

  //TODO: fish: Create the structures needed by d3 force layout.
  //
  //  Maybe we can just create the Graph data structure and use (new) methods
  //  of the Graph class to export into d3 format for force layout.
  //

  //{ name: "Myriel", group: 1 }
  var nodes = [];

  //{ source: 1, target: 0, value: 1 }
  var links = [];


  //Build Nodes
  lobbyistsContacts.data.forEach(function(lobbyistsContact) {

    var obj = lobbyistsContact.reduce(function(o, v, i) {
      o[columns[i].name] = v;
      return o;
    }, {});

    console.log(obj);

  });




});



