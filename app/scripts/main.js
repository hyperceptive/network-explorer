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


/*
d3.json('data/miserables.json', function(error, graph) {
  if (error) throw error;

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
*/


d3.json('data/lobbyistsContacts.json', function(error, lobbyistsContacts) {
  if (error) throw error;

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

  graph = new Graph();

  //Build Nodes
  lobbyistsContacts.data.forEach(function(nodeSets) {

    //Convert from array into object.
    var obj = nodeSets.reduce(function(o, v, i) {
      o[columns[i].name] = v;
      return o;
    }, {});

    //Nodes for:
    //Lobbyist: "Yaki, Michael"
    //Lobbyist_Client: "Barneys New York"
    //Lobbyist_Firm: "Michael Yaki"
    //Official: "Yuen, Janis"
    //Official_Department: "Municipal Transportation Agency"

    // -- Lobbyist
    // -- Lobbyist Firm
    // -- Lobbyist Client
    var n1 = graph.addNode(obj.Lobbyist_Firm);

    if(typeof n1 !== 'undefined') {
      //n1.name = obj.Lobbyist_Firm;
      n1.group = 1;
    }

    // -- Official
    // -- Official_Department
    var n2 = graph.addNode(obj.Official_Department);

    if(typeof n2 !== 'undefined') {
      //n2.name = obj.Official_Department;
      n2.group = 2;
    }

    /*
      Date: "2014-11-30T00:00:00"

      DesiredOutcome: "enforcement of prior settlement agreement; mitigation of construction impact on Store Operations in Union Square"

      FileNumber: "n/a"

      LobbyingSubjectArea: "Transportation"

      Lobbyist: "Yaki, Michael"
      Lobbyist_Client: "Barneys New York"
      Lobbyist_Firm: "Michael Yaki"

      MunicipalDecision: "Construction Impact Of Central Subway"

      Official: "Yuen, Janis"
      Official_Department: "Municipal Transportation Agency"

      created_at: 1417625821
      created_meta: "400501"
      id: "C1C7C9DB-0108-4F5B-8915-7F4D89A632BA"
      meta: null
      position: 262349
      sid: 262349
      updated_at: 1417625821
      updated_meta: "400501"
    */
  });


  //Add Edges
  lobbyistsContacts.data.forEach(function(lobbyistsContact) {

    //Convert from array into object.
    var edgeObj = lobbyistsContact.reduce(function(o, v, i) {
      o[columns[i].name] = v;
      return o;
    }, {});

    var fromId = edgeObj.Lobbyist_Firm;
    var toId = edgeObj.Official_Department;
    var edge = graph.getEdge(fromId, toId);

    if(edge) {
      edge.weight++;
    }
    else {
      graph.addEdge(fromId, toId);
    }
  });

  //Create nodes and edges arrays for d3 force layout.
  var indexByName = {};
  var i = 0;

  graph.forEachNode(function(nodeObject, nodeId) {
    nodes.push({ name: nodeId, group: nodeObject.group });
    indexByName[nodeId] = i;
    i++;
  });

  graph.forEachNode(function(nodeObject, nodeId) {
    if(nodeObject.group === 1) {
      var outEdges = graph.getOutEdgesOf(nodeId);
      outEdges.forEach(function(theEdge) {
        links.push({ source: indexByName[theEdge.fromId], target: indexByName[theEdge.toId], value: theEdge.weight });
      });
    }
  });




  force
      .nodes(nodes)
      .links(links)
      .start();

  var link = svg.selectAll('.link')
      .data(links)
    .enter().append('line')
      .attr('class', 'link')
      .style('stroke-width', function(d) { return Math.sqrt(d.value); });

  var node = svg.selectAll('.node')
      .data(nodes)
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



