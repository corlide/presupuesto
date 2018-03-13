$(function(){
    onPageLoad('2017');
});
function onPageLoad(year) {

	var $tooltip = $('<div class="tooltip">Tooltip</div>');
	$('.bubbletree').append($tooltip);
	$tooltip.hide();
	var getTooltip = function() {
		return this.getAttribute('tooltip');
	};
	var initTooltip = function(node, domnode) {
		domnode.setAttribute('tooltip', node.label+' &nbsp;<br /><big><b>'+node.famount+'</b></big>');
		vis4.log(domnode+domnode.getAttribute('tooltip'));
		$(domnode).tooltip({ delay: 200, bodyHandler: getTooltip });
	};



	var dataLoaded = function(data) {
	
		var amount = 0;
		data.forEach(function	(a){
			a.label	= a['administrative_classification_2.div1'];
			a.name	= a['administrative_classification_2.cod1'];
			a.id = a['administrative_classification_2.cod1'];
			a.taxonomy	= "cofog-1";
			a.amount = Math.round(a['total.sum']);
			a.children.forEach(function	(b){
				b.label	= b['administrative_classification_3.div2'];
				b.name	= b['administrative_classification_3.cod2'];
				b.id	= b['administrative_classification_3.cod2'];
				b.taxonomy	= "cofog-2";
				b.amount = Math.round(b['total.sum']);
				b.children.forEach(function	(c){
					c.label	= c['administrative_classification_4.div3'];
					c.name	= c['administrative_classification_4.cod3'];
					c.id	= c['administrative_classification_4.cod3'];
					c.taxonomy	= "cofog-3";
					c.amount = Math.round(c['total.sum']);
				});
			});
		amount += a.amount;
			
		});


		//console.log("data : ", {"label": "Total", "name": "O","amount": 4044775, "taxonomy": "cofog-0", "children": data});
		window.bubbleTree = new BubbleTree({
			data: {"label": "Ejecución de gastos Medellín " + year, "name": "O", "id":"m0", "amount": amount, "taxonomy": "cofog-0", "children": data},
			container: '.bubbletree',
			bubbleType: 'icon',
			//initTooltip: initTooltip,
			bubbleStyles: {
				'cofog-0': BubbleTree.Styles.Cofog,
				'cofog-1': BubbleTree.Styles.Cofog,
				'cofog-2': BubbleTree.Styles.Cofog,
				'cofog-3': BubbleTree.Styles.Cofog
			},
			rootPath: 'https://cdn.rawgit.com/corlide/presupuesto/master/styles/icons/',
			sortBy: 'label',
			tooltip:{
				qtip: true,
				delay: 300,
				content: function(node){
					return [node.label, '<div class="amount">'+node.famount+' de pesos'+'</div>'];
				}

			},
			
		});
	
	};


	// call openspending api for data
	new OpenSpending.Aggregator({
		apiUrl: 'https://openspending.org/api/3/cubes/',
		dataset: '869946c9a45402563543251e6b8f9c2a:ejecucionmedellin',
		rootNodeLabel: 'Grant total',
		labels: ['administrative_classification_2.div1', 'administrative_classification_3.div2', 'administrative_classification_4.div3' ],
		drilldowns: ['administrative_classification_2.cod1', 'administrative_classification_3.cod2', 'administrative_classification_4.cod3' ],
		cuts: ['date_2.year:'+year],
		breakdown: 'region',
		measure: 'amount',
		// localApiCache: 'aggregate.json',
		callback: dataLoaded

	});

};
