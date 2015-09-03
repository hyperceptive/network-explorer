'use strict';


function buildGraph(connections) {
  //Build the graph structure
  graph = new Graph();

  var columns = connections.meta.view.columns;

  //Add Nodes
  connections.data.forEach(function(nodeSets) {

    //Convert from array into object.
    var obj = nodeSets.reduce(function(o, v, i) {
      o[columns[i].name] = v;
      return o;
    }, {});

    //Group1
    // -- Lobbyist
    // -- Lobbyist Firm
    // -- Lobbyist Client
    var n1 = graph.addNode(obj.Lobbyist_Firm);

    if(typeof n1 !== 'undefined') {
      n1.code = obj.Lobbyist_Firm;
      n1.group = 1;
    }

    //Group2
    // -- Official
    // -- Official_Department
    var n2 = graph.addNode(obj.Official_Department);

    if(typeof n2 !== 'undefined') {
      n2.code = obj.Official_Department;
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

    var fromId = edgeObj.Lobbyist_Firm;
    var toId = edgeObj.Official_Department;
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

  if(selectedNode.group === 2) {
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

  tmpBubbles.sort(popularityDesc);

  var arcCount = 0;
  var bubbleCount = 0;

  //Loop over the bubbles and calculate the arcs.
  tmpBubbles.forEach(function(bubble) {
    var weight = graph.getAllEdgesOf(bubble.code).length;
    var bubbleAdded = false;
    var bubbleObj = {
      id: bubble.code,
      name: bubble.code,
      //fish: type: bubble.type,
      group: bubble.group,
      //fish: groupName: bubble.groupName,
      value: weight
    };

    //Get possible arcs for the current bubble.
    var tmpArcs = [];
    var tmpArcEdges = graph.getAllEdgesOf(bubble.code);
    tmpArcEdges.sort(weightDesc);
    tmpArcEdges.forEach(function(arcEdge) {
      tmpArcs.push(graph.getNode(arcEdge[arcId]));
    });

    tmpArcs.sort(popularityDesc); //TODO: sort by number of connections / edges

    tmpArcs.forEach(function(arc) {
      if(INCLUDE_FOCUS_ENTITY_IN_ARCS || focusEntity.name !== arc.code) {
        var edge;

        if(focusEntity.group === 1) {
          edge = graph.getEdge(arc.code, bubble.code);
        }
        else if(focusEntity.group === 2) {
          edge = graph.getEdge(bubble.code, arc.code)
        }

        if(typeof edge !== 'undefined') {
          if(!bubbleAdded && bubbleCount < MAX_BUBBLES) {
            bubbleData.push(bubbleObj);
            bubblesById[bubbleObj.id] = bubbleObj;
            bubbleAdded = true;
            bubbleCount++;
          }

          var arcObj = {
            id: arc.code,
            name: arc.code,
            //fish: type: arc.type,
            group: arc.group,
            //fish: groupName: arc.groupName,
            value: 1  //fish: use "arc.popularity" for arc size?
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

  arcData.sort(popularityDesc);

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


/*
function updateData(data) {
  vizName = data.eventTitle;
  vizType = data.eventSource + (data.eventDate ? ', ' + data.eventDate : '');

  buildGraph(data.nodeSets);
  buildTitleMap(data.titles);
  updateChartData();
}
*/


