import Ember from 'ember';


/**
  Application controller

  @class ApplicationController
*/
export default Ember.Controller.extend({
  needs: ['bracket', 'application'],
  year: moment().format('YYYY')
});
