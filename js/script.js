$(function(){

	window.visiblePortion = 0;

	$(window).scroll(function(){
		window.positionDiscussions();
	});

	window.allowPositionDiscussions = function() {
		window.positionDiscussionsAllowed = true;
		window.positionDiscussionsTimeout = setTimeout(window.allowPositionDiscussions,30);
	}
	window.allowPositionDiscussions();

	$("body").click(function(){
		if($(this).hasClass('dynamicScrollingOff')){
			$(this).removeClass('dynamicScrollingOff');
			window.allowPositionDiscussions();
			window.positionDiscussions();
		} else {
			$(this).addClass('dynamicScrollingOff');
			$("div.fixedPos").removeClass('fixedPos');
			window.positionDiscussionsAllowed = false;
			clearTimeout(window.positionDiscussionsTimeout);
		}
		return false;
	});

	window.positionDiscussions = function(){
		//var date = new Date();
		if(window.positionDiscussionsAllowed){
			window.positionDiscussionsAllowed = false;
			var scrollTop = $(window).scrollTop();
			for(var i = 0; i < window.fixableDItems.length; i++){
				$itemWrap = $(window.fixableDItems[i].el).find("div.dItemWrap");
				if(scrollTop > window.fixableDItems[i].startFixPos && scrollTop < window.fixableDItems[i].stopTransitionPos){
					if(!$itemWrap.hasClass('fixedPos')){
						$itemWrap.addClass('fixedPos');
					}
					if(scrollTop < window.fixableDItems[i].startTransitionPos){
						$itemWrap.css('top',window.fixableDItems[i].fixedTop+'px');
					} else {
						$itemWrap.css('top',(window.fixableDItems[i].fixedTop-(scrollTop-window.fixableDItems[i].startTransitionPos))+'px');
					}
				} else {
					if($itemWrap.hasClass('fixedPos')){
						$itemWrap.removeClass('fixedPos');
						$itemWrap.css('top','0px');
					}
				}
			}
		}
	};

	window.precalculateItems = function() {
		window.fixableDItems = [];
		var fixedCids = [];
		var tempFixableDItems = [];
		for(var i = 0; i < window.dItemViews.length; i++){
			var e = window.dItemViews[i];
		 	e.isFixedAble();
		}
	};

	window.dItem = Backbone.Model.extend({

		initialize: function(attrs) {
			if(attrs.parentItemView){
				this.set({ level: attrs.parentItemView.model.get('level') + 1 });
				if(!attrs.parentItemView.model.attributes.childrenItems){
					attrs.parentItemView.model.attributes.childrenItems = [];
				}
			}
		},
		
		defaults: function() {
			return {
				id: null,
				level: 0,
				childrenItems: null,
				parentItemView: null,
				text: '',
				user: {
					id: 2,
					name: 'James'
				},
				timestamp: 0
			};
		}

	});

	window.dItemList = Backbone.Collection.extend({
		model: window.dItem
	});

	window.dItemView = Backbone.View.extend({

		tagName: 'li',
		template: _.template($("#dItem-template").html()),

		events: {
			"click a.upVote": "upVote",
			"click div.dItem": "goToFixedItem"
		},

		upVote: function() {
			return false;	
		},

		goToFixedItem: function(){
			if(this.$("div.dItemWrap").hasClass('fixedPos')){
				$(window).scrollTop(this.startFixPos);
			}
			return false;
		},

		initialize: function(model) {
			this.model = model;
			if(this.model.get('parentItemView')){
				this.model.get('parentItemView').attributes.childrenItems.push(this);
			}
		},

		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			$(this.el).addClass('l'+this.model.get('level'));
			return this;
		},

		forceHeight: function() {
			$(this.el).height(this.$("div.dItemWrap").outerHeight(true));
		},

		isFixedAble: function() {
			var childrenItems = this.model.get('childrenItems');
			if(childrenItems && childrenItems.length>1){
				this.setFixAble();
				return true;
			}
			return false;
		},

		setFixAble: function() {
			window.fixableDItems.push(this);
			var parentItemView = this.model.get('parentItemView')
			if(parentItemView){
				parentItemView.setFixAble();
			}
			this.precalculateValues();
		},

		precalculateValues: function() {
			var off = $(this.el).offset();
			this.offTop = off.top;
			this.fixedTop = this.getFixedTop();
			this.startFixPos = off.top - this.getTotalParentHeight();
			this.startTransitionPos = this.startFixPos + (this.getLastChildsOffset() - off.top - $(this.el).height()) + 28;// - this.sumLastChildrenHeight();
			this.stopTransitionPos = this.startTransitionPos + $(this.el).height() + this.getTotalParentHeight();
		},

		getFixedTop: function() {
			//if(this.model.get('level')==0)
			//	return 0;
			var parentItemView = this.model.get('parentItemView')
			if(parentItemView)
				return $(parentItemView.el).height() + parentItemView.getFixedTop() - 28;
			else
				return 0;
		},

		getTotalParentHeight: function() {
			var parentItemView = this.model.get('parentItemView')
			if(parentItemView){
				return $(parentItemView.el).height() + parentItemView.getTotalParentHeight() - 28;
			} else {
				return 0;
			}
		},

		sumLastChildrenHeight: function() {
			var childrenItems = this.model.get('childrenItems');
			if(childrenItems){
				return childrenItems[childrenItems.length-1].sumLastChildrenHeight()+$(childrenItems[childrenItems.length-1].el).height();
			} else {
				return 0;
			}
		},

		getLastChildsOffset: function() {
			var childrenItems = this.model.get('childrenItems');
			if(childrenItems){
				return childrenItems[childrenItems.length-1].getLastChildsOffset();
			} else {
				var off = $(this.el).offset();
				return off.top + $(this.el).height();
			}
		}

	});

	window.createDiscussionItem = function(text,user,parentElement){
		if(parentElement==undefined){
			parentElement=null;
		}
		if(user==undefined){
			var newDiscussionItem = new dItem({parentItemView: parentElement, text: text});
		} else {
			var newDiscussionItem = new dItem({parentItemView: parentElement, text: text, user: user});
		}
		var newDiscussionItemView = new dItemView(newDiscussionItem);
		window.dItems.add(newDiscussionItem);
		window.dItemViews.push(newDiscussionItemView);
		$("ul.discussionContainer").append(newDiscussionItemView.render().el);
		newDiscussionItemView.forceHeight();
		return newDiscussionItemView;
	}

	window.dItems = new dItemList();
	window.dItemViews = [];
	window.fixableDItems = [];

	var user1 = { name: 'ajw1675' };
	var user2 = { name: 'Se7en_Sinner' };
	var user3 = { name: 'Skibum04' };
	var user4 = { name: 'DrHeinous' };
	var user5 = { name: 'starbuxed' };
	var user6 = { name: 'thefloppydog' };
	var user7 = { name: 'Zoltar23' };
	var user8 = { name: 'L4RIVIE3R' };
	var user9 = { name: 'denedeh' };

	var newItem = createDiscussionItem('They lose and gain roughly that number of domains every week.',user1);
		var newItem2 = createDiscussionItem('Another bplaner pointed out that they have actually gained registers during the week.',user2,newItem);
			var newItem3 = createDiscussionItem('But I upvoted the Reddit posts! How can this be?!?!',user3,newItem2);
				var newItem4 = createDiscussionItem('WHY AM I NOT IMPORTANT?!',user4,newItem3);
					var newItem5 = createDiscussionItem('WHY ARE MY ARBITRARY MOUSE CLICKS NOT IMPORTANT?',user5,newItem4);
						var newItem6 = createDiscussionItem('Is there an echo? HELLO???',user4,newItem5);
		var newItem2 = createDiscussionItem('Great presents come from happy trees.',user6,newItem);
		var newItem2 = createDiscussionItem('Oh do they now?',user7,newItem);

	var newItem = createDiscussionItem('They need to lose more domains. Their support for SOPA is seriously ridiculous. How can we better round up people to fight against this injustice?',user9);
		var newItem2 = createDiscussionItem('Well, you could start by making a blog or backplane',user6,newItem);
		var newItem2 = createDiscussionItem('Lets make a backplane now, I will gather the followers, you do the hard work',user9,newItem);
		var newItem3 = createDiscussionItem('Just release the apes. RELEASE THEM I SAY.',user4,newItem2);
			var newItem4 = createDiscussionItem('How about teh coperz?',user1,newItem2);
		var newItem5 = createDiscussionItem('It isn\'t that ridiculous. They are allowed to support what they want. This is what america is for, pal.',user3,newItem2);
			var newItem6 = createDiscussionItem('America is not for supporting corruption',user4,newItem5);
			var newItem6 = createDiscussionItem('And this is why, sir, you are a patriot.',user3,newItem5);
			var newItem6 = createDiscussionItem('I would disagree. There is a difference between freedom of speech and freedom of oppression.',user1,newItem5);
			var newItem6 = createDiscussionItem('Monkeys like bananas',user2,newItem5);
			var newItem6 = createDiscussionItem('Will someone ban this guy? He is seriously annoying',user8,newItem6);
		var newItem2 = createDiscussionItem('You have an ass for a face.',user8,newItem);

	var newItem = createDiscussionItem('They need to lose more domains. Their support for SOPA is seriously ridiculous. How can we better round up people to fight against this injustice?',user9);
		var newItem2 = createDiscussionItem('Well, you could start by making a blog or backplane',user6,newItem);
		var newItem2 = createDiscussionItem('Lets make a backplane now, I will gather the followers, you do the hard work',user9,newItem);
		var newItem2 = createDiscussionItem('Just release the apes. RELEASE THEM I SAY.',user4,newItem);
			var newItem3 = createDiscussionItem('How about teh coperz?',user1,newItem2);
		var newItem2 = createDiscussionItem('It isn\'t that ridiculous. They are allowed to support what they want. This is what america is for, pal.',user3,newItem);
		var newItem2 = createDiscussionItem('You have an ass for a face.',user8,newItem);

	var newItem = createDiscussionItem('They need to lose more domains. Their support for SOPA is seriously ridiculous. How can we better round up people to fight against this injustice?',user9);
		var newItem2 = createDiscussionItem('Well, you could start by making a blog or backplane',user6,newItem);
		var newItem2 = createDiscussionItem('Lets make a backplane now, I will gather the followers, you do the hard work',user9,newItem);
		var newItem2 = createDiscussionItem('Just release the apes. RELEASE THEM I SAY.',user4,newItem);
			var newItem3 = createDiscussionItem('How about teh coperz?',user1,newItem2);
		var newItem2 = createDiscussionItem('It isn\'t that ridiculous. They are allowed to support what they want. This is what america is for, pal.',user3,newItem);
		var newItem2 = createDiscussionItem('You have an ass for a face.',user8,newItem);


	window.precalculateItems();
	window.positionDiscussions();

});
