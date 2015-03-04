import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('predictor', { path : '/' });
  this.route('not-found', { path: '/*path' });
  this.route('contest', { path: '/contest' });

});

export default Router;
