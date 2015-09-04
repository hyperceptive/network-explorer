/**
 * Graph Data Structure with d3 extensions.
 *
 *
 * TODO: fish:  Add way to export d3 force layout nodes and links from this Graph.
 *
 *
 */

'use strict';

var Graph,
    hasProp = {}.hasOwnProperty;

Graph = (function() {
  /*eslint-disable */
  function Graph() {
    this.nodes = {};
    this.nodeSize = 0;
    this.edgeSize = 0;
  }
  /*eslint-enable */

  /**
   * Add a Node to the graph with a unique id.
   * Returns the node to which you can add properties.
   *
   */
  Graph.prototype.addNode = function(id) {
    if(!this.nodes[id]) {
      this.nodeSize++;

      this.nodes[id] = {
        outEdges: {},
        inEdges: {}
      };

      return this.nodes[id];
    }
  };

  /**
   * Return the Node in the graph with the given id.
   *
   */
  Graph.prototype.getNode = function(id) {
    return this.nodes[id];
  };


  /**
   * Remove the Node from the graph with the id.
   * Return the Node object or undefined if it did not exist.
   *
   */
  Graph.prototype.removeNode = function(id) {
    var inEdgeId, nodeToRemove, outEdgeId, ref, ref1;

    nodeToRemove = this.nodes[id];

    if(!nodeToRemove) {
      return undefined;
    }
    else {
      ref = nodeToRemove.outEdges;

      for(outEdgeId in ref) {
        if(!hasProp.call(ref, outEdgeId)) {
          continue;
        }
        this.removeEdge(id, outEdgeId);
      }
      ref1 = nodeToRemove.inEdges;
      for(inEdgeId in ref1) {
        if(!hasProp.call(ref1, inEdgeId)) {
          continue;
        }
        this.removeEdge(inEdgeId, id);
      }
      this.nodeSize--;
      delete this.nodes[id];
    }
    return nodeToRemove;
  };


  /**
   * Add an edge to the Graph from nodes fromId to toId with weight.
   * Returns the created edge object.
   * Returns undefined if either node does not exist,
   *  or if an edge already exists between these two nodes.
   *
   */
  Graph.prototype.addEdge = function(fromId, toId, weight) {
    var edgeToAdd, fromNode, toNode;

    if(weight == null) {
      weight = 1;
    }

    if(this.getEdge(fromId, toId)) {
      return undefined;
    }

    fromNode = this.nodes[fromId];
    toNode = this.nodes[toId];

    if(!fromNode || !toNode) {
      return undefined;
    }

    edgeToAdd = {
      fromId: fromId,
      toId: toId,
      weight: weight
    };

    fromNode.outEdges[toId] = edgeToAdd;
    toNode.inEdges[fromId] = edgeToAdd;
    this.edgeSize++;

    return edgeToAdd;
  };


  /**
   * Get the edge from node fromId to node toId.
   * Return undefined if either from or to id nodes are not found.
   *
   */
  Graph.prototype.getEdge = function(fromId, toId) {
    var fromNode, toNode;

    fromNode = this.nodes[fromId];
    toNode = this.nodes[toId];

    if(fromNode && toNode) {
      return fromNode.outEdges[toId];
    }
  };


  /**
   * Remove the edge from node fromId to node toId.
   * Return the removed edge object.
   * Return undefined if the edge was not found.
   *
   */
  Graph.prototype.removeEdge = function(fromId, toId) {
    var edgeToDelete, fromNode, toNode;

    fromNode = this.nodes[fromId];
    toNode = this.nodes[toId];

    edgeToDelete = this.getEdge(fromId, toId);

    if(!edgeToDelete) {
      return undefined;
    }

    delete fromNode.outEdges[toId];
    delete toNode.inEdges[fromId];
    this.edgeSize--;

    return edgeToDelete;
  };


  /**
   * Return an array of edge objects directed toward teh node.
   * Return an empty array if no node or no edges exist.
   *
   */
  Graph.prototype.getInEdgesOf = function(nodeId) {
    var fromId, inEdges, toNode, ref;

    toNode = this.nodes[nodeId];
    inEdges = [];

    ref = toNode != null ? toNode.inEdges : void 0;

    for(fromId in ref) {
      if(!hasProp.call(ref, fromId)) {
        continue;
      }
      inEdges.push(this.getEdge(fromId, nodeId));
    }

    return inEdges;
  };


  /**
   * Return an array of the edge objects that go out of node id.
   * Return an empty array if no node or no edges exist.
   *
   */
  Graph.prototype.getOutEdgesOf = function(nodeId) {
    var fromNode, outEdges, toId, ref;

    fromNode = this.nodes[nodeId];
    outEdges = [];
    ref = fromNode != null ? fromNode.outEdges : void 0;

    for(toId in ref) {
      if(!hasProp.call(ref, toId)) {
        continue;
      }
      outEdges.push(this.getEdge(nodeId, toId));
    }

    return outEdges;
  };


  /**
   * Return an array of edge objects linked to this node -- incoming or outgoing.
   * Duplicate edges created by self-pointing nodes are removed.
   * Return an empty array if no node or edges exist.
   *
   */
  Graph.prototype.getAllEdgesOf = function(nodeId) {
    var i, j, inEdges, outEdges, selfEdge, ref, ref1;

    inEdges = this.getInEdgesOf(nodeId);
    outEdges = this.getOutEdgesOf(nodeId);

    if(inEdges.length === 0) {
      return outEdges;
    }

    selfEdge = this.getEdge(nodeId, nodeId);

    /*eslint-disable */
    for(i = j = 0, ref = inEdges.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
      if(inEdges[i] === selfEdge) {
        ref1 = [inEdges[inEdges.length - 1], inEdges[i]], inEdges[i] = ref1[0], inEdges[inEdges.length - 1] = ref1[1];
        inEdges.pop();
        break;
      }
    }
    /*eslint-enable */

    return inEdges.concat(outEdges);
  };


  /**
   * Arbitrarily traverse the graph visiting each node once.
   * Callback function should have the form: cb(nodeObject, nodeId)
   *
   */
  Graph.prototype.forEachNode = function(cb) {
    var nodeId, nodeObject, ref;

    ref = this.nodes;

    for(nodeId in ref) {
      if(!hasProp.call(ref, nodeId)) {
        continue;
      }

      nodeObject = ref[nodeId];
      cb(nodeObject, nodeId);
    }
  };


  /**
   * Arbitrarily traverse the graph visiting each edge once.
   * Callback function should have the form: cb(edgeObject)
   *
   */
  Graph.prototype.forEachEdge = function(cb) {
    var edgeObject, nodeId, nodeObject, toId, ref, ref1;

    ref = this.nodes;

    for(nodeId in ref) {
      if(!hasProp.call(ref, nodeId)) {
        continue;
      }

      nodeObject = ref[nodeId];
      ref1 = nodeObject.outEdges;

      for(toId in ref1) {
        if(!hasProp.call(ref1, toId)) {
          continue;
        }

        edgeObject = ref1[toId];
        cb(edgeObject);
      }
    }
  };

  return Graph;

})();
