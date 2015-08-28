
var width = 1400,
    height = 800;

var color = d3.scale.category10();



//Construct a force layout...
var force = d3.layout.force()
    .size([width, height])
    //.linkDistance(400)
    /*
    .linkStrength(function(d) {
      console.log(d.value);
      return 0.5;
    }) */
    .gravity(0) //0.9
    .charge(0) //-300
    //.chargeDistance(600)
    ;


/* defaults:
    .linkStrength(0.1)  //or 1?
    .friction(0.9)
    .linkDistance(20)
    .charge(-30)
    .gravity(0.1)
    .theta(0.8)
    .alpha(0.1)

*/




var drag = force.drag().on('dragstart', dragstart);

//Drag fixes the node's position.
function dragstart(d) {
  var dragNode = d3.select(this);
  dragNode.classed('fixed', d.fixed = true);
  dragNode
    .select('.label')
    .attr('opacity', 1.0);
}

//Double-click removes the node's fixed position.
function dblclick(d) {
  var dragNode = d3.select(this);
  dragNode.classed('fixed', d.fixed = false);
  dragNode
    .select('.label')
    .attr('opacity', 0);
}



var svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);


d3.json('data/lobbyistsContacts.json', function(error, lobbyistsContacts) {
  if(error) throw error;

  var columns = lobbyistsContacts.meta.view.columns;

  //Create the structures needed by d3 force layout.
  //
  //  TODO: Maybe move this code to the Graph data structure and use (new) methods
  //        of the Graph class to export into d3 format for force layout.
  //

  var nodes = [];
  var links = [];

  var foci = [{x: 200, y: 350}, {x: 1200, y: 350}];

  graph = new Graph();

  //Build Nodes
  lobbyistsContacts.data.forEach(function(nodeSets) {

    //Convert from array into object.
    var obj = nodeSets.reduce(function(o, v, i) {
      o[columns[i].name] = v;
      return o;
    }, {});

    //Nodes for:
    //Lobbyist: 'Yaki, Michael'
    //Lobbyist_Client: 'Barneys New York'
    //Lobbyist_Firm: 'Michael Yaki'
    //Official: 'Yuen, Janis'
    //Official_Department: 'Municipal Transportation Agency'

    // -- Lobbyist
    // -- Lobbyist Firm
    // -- Lobbyist Client
    var n1 = graph.addNode(obj.Lobbyist_Firm);

    if(typeof n1 !== 'undefined') {
      n1.group = 1;
    }

    // -- Official
    // -- Official_Department
    var n2 = graph.addNode(obj.Official_Department);

    if(typeof n2 !== 'undefined') {
      n2.group = 2;
    }

    /*
      Date: '2014-11-30T00:00:00'

      DesiredOutcome: 'enforcement of prior settlement agreement; mitigation of construction impact on Store Operations in Union Square'

      FileNumber: 'n/a'

      LobbyingSubjectArea: 'Transportation'

      Lobbyist: 'Yaki, Michael'
      Lobbyist_Client: 'Barneys New York'
      Lobbyist_Firm: 'Michael Yaki'

      MunicipalDecision: 'Construction Impact Of Central Subway'

      Official: 'Yuen, Janis'
      Official_Department: 'Municipal Transportation Agency'

      created_at: 1417625821
      created_meta: '400501'
      id: 'C1C7C9DB-0108-4F5B-8915-7F4D89A632BA'
      meta: null
      position: 262349
      sid: 262349
      updated_at: 1417625821
      updated_meta: '400501'
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
      var newEdge = graph.addEdge(fromId, toId);
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
      .attr('class', 'link');

  var node = svg.selectAll('.node')
      .data(nodes)
    .enter().append('g')
      .attr('class', 'node')
      .on('dblclick', dblclick)
      .on('mouseover', function (d) { onMouseOver(d); })
      .on('mouseout', function (d) { onMouseOut(); })
      .call(drag);

  node.append('circle')
      .attr('r', function(d) {
        var cx = width / 4;
        var cy = height / 3;

        if(d.group === 2) {
          cx = (width / 2) + cx;
        }

        d.x = cx;
        d.y = cy;

        d.radius = (d.weight <= 5 ? 5 : d.weight);
        d.radius = d.radius / 2;
        return d.radius;
      })
      .style('fill', function(d) {
        /*
        if(d.group === 1) {
          return '#27aae1';
        }
        else {
          return '#231f20';
        }
        */
        return color(d.group);
      });


  var label = node.append('text')
      .attr('class', 'label')
      .attr('dx', 8) //change position based on circle size.
      .attr('dy', '.35em')
      .attr('opacity', 0)
      .text(function(d) { return (d.name + ' (' + d.weight + ')'); });


  force.on('tick', function(e) {
    link.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

    node.selectAll('circle')
        .each(cluster(.2 * e.alpha))
        .each(collide(.5))
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });

    node.selectAll('text')
      .attr('x', function (d) { return d.x; })
      .attr('y', function (d) { return d.y; });


  });






  //Cluster the 2 groups around a point.
  function cluster(alpha) {
    return function(d) {
      var cx = width / 4;
      var cy = height / 3;

      if(d.group === 2) {
        cx = (width / 2) + cx;
      }

      d.y += (cy - d.y) * alpha;
      d.x += (cx - d.x) * alpha;
    };
  }

  // Resolve collisions between nodes.
  var padding = 1; // separation between circles

  function collide(alpha) {
    var quadtree = d3.geom.quadtree(nodes);
    return function(d) {
      var r = d.radius*2 + padding,  //fish: + maxRadius
          nx1 = d.x - r,
          nx2 = d.x + r,
          ny1 = d.y - r,
          ny2 = d.y + r;

      quadtree.visit(function(quad, x1, y1, x2, y2) {
        if(quad.point && (quad.point !== d)) {
          var x = d.x - quad.point.x,
              y = d.y - quad.point.y,
              l = Math.sqrt(x * x + y * y),
              r = d.radius + quad.point.radius + padding;

          if(l < r) {
            l = (l - r) / l * alpha;
            d.x -= x *= l;
            d.y -= y *= l;
            quad.point.x += x;
            quad.point.y += y;
          }
        }
        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    };
  }




  //Create an index of connections between nodes
  var linkedByIndex = {};
  for(i = 0; i < nodes.length; i++) {
    linkedByIndex[i + ',' + i] = 1;
  };
  links.forEach(function (d) {
    linkedByIndex[d.source.index + ',' + d.target.index] = 1;
  });

  function connected(a, b) {
    return linkedByIndex[a.index + ',' + b.index];
  }


  //Highlight by reducing opacity of non-connected nodes
  function onMouseOver(d) {
    node.style('opacity', function (o) {
      return connected(d, o) | connected(o, d) ? 1 : 0.1;
    });

    label.style('opacity', function (o) {
      return connected(d, o) | connected(o, d) ? 1 : 0.1;
    });

    link.style('opacity', function (o) {
      return d.index === o.source.index | d.index === o.target.index ? 1 : 0.1;
    });
  }

  //Remove highlight
  function onMouseOut() {
    node.style('opacity', 1);
    link.style('opacity', 1);

    label.style('opacity', function(d) {
      if(typeof d.fixed !== 'undefined') {
        return 1.0;
      }
      return 0.0;
    });
  }



});
