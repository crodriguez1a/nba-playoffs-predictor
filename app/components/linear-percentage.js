import Ember from "ember";

/**
  Linear Percentage component

  `linear-percentage` generates a percentage displayed as a single bar

  @class LinearPercentage
*/
export default Ember.Component.extend({
  tagName: 'div',
  classNames: ['linear-percentage'],
  classNameBindings: ['teamcolors'],
  percent: null,
  setPercentage: function() {
    var self = this;
    Ember.run.schedule('afterRender', function() {
      var el = self.$().find('.bar');
      el.css({
        width: (self.get('percent') * self.$().width()) + '%'
      });
    });
  }.on('didInsertElement')
});
