import Ember from "ember";

/**
  Detail Loader component

  `detail-loader` generates a loader animation for AJAX calls where full page loader isn't needed

  @class DetailLoaderComponent
*/
export default Ember.Component.extend({
  tagName: 'div',
  classNames: ['detail-loader'],
  centered: false,
  light: false,
  progress: false,
  classNameBindings: ['centered','light','progress']
});
