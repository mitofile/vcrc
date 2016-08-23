/**
 * 
 */

function ScrollControl() {
	this.isScrolling = false;
	this.isVisible = false;
	this.currentScroll_py = 0;
	this.animation_transition = 100;
	this.container = undefined;
	this.row_scroll = 1;
	this.row_height = 206;
	this.items_per_row = 7;
	this.isTop = true;
	this.currentRow = 0;
	this.minVisibleRowIndex = 0;
	this.maxVisibleRowIndex = 0;
	this.visibleRows = 2;
}

ScrollControl.prototype.init = function(container) {
	this.container = container;
};

ScrollControl.prototype.scrollToCurrentPosition= function() {
	this.container.scrollTop(this.currentScroll_py);
};

ScrollControl.prototype.isTop = function() {
	return this.isTop;
};

ScrollControl.prototype.checkVisibleRows = function(item, callback ) {
	if (!this.isScrolling) {
		var nextRowIndex = item.cel;
		var minRowVisibleIndex = this.minVisibleRowIndex;
		var maxRowVisibleIndex = this.maxVisibleRowIndex;

		if(maxRowVisibleIndex === 0) {
			maxRowVisibleIndex = this.maxVisibleRowIndex = this.visibleRows;
		}

		if(nextRowIndex < minRowVisibleIndex || nextRowIndex > maxRowVisibleIndex) {
			this.scroll(item.direction, callback);
			this.minVisibleRowIndex = this.minVisibleRowIndex + item.direction;
			this.maxVisibleRowIndex = this.maxVisibleRowIndex + item.direction;
		} else {
			callback();
		}
		this.currentRow = nextRowIndex;
	}
};

ScrollControl.prototype.scroll = function(direction, callback) {
	var that = this;
	var scroll;
	if (direction >= 1) {
		scroll = this.row_height * this.row_scroll + this.currentScroll_py;
	} else {
		scroll = this.row_height * this.row_scroll * -1 + this.currentScroll_py;
	}

	this.currentScroll_py = scroll;

	if (!this.isScrolling) {
		this.isScrolling = true;

		this.container.animate({
			scrollTop : scroll + "px"
		}, {
			complete : function() {
				$('.item').keynavigator();
				that.isScrolling = false;
				callback();
			}
		},
		that.animation_transition);
	}
};

ScrollControl.prototype.reset = function() {
	this.container.scrollTop(0);
	this.isTop = true;
	this.minVisibleRowIndex = 0;
	this.maxVisibleRowIndex = 0;
	this.maxVisibleRowIndex = 0;
	this.currentRow = 0;
	this.currentScroll_py = 0;
};
