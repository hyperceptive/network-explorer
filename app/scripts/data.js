'use strict';


function buildGraph(nodeSets) {
  graph = new Graph();

  var nodeSetsMax = nodeSets.length - 1;
  var highestRelevance = 0;

  //Add Nodes
  nodeSets.forEach(function(nodeSet, i) {
    var obj = { level: i, name: nodeSet.name, list: [], groups: {} };

    vizLevelByIndex[i] = obj;

    nodeSet.list.forEach(function(node) {
      obj.list.push({
        name: (node.name ? node.name : node.code),
        relevance: node.relevance,
        popularity: node.popularity,
        group: node.group,
        groupName: node.groupName
      });

      if(!obj.groups[node.group]) {
        obj.groups[node.group] = { name: node.groupName, list: [] };
      }

      obj.groups[node.group].list.push(node.name);

      var newNode = graph.addNode(node.code);
      newNode.code = node.code;
      newNode.name = (node.name ? node.name : node.code);
      newNode.type = nodeSet.name;
      newNode.relevance = node.relevance;
      newNode.popularity = node.popularity;
      newNode.group = node.group;
      newNode.groupName = node.groupName;

      //Initial Focus Entity has the highest relevance
      if(newNode.relevance > highestRelevance) {
        highestRelevance = newNode.relevance;
        focusEntity = newNode;
      }
    });

    obj.list.sort(popularityDesc);
  });

  //Add Edges
  nodeSets.forEach(function(nodeSet, nodeSetIndex) {
    nodeSet.list.forEach(function(node) {
      var toSetIndex = (nodeSetIndex === nodeSetsMax ? 0 : nodeSetIndex + 1);
      node.connections.forEach(function(connection, connectionIndex) {
        if(connection !== 0) {
          graph.addEdge(node.code, nodeSets[toSetIndex].list[connectionIndex].code, connection);
        }
      });
    });
  });
}


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

  //Get Bubbles for the focusEntity
  var tmpBubbles = [];
  var tmpBubbleEdges = graph.getInEdgesOf(focusEntity.code);
  tmpBubbleEdges.sort(weightDesc);
  tmpBubbleEdges.forEach(function(bubbleEdge) {
    tmpBubbles.push(graph.getNode(bubbleEdge.fromId));
  });

  tmpBubbles.sort(popularityDesc);

  var arcCount = 0;
  var bubbleCount = 0;

  //Loop over the bubbles and calculate the arcs.
  tmpBubbles.forEach(function(bubble) {
    var bubbleAdded = false;
    var bubbleObj = {
      id: bubble.code,
      name: bubble.name,
      type: bubble.type,
      group: bubble.group,
      groupName: bubble.groupName,
      value: bubble.popularity
    };

    //Get possible arcs for the current bubble.
    var tmpArcs = [];
    var tmpArcEdges = graph.getOutEdgesOf(bubble.code);
    tmpArcEdges.sort(weightDesc);
    tmpArcEdges.forEach(function(arcEdge) {
      tmpArcs.push(graph.getNode(arcEdge.toId));
    });

    tmpArcs.sort(popularityDesc);

    tmpArcs.forEach(function(arc) {
      if(INCLUDE_FOCUS_ENTITY_IN_ARCS || focusEntity.code !== arc.code) {
        var edge = graph.getEdge(arc.code, bubble.code);

        if(typeof edge !== 'undefined') {
          if(!bubbleAdded && bubbleCount < MAX_BUBBLES) {
            bubbleData.push(bubbleObj);
            bubblesById[bubbleObj.id] = bubbleObj;
            bubbleAdded = true;
            bubbleCount++;
          }

          var arcObj = {
            id: arc.code,
            name: arc.name,
            type: arc.type,
            group: arc.group,
            groupName: arc.groupName,
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
      var edge = graph.getEdge(a.id, b.id);
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


function updateData(data) {
  vizName = data.eventTitle;
  vizType = data.eventSource + (data.eventDate ? ', ' + data.eventDate : '');

  buildGraph(data.nodeSets);
  buildTitleMap(data.titles);
  updateChartData();
}



function loadJson(url, cb) {
  d3.json(url, function(error, data) {
    if(cb) { cb(data); }
  });
}





