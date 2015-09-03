'use strict';


function buildGraph(connections) {
  //Build the graph structure
  graph = new Graph();

  var columns = connections.meta.view.columns;

  //Group1
  // -- Lobbyist
  // -- Lobbyist Firm
  // -- Lobbyist Client
  var group1 = 'Lobbyist_Firm';

  //Group2
  // -- Official
  // -- Official_Department
  var group2 = 'Official_Department';


  //Add Nodes
  connections.data.forEach(function(nodeSets) {

    //Convert from array into object.
    var obj = nodeSets.reduce(function(o, v, i) {
      o[columns[i].name] = v;
      return o;
    }, {});

    var n1 = graph.addNode(obj[group1]);

    if(typeof n1 !== 'undefined') {
      n1.id = obj[group1];
      n1.group = 1;
    }

    var n2 = graph.addNode(obj[group2]);

    if(typeof n2 !== 'undefined') {
      n2.id = obj[group2];
      n2.group = 2;
    }
  });

  //Add Edges
  connections.data.forEach(function(lobbyistsContact) {

    //Convert from array into object.
    var edgeObj = lobbyistsContact.reduce(function(o, v, i) {
      o[columns[i].name] = v;
      return o;
    }, {});

    var fromId = edgeObj[group1];
    var toId = edgeObj[group2];
    var edge = graph.getEdge(fromId, toId);

    if(edge) {
      edge.weight++;
      edge.weightList.push(edgeObj);
    }
    else {
      var newEdge = graph.addEdge(fromId, toId);
      newEdge.weightList = [];
      newEdge.weightList.push(edgeObj);
    }
  });
}

/*
function buildTitleMap(titles) {
  titleMap = {};

  titles.forEach(function(title) {
    var key = title.sourceCode + '_' + title.targetCode;
    if(!titleMap.hasOwnProperty(key)) {
      titleMap[key] = [];
    }

    if(title.title && title.title !== '') {
      titleMap[key].push(title.title);
    }
  });
}
*/


function addRelationship(map, id, relationship) {
  if(typeof map[id] === 'undefined') {
    map[id] = [];
  }
  map[id].push(relationship);
}



function weightDesc(a, b) {
  var a1 = a.weight;
  var b1 = b.weight;

  if(a1 < b1) {
    return 1;
  }
  else if(a1 > b1) {
    return -1;
  }
  return 0;
}

function popularityDesc(a, b) {
  var a1 = a.popularity;
  var b1 = b.popularity;

  if(a1 < b1) {
    return 1;
  }
  else if(a1 > b1) {
    return -1;
  }
  return 0;
}


function updateChartData() {
  arcData = [];
  arcDataById = {};
  bubbleData = [];
  bubblesById = {};
  relationships = [];
  relationshipsByArcId = {};
  relationshipsByBubbleId = {};

  var arcId = 'fromId',
      bubbleId = 'toId';

  if(focusEntity.group === 2) {
    arcId = 'toId';
    bubbleId = 'fromId';
  }

  //Get Bubbles for input entity
  var tmpBubbles = [];
  var tmpBubbleEdges = graph.getAllEdgesOf(focusEntity.name);
  tmpBubbleEdges.sort(weightDesc);
  tmpBubbleEdges.forEach(function(bubbleEdge) {
    tmpBubbles.push(graph.getNode(bubbleEdge[bubbleId]));
  });

  //fish: tmpBubbles.sort(popularityDesc);

  var arcCount = 0;
  var bubbleCount = 0;

  //Loop over the bubbles and calculate the arcs.
  tmpBubbles.forEach(function(bubble) {
    var weight = graph.getAllEdgesOf(bubble.id).length;
    var bubbleAdded = false;
    var bubbleObj = {
      id: bubble.id,
      name: bubble.id,
      group: bubble.group,
      value: weight
    };

    //Get possible arcs for the current bubble.
    var tmpArcs = [];
    var tmpArcEdges = graph.getAllEdgesOf(bubble.id);
    tmpArcEdges.sort(weightDesc);
    tmpArcEdges.forEach(function(arcEdge) {
      tmpArcs.push(graph.getNode(arcEdge[arcId]));
    });

    //fish: tmpArcs.sort(popularityDesc); //TODO: sort by number of connections / edges

    tmpArcs.forEach(function(arc) {
      if(INCLUDE_FOCUS_ENTITY_IN_ARCS || focusEntity.name !== arc.id) {
        var edge;

        if(focusEntity.group === 1) {
          edge = graph.getEdge(arc.id, bubble.id);
        }
        else if(focusEntity.group === 2) {
          edge = graph.getEdge(bubble.id, arc.id)
        }

        if(typeof edge !== 'undefined') {
          if(!bubbleAdded && bubbleCount < MAX_BUBBLES) {
            bubbleData.push(bubbleObj);
            bubblesById[bubbleObj.id] = bubbleObj;
            bubbleAdded = true;
            bubbleCount++;
          }

          var arcObj = {
            id: arc.id,
            name: arc.id,
            group: arc.group,
            value: 1
          };

          if(arcDataById[arcObj.id]) {
            //Only increment counter if Bubble was also added.
            if(bubblesById[bubbleObj.id]) {
              arcDataById[arcObj.id].value++; //fish: just count number of connections????
            }
          }
          else {
            if(arcCount < MAX_ARCS) {
              arcCount++;
              arcData.push(arcObj);
              arcDataById[arcObj.id] = arcObj;
            }
          }
        }
      }
    });
  });

  //fish: arcData.sort(popularityDesc);

  arcData.forEach(function(a) {
    bubbleData.forEach(function(b) {
      var edge;

      if(focusEntity.group === 1) {
        edge = graph.getEdge(a.id, b.id);
      }
      else if(focusEntity.group === 2) {
        edge = graph.getEdge(b.id, a.id)
      }

      if(typeof edge !== 'undefined') {
        //Add relationships between arcs and bubbles
        var relationship = {
          id: a.id + '_' + b.id,
          arcId: a.id,
          bubbleId: b.id
        };

        relationships.push(relationship);
        addRelationship(relationshipsByArcId, relationship.arcId, relationship);
        addRelationship(relationshipsByBubbleId, relationship.bubbleId, relationship);
      }
    });
  });

}

