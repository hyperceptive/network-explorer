/*
  Created by Hyperceptive LLC

*/
'use strict';

var nodes,
    links,
    force,
    drag,
    group1top,
    group2top;


function buildForceDirectedGraph(height, width, svgId, data) {

  //Construct a force layout...
  force = d3.layout.force()
      .size([width, height])
      .linkDistance(width/10)
      .linkStrength(function(d) {
        return 0.3;
      })
      .gravity(0.15) //0.2
      .charge(-width/10) //-100, -300
      //.chargeDistance(240)
      //.alpha(0.1)
      ;

  drag = force.drag()
        .on('dragstart', dragstart);

  var svgChartLeft = d3.select(svgId)
      .attr('width', width)
      .attr('height', height);

  svgChartLeft.selectAll('*').remove();

  buildGraph(data);

  //From the graph, create the structures needed by d3 force layout.
  //
  //  TODO: Maybe move this code to the Graph data structure and use (new) methods
  //        of the Graph class to export into d3 format for force layout.
  //
  nodes = [];
  links = [];

  var indexByName = {};
  var i = 0;

  var cy = height / 3;

  graph.forEachNode(function(nodeObject, nodeId) {
    var cx = width / 4;

    if(nodeObject.group === 2) {
      cx = (width / 2) + cx;
    }

    nodes.push({ name: nodeId, group: nodeObject.group, x: cx, y: cy }); //Set initial position
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

  if(displayTop5) {
    findTop5();
  }

  force
      .nodes(nodes)
      .links(links)
      .start();

  var link = svgChartLeft.selectAll('.link')
      .data(links)
    .enter().append('line')
      .attr('class', 'link');

  var node = svgChartLeft.selectAll('.node')
      .data(nodes)
    .enter().append('g')
      .attr('id', function (d) { return d.name.replace(/&/g, ''); })
      .attr('class', 'node')
      .on('dblclick', dblclick)
      .on('mouseover', function (d) { onMouseOver(d); })
      .on('mouseout', function (d) { onMouseOut(d); })
      .on('contextmenu', function(d, i) { contextMenu(d, i); })
      .call(drag);

  node.append('circle')
      .attr('r', function(d) {
        //set top5 to fixed
        if(typeof d.top5 !== 'undefined' && d.top5) {
          d.fixed = true;
          //Set parent 'g' class to fixed.
          var dNode = d3.select(this.parentNode);
          dNode.classed('fixed', d.fixed = true);
        }

        d.radius = (d.weight <= 5 ? 5 : d.weight);
        d.radius = d.radius / 2;
        return d.radius;
      })
      .style('fill', function(d) {
        if(d.group === 1) {
          return '#27aae1'; //blue
        }
        else {
          return '#f57c22'; //orange
        }
      });


  var label = node.append('text')
      .text(function(d) { return (d.name + ' (' + d.weight + ')'); })
      .attr('class', 'label')
      .attr('dx', function(d) {
        var textLength = this.getComputedTextLength();
        return -(textLength/2); //centered
      })
      .attr('dy', '.35em')
      .attr('opacity', function(d) {
        if(d.fixed) {
          return 1.0;
        }
        else {
          return 0;
        }
      });


  force.on('tick', function(e) {
    link.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });

    node.selectAll('circle')
        //fish: .each(cluster(.2 * e.alpha))
        .each(collide(0.5)) //was .5
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });

    node.selectAll('text')
      .attr('x', function (d) { return d.x; })
      .attr('y', function (d) { return d.y; });
  });


  //Create an index of connections between nodes
  var linkedByIndex = {};
  for(i = 0; i < nodes.length; i++) {
    linkedByIndex[i + ',' + i] = 1;
  };
  links.forEach(function (d) {
    linkedByIndex[d.source.index + ',' + d.target.index] = 1;
  });

  function connected(a, b) {
    return linkedByIndex[a.index + ',' + b.index] || linkedByIndex[b.index + ',' + a.index];
  }

  //Highlight by reducing opacity of non-connected nodes
  function onMouseOver(d) {
    node.attr('class', function(o) {
      var fadeClass = 'fadePartialOutOpacity';

      if(connected(d, o)) {
        fadeClass = 'fadeInOpacity';
      }

      return d3.select(this).attr("class") + ' ' + fadeClass;
    });

    label.attr('class', function(o) {
      var fadeClass = 'fadeOutOpacity';

      if(d.name === o.name || (typeof o.fixed !== 'undefined' && o.fixed)) {
        fadeClass = 'fadeInOpacity';
      }
      else if(connected(d, o)) {
        fadeClass = 'fadeInPartially';
      }

      return d3.select(this).attr("class") + ' ' + fadeClass;
    });

    link.attr('class', function(o) {
      var fadeClass = 'fadePartialOutOpacity';

      if(d.index === o.source.index || d.index === o.target.index) {
        fadeClass = 'fadeInOpacity';
      }

      return d3.select(this).attr("class") + ' ' + fadeClass;
    });


    /* original
    node.style('opacity', function (o) {
      return connected(d, o) ? 1 : 0.1;
    });

    label.style('opacity', function (o) {
      if(d.name === o.name) {
        return 1;
      }
      //return connected(d, o) ? 0.7 : 0;
      return 0;
    });

    link.style('opacity', function (o) {
      return d.index === o.source.index | d.index === o.target.index ? 1 : 0.1;
    });
    */
  }

  //Remove highlight
  function onMouseOut(d) {
    node.classed('fadeInOpacity', true);
    node.classed('fadePartialOutOpacity', false);

    label.classed('fadeInOpacity', false);
    label.classed('fadeInPartially', false);
    label.classed('fadeOutOpacity', false);

    label.attr('class', function(o) {
      var fadeClass = '';

      if(d.name === o.name && typeof d.fixed !== 'undefined' && d.fixed) {
        fadeClass = 'fadeInOpacity';
      }

      return d3.select(this).attr("class") + ' ' + fadeClass;
    });

    link.classed('fadeInOpacity', true);
    link.classed('fadePartialOutOpacity', false);

    /* original
    node.style('opacity', 1);
    link.style('opacity', 1);

    label.style('opacity', function(d) {
      if(typeof d.fixed !== 'undefined' && d.fixed) {
        return 1.0;
      }
      return 0.0;
    });
    */
  }


  d3.select('body')
    .on('mousemove', mousemove);

}


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
var padding = 30; // separation between circles

function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodes);
  return function(d) {
    var r = (d.radius * 2) + padding,
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


//Drag fixes the node's position.
function dragstart(d) {
  force.stop(); //fish:????

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


function findTop5() {
  group1top = [];
  group2top = [];

  nodes.forEach(function(node) {
    if(node.group === 1) {
      group1top.push(node);
    }
    else if(node.group === 2) {
      group2top.push(node);
    }
  });

  group1top.sort(graphWeightDesc);
  group2top.sort(graphWeightDesc);

  group1top = group1top.slice(0, 5);
  group2top = group2top.slice(0, 5);


  var yPositions = [];
  var segment = height / 6;

  for(var i=1; i < 6; i++) {
    yPositions.push(segment * i);
  }

  group1top.forEach(function(g1, i1) {
    g1.top5 = true;
    g1.y = yPositions[i1];
  });

  group2top.forEach(function(g2, i2) {
    g2.top5 = true;
    g2.y = yPositions[i2];
  });

}


//Re-build with initial value for top5. (Arrange Top 5)
var displayTop5 = false;

//Set fixed position for top 5 nodes of each group
function arrange() {
  displayTop5 = !displayTop5;

  var btn = d3.select('#arrangeBtn').node();

  if(displayTop5) {
    btn.textContent = 'Release';
  }
  else {
    btn.textContent = 'Arrange Top 5';
  }

  buildGraphVisual();
}



//Context Menu
var contextMenuOpen = false;
var selectedNode = null;
var timer = null;

var connectionsTable = null;
var detailsTable = null;

//Context Menu - handle right click
function contextMenu(d, i) {
  d3.event.preventDefault(); //stop showing browser menu

  selectedNode = d;

  var x = d3.event.pageX,
      y = d3.event.pageY;

  d3.select('#context_menu')
    .style('left', x + 'px')
    .style('top', y + 'px')
    .style('display', 'block');

  contextMenuOpen = true;
}


function mousemove() {
  if(contextMenuOpen) {
    var coordinates = d3.mouse(d3.select('#context_menu').node());

    var x = coordinates[0],
        y = coordinates[1];

    var menu = document.getElementById('context_menu_list');

    var menuHeight = menu.offsetHeight,
        menuWidth = menu.offsetWidth;

    //If outside, set timer unless it already exists...
    if(x < 0 || y < 0 || x > menuWidth || y > menuHeight) {
      if(!timer) {
        timer = setInterval(hideContextMenu, 1000);
      }
    }
    //If inside, remove timer...
    else {
      if(timer) {
        clearInterval(timer);
        timer = null;
      }
    }
  }
}

//Hide Context Menu if mouse is outside.
function hideContextMenu() {
  if(timer) {
    clearInterval(timer);
    timer = null;
  }

  d3.select('#context_menu')
    .style('display', 'none');

  contextMenuOpen = false;
}

