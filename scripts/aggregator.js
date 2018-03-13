var OpenSpending = OpenSpending || {};
 
(function ($) {
 
  var defaultConfig = {
    siteUrl: 'http://openspending.org',
    dataset: 'cra',
    drilldowns: ['cofog1', 'cofog2', 'cofog3'],
    cuts: ['year:2008'],
    breakdown: 'region',
    rootNodeLabel: 'Total',
    localApiCache: 'aggregate.json',
    measure: 'amount',
    processEntry: function(e) { return e; },
    callback: function (tree) {}
  };

  OpenSpending.aggregatorConfigFromQueryString = function(queryString) {
    if (queryString) {
      var parts = parseQueryString(queryString);
    } else {
      var parts = parseQueryString();
    }
    var out = {};
    _.each(parts, function(item) {
      var key = item[0];
      var value = item[1];
      if (key == 'breakdown') {
        out.breakdown = value;
      } else if (key == 'drilldown') {
        out.drilldowns = value.split('|');
      } else if (key == 'cut') {
        out.cuts = value.split('|');
      }
    });
    return out;
  };

  OpenSpending.Aggregator = function (customConfig) {
    
    var self = this;
    self.config = customConfig ? customConfig : defaultConfig;
    if (!self.config.processEntry) {
      self.config.processEntry = defaultConfig.processEntry;
    }
    if (!self.config.measure) {
      self.config.measure = 'amount';
    }
    
    self.queryData = function (c) {
      config = self.config;
      var data = {};
      var resp = {};
      data.drilldown = [];
     


      config.drilldowns.forEach(function(a){

        if (c !== a) {
          data.drilldown.push(a);
          data.drilldown.push(config.labels[Math.round(data.drilldown.length/2)-1]);
          
               
        }
        else
        {
          data.drilldown.push(a);
          data.drilldown.push(config.labels[Math.round(data.drilldown.length/2)-1]);

          resp = 'drilldown='+data.drilldown.join('|');
                   
        }

      });

return resp

    };


    
    self.getTree = function (c) {
        var data = self.queryData(c) + '&cut=' + self.config.cuts;
        //var key = window.btoa($.param(data)).replace(/\=/g, '');
        $.ajax({
          url: self.config.apiUrl + self.config.dataset + '/aggregate',
          //cache: true,

          data: data,
          //jsonpCallback: 'aggregate_' + key,
          dataType: 'json',
          context: self,
          success: function (data){
            self.onJSONTreeLoaded(c, data);
          },
          complete: self.buildTree
        });

      };

    self.getCSVURL = function() {
        var url = self.queryUrl();
        var data = self.queryData();
        data['format'] = 'csv';
        return url + '?' + $.param(data);
      };
      /**
       *
       *
       */
    self.onJSONTreeLoaded = function (c, data) {
   
      self.config[c] = data.cells;

        //var tree = self.buildTree(data);

        //if (c==self.config.drilldowns[2]) {
          //self.buildTree();
        //}
      };

      /**
       * Build a tree form the drill down entries
       *
       * @public buildTree
       *
       * @param {object} data The json object responded from the
       * aggregate api.
       * @param {array} drilldowns List of drilldown criteria (strings)
       * @param {object} rootNode (optional) Pass an object with properties
       * for the root node. Maybe you want to set 'color' (default: #555) or
       * the 'label' (default: 'Total')
       **/
      self.buildTree = function () {
  
      
        var firstData = self.config[self.config.drilldowns[0]];
        var secondData = self.config[self.config.drilldowns[1]];
        var thirdData = self.config[self.config.drilldowns[2]];
      
   

        secondData.forEach(function(s){
          thirdData.forEach(function(t){
               if(s[self.config.drilldowns[1]] == t[self.config.drilldowns[1]]){ 
               
                 if (!s.children) {
                  s.children = [];
                 }
                 s.children.push(t);
               }
          });
        });

        firstData.forEach(function(u){
          secondData.forEach(function(v){
               if(u[self.config.drilldowns[0]]== v[self.config.drilldowns[0]]){ 
                
                 if (!u.children) {
                  u.children = [];
                 }
                 u.children.push(v);
               }
          });
        });
        

         if ($.isFunction(self.config.callback)) {
          self.config.callback(firstData);
        }

      };


      /**
       *  Add a node for each drilldown to the 'nodes' object
       *  Process the nodes to have:
       *  * The summed up measure
       *  * A children array
       *  * A color property
       *  * An unique id
       *
       *  @method processEntry
       *  @param {object} entry The entry in the list of drill downs
       *  @param {object} node The node to which we save the breakdown
       *  @return {undefined}
       */
      self.addBreakdown = function (node, entry) {
        var breakdown = self.config.breakdown;
        if (breakdown === undefined) {

          return;
        }

        var breakdown_value, breakdown_node, node_template, nodes = {},
          id;
        breakdown_value = entry[breakdown];
        node_template = self.toNode(breakdown_value);
        id = node_template.id;
        breakdown_node = node.breakdowns[id];
        if (breakdown_node === undefined) {
          breakdown_node = node_template;
          node.breakdowns[id] = breakdown_node;
        }
        breakdown_node[self.config.measure] = breakdown_node[self.config.measure] + entry[self.config.measure];


      };

      self.toNode = function (value, parent) {
        var type = typeof (value);

        var node = {};
        prefix = parent ? parent.id + '__' : '';
        if (value === undefined || value === null) {
          node.id = 'others';
          node.label = 'Others';
          node.name = 'others';
        } else if (type === 'object') {
          if (value.id === undefined) {
            node.id = 'others';
            node.label = 'Others';
            node.name = 'others';
          } else {
            $.extend(true, node, value);
            if (!node.name) {
              if (node.label) {
                node.name = node.label.toLowerCase().replace(/\W/g, "-");
              } else {
                node.name = node.id;
              }
            }
          }
        } else if (type === 'boolean') {
          if (value) {
            node.id = 'yes';
            node.label = 'Yes';
            node.name = 'yes';
          } else {
            node.id = 'no';
            node.label = 'No';
            node.name = 'no';
          }
        } else if (type === 'string' || type === 'number') {
          node.id = value + '';
          node.label = value + '';
          node.name = node.id.toLowerCase().replace(/\W/g, "-");
        } else {
          throw 'unsupported type: ' + type;
        }
        node.id = prefix + node.id;
        node[self.config.measure] = 0.0;
        return node;
      };


    self.config.drilldowns.forEach(function(c){
    self.getTree(c);
    });
    
    
  };

}(jQuery));