'use strict';

var START_YEAR = 2014;

//Group1
// -- Lobbyist
// -- Lobbyist Firm
// -- Lobbyist Client
var GROUP1 = 'Lobbyist_Firm';

//Group2
// -- Official
// -- Official_Department
var GROUP2 = 'Official_Department';


//TODO: fish: pass in group id's.
function buildGraph(connections) {
  contentMap = {};

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

    if(parseInt(obj.Date.substr(0, 4)) >= START_YEAR) {
      addToContentMap(obj, obj[GROUP1], obj[GROUP2]);
      addToContentMap(obj, obj[GROUP2], obj[GROUP1]); //add both ways.

      var n1 = graph.addNode(obj[GROUP1]);

      if(typeof n1 !== 'undefined') {
        n1.id = obj[GROUP1];
        n1.group = 1;
      }

      var n2 = graph.addNode(obj[GROUP2]);

      if(typeof n2 !== 'undefined') {
        n2.id = obj[GROUP2];
        n2.group = 2;
      }
    }
  });

  //Add Edges
  connections.data.forEach(function(lobbyistsContact) {
    //Convert from array into object.
    var edgeObj = lobbyistsContact.reduce(function(o, v, i) {
      o[columns[i].name] = v;
      return o;
    }, {});

    if(parseInt(edgeObj.Date.substr(0, 4)) >= START_YEAR) {
      var fromId = edgeObj[GROUP1];
      var toId = edgeObj[GROUP2];
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
    }
  });

  //fish: Remove nodes with only a single connection...
  /*
  graph.forEachNode(function(nodeObject, nodeId) {
    if(graph.getAllEdgesOf(nodeId).length === 1) {
      console.log(graph.getAllEdgesOf(nodeId).length);
      graph.removeNode(nodeId);
    }
  });
  */

}


function addToContentMap(obj, GROUP1Id, GROUP2Id) {
  var key = GROUP1Id + '_' + GROUP2Id;

  if(!contentMap.hasOwnProperty(key)) {
    contentMap[key] = [];
  }

  var data = obj.LobbyingSubjectArea + ': ' + obj.MunicipalDecision; //fish: how to define this?

  if(contentMap[key].indexOf(data) === -1) {
    contentMap[key].push(data);
  }
}



function addRelationship(map, id, relationship) {
  if(typeof map[id] === 'undefined') {
    map[id] = [];
  }
  map[id].push(relationship);
}



function updateChartData(focusEntity, type) {
  arcData = [];
  arcDataById = {};
  bubbleData = [];
  bubblesById = {};
  relationships = [];
  relationshipsByArcId = {};
  relationshipsByBubbleId = {};

  //Handle drilling both ways (from arcs or bubbles).
  if(type === 'arc') {
    buildByArc(focusEntity);
  }
  else {
    buildByBubble(focusEntity);
  }

  //Remove unconnected Arcs and Bubbles.
  for(var i = arcData.length - 1; i >= 0; i--) {
    if(!relationshipsByArcId.hasOwnProperty(arcData[i].id)) {
      arcData.splice(i, 1);
    }
  }

  for(var j = bubbleData.length - 1; j >= 0; j--) {
    if(!relationshipsByBubbleId.hasOwnProperty(bubbleData[j].id)) {
      bubbleData.splice(j, 1);
    }
  }

}


function buildByArc(focusEntity) {
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

  //fish: tmpBubbles.sort(popularityDesc);  //Sory by some kind of popularity or relevance or interest.

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
              arcDataById[arcObj.id].value++; //just count number of connections
            }
          }
          else {
            if(arcCount < MAX_ARCS || (INCLUDE_FOCUS_ENTITY_IN_ARCS && focusEntity.name === arc.id)) {
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



function buildByBubble(focusEntity) {
  var arcId = 'toId',
      bubbleId = 'fromId';

  if(focusEntity.group === 2) {
    arcId = 'fromId';
    bubbleId = 'toId';
  }

  //Get Arcs for input entity
  var tmpArcs = [];
  var tmpArcEdges = graph.getAllEdgesOf(focusEntity.name);
  tmpArcEdges.sort(weightDesc);
  tmpArcEdges.forEach(function(arcEdge) {
    tmpArcs.push(graph.getNode(arcEdge[arcId]));
  });

  var arcCount = 0;
  var bubbleCount = 0;

  //Loop over the arcs and calculate the bubbles.
  tmpArcs.forEach(function(arc) {
    var arcAdded = false;
    var arcObj = {
      id: arc.id,
      name: arc.id,
      group: arc.group,
      value: 0
    };

    //Get possible Bubbles for the current Arc.
    var tmpBubbles = [];
    var tmpBubbleEdges = graph.getAllEdgesOf(arc.id);
    tmpBubbleEdges.sort(weightDesc);
    tmpBubbleEdges.forEach(function(bubbleEdge) {
      tmpBubbles.push(graph.getNode(bubbleEdge[bubbleId]));
    });

    tmpBubbles.forEach(function(bubble) {
      if(INCLUDE_FOCUS_ENTITY_IN_ARCS || focusEntity.name !== bubble.id) {
        var edge;

        //If group 1 will be the bubble.
        if(focusEntity.group === 1) {
          edge = graph.getEdge(bubble.id, arc.id)
        }
        else if(focusEntity.group === 2) {
          edge = graph.getEdge(arc.id, bubble.id);
        }

        if(typeof edge !== 'undefined') {
          if(!arcAdded && arcCount < MAX_ARCS) {
            arcData.push(arcObj);
            arcDataById[arcObj.id] = arcObj;
            arcAdded = true;
            arcCount++;
          }

          var weight = graph.getAllEdgesOf(bubble.id).length;

          var bubbleObj = {
            id: bubble.id,
            name: bubble.id,
            group: bubble.group,
            value: weight
          };

          if(bubblesById[bubble.id]) {
            if(arcDataById[arcObj.id]) {
              arcDataById[arcObj.id].value++; //just count number of connections
            }
          }
          else {
            if(bubbleCount < MAX_BUBBLES || (INCLUDE_FOCUS_ENTITY_IN_ARCS && focusEntity.name === bubble.id)) {
              bubbleCount++;
              bubbleData.push(bubbleObj);
              bubblesById[bubbleObj.id] = bubbleObj;
              arcDataById[arcObj.id].value++; //just count number of connections
            }
          }
        }
      }
    });
  });

  arcData.forEach(function(a) {
    bubbleData.forEach(function(b) {
      var edge;

      if(focusEntity.group === 1) {
        edge = graph.getEdge(b.id, a.id)
      }
      else if(focusEntity.group === 2) {
        edge = graph.getEdge(a.id, b.id);
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
